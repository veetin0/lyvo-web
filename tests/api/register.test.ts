import bcrypt from "bcryptjs";
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFrom = vi.fn();
const mockCreateClient = vi.fn(() => ({
  from: mockFrom,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

const loadRoute = async () => {
  vi.resetModules();
  return import("@/app/api/register/route");
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("POST /api/register", () => {
  it("rejects invalid email addresses", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "invalid-email",
          password: "ValidPass123!",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("kelvollinen");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects weak passwords", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "user@example.com",
          password: "weakpass",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Salasanan");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects duplicate emails", async () => {
    const existingResponse = { data: [{ id: "existing-user" }], error: null };
    const selectMock = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue(existingResponse),
    });
    mockFrom.mockImplementation(() => ({
      select: selectMock,
      insert: vi.fn(),
    }));

    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "taken@example.com",
          password: "ValidPass123!",
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Sähköposti");
    expect(mockFrom).toHaveBeenCalledWith("User");
    expect(selectMock).toHaveBeenCalledWith("id");
  });

  it("creates user with hashed password when data is valid", async () => {
    const normalizedEmail = "newuser@example.com";
    const existingResponse = { data: [], error: null };
    const inMock = vi.fn().mockResolvedValue(existingResponse);
    const selectMock = vi.fn().mockReturnValue({ in: inMock });

    interface UserInsertRow {
      id: string;
      name: string;
      email: string;
      passwordHash: string;
    }

    let capturedInsertPayload: UserInsertRow[] | undefined;
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: "new-user", name: "Test User", email: normalizedEmail },
      error: null,
    });
    const selectAfterInsertMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockImplementation((rows: UserInsertRow[]) => {
      capturedInsertPayload = rows;
      return { select: selectAfterInsertMock };
    });

    mockFrom.mockImplementation(() => ({
      select: selectMock,
      insert: insertMock,
    }));

    const { POST } = await loadRoute();

    const rawPassword = "ValidPass123!";
    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: " Test   User ",
          email: "NewUser@example.com",
          password: rawPassword,
        }),
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.user).toMatchObject({ email: normalizedEmail, name: "Test User" });

    expect(mockFrom).toHaveBeenCalledWith("User");
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(inMock).toHaveBeenCalledWith("email", [normalizedEmail, "NewUser@example.com"]);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(capturedInsertPayload).toBeDefined();

    const insertedRow = capturedInsertPayload?.[0];
    expect(insertedRow).toBeDefined();
    if (!insertedRow) {
      throw new Error("Expected insert payload to contain newly created user");
    }

    expect(insertedRow.name).toBe("Test User");
    expect(insertedRow.email).toBe(normalizedEmail);
    expect(insertedRow.passwordHash).toBeDefined();
    expect(insertedRow.passwordHash).not.toBe(rawPassword);
    expect(insertedRow.passwordHash.length).toBeGreaterThan(20);
    const passwordMatches = await bcrypt.compare(rawPassword, insertedRow.passwordHash);
    expect(passwordMatches).toBe(true);
  });
});
