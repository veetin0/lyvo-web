import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFrom = vi.fn();
const mockCreateClient = vi.fn(() => ({
  from: mockFrom,
}));

const compareMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: compareMock,
  },
  compare: compareMock,
}));

const loadModule = async () => {
  vi.resetModules();
  return import("@/app/api/auth/[...nextauth]/authorize");
};

beforeEach(() => {
  vi.clearAllMocks();
  compareMock.mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("authorizeWithSupabase", () => {
  it("returns null when credentials are missing", async () => {
    const { authorizeWithSupabase } = await loadModule();

    await expect(authorizeWithSupabase(undefined)).resolves.toBeNull();
    await expect(authorizeWithSupabase({ email: "" })).resolves.toBeNull();
    await expect(authorizeWithSupabase({ password: "pass" })).resolves.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns null when no user is found", async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const { authorizeWithSupabase } = await loadModule();

    await expect(
      authorizeWithSupabase({ email: "user@example.com", password: "ValidPass123!" })
    ).resolves.toBeNull();

    expect(mockFrom).toHaveBeenCalledWith("User");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(eqMock).toHaveBeenCalledWith("email", "user@example.com");
    expect(singleMock).toHaveBeenCalled();
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("returns null when password comparison fails", async () => {
    compareMock.mockResolvedValue(false);
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: "id", email: "user@example.com", name: "User", passwordHash: "hash" },
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const { authorizeWithSupabase } = await loadModule();

    await expect(
      authorizeWithSupabase({ email: "user@example.com", password: "WrongPass123!" })
    ).resolves.toBeNull();

    expect(compareMock).toHaveBeenCalledWith("WrongPass123!", "hash");
  });

  it("returns user when credentials are valid", async () => {
    compareMock.mockResolvedValue(true);
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: "id",
        email: "user@example.com",
        name: "User",
        passwordHash: "hash",
      },
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const { authorizeWithSupabase } = await loadModule();

    await expect(
      authorizeWithSupabase({ email: "User@Example.com", password: "ValidPass123!" })
    ).resolves.toEqual({ id: "id", email: "user@example.com", name: "User" });

    expect(mockFrom).toHaveBeenCalledWith("User");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(eqMock).toHaveBeenCalledWith("email", "user@example.com");
    expect(compareMock).toHaveBeenCalledWith("ValidPass123!", "hash");
  });
});
