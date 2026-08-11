import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFrom = vi.fn();
const mockCreateClient = vi.fn(() => ({ from: mockFrom }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
  compare: vi.fn(),
}));

const loadModule = async () => {
  vi.resetModules();
  return import("@/app/api/auth/[...nextauth]/authorize");
};

/**
 * A tiny stand-in for the User table. Lookups match on the exact stored value,
 * so a caller that forgets to normalise an address simply will not find the row
 * — which is the behaviour these tests care about.
 */
const createUserTable = (rows: Array<{ id: string; email: string }>) => {
  const state = [...rows];
  const selectFilters: Record<string, unknown>[] = [];
  const inserted: Record<string, unknown>[] = [];
  let insertError: { message: string } | null = null;

  mockFrom.mockImplementation((table: string) => {
    if (table !== "User") {
      throw new Error(`Unexpected table ${table}`);
    }

    return {
      select() {
        const filters: Record<string, unknown> = {};
        const builder = {
          eq(column: string, value: unknown) {
            filters[column] = value;
            return builder;
          },
          async maybeSingle() {
            selectFilters.push({ ...filters });
            const hit = state.find((row) =>
              Object.entries(filters).every(([key, value]) => row[key as "id" | "email"] === value)
            );
            return { data: hit ?? null, error: null };
          },
        };
        return builder;
      },
      insert(rowsToInsert: Record<string, unknown>[]) {
        return {
          select() {
            return {
              async maybeSingle() {
                if (insertError) {
                  // Simulate the unique-email conflict a concurrent sign-in causes.
                  return { data: null, error: insertError };
                }
                const row = rowsToInsert[0];
                inserted.push(row);
                state.push({ id: row.id as string, email: row.email as string });
                return { data: { id: row.id }, error: null };
              },
            };
          },
        };
      },
    };
  });

  return {
    rows: state,
    inserted,
    selectFilters,
    failNextInsert: (error: { message: string }) => {
      insertError = error;
    },
    addRowBehindOurBack: (row: { id: string; email: string }) => state.push(row),
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("findUserIdByEmail", () => {
  it("returns the User row id", async () => {
    createUserTable([{ id: "user-1", email: "rider@example.com" }]);
    const { findUserIdByEmail } = await loadModule();

    await expect(findUserIdByEmail("rider@example.com")).resolves.toBe("user-1");
  });

  it("matches regardless of the casing or padding the provider sends", async () => {
    createUserTable([{ id: "user-1", email: "rider@example.com" }]);
    const { findUserIdByEmail } = await loadModule();

    await expect(findUserIdByEmail("  Rider@Example.COM  ")).resolves.toBe("user-1");
  });

  it("returns null for an unknown address and never queries for a blank one", async () => {
    const table = createUserTable([{ id: "user-1", email: "rider@example.com" }]);
    const { findUserIdByEmail } = await loadModule();

    await expect(findUserIdByEmail("nobody@example.com")).resolves.toBeNull();
    await expect(findUserIdByEmail("")).resolves.toBeNull();
    await expect(findUserIdByEmail(null)).resolves.toBeNull();

    expect(table.selectFilters).toHaveLength(1);
  });
});

describe("ensureOAuthUser", () => {
  it("reuses the existing account when the address already has one", async () => {
    // Signing in with Google using the same address as a password account must
    // resolve to that account rather than minting a parallel one.
    const table = createUserTable([{ id: "existing-user", email: "rider@example.com" }]);
    const { ensureOAuthUser } = await loadModule();

    await expect(ensureOAuthUser("Rider@example.com", "Rider")).resolves.toBe("existing-user");
    expect(table.inserted).toHaveLength(0);
  });

  it("creates a row for a first-time OAuth sign-in and returns its id", async () => {
    const table = createUserTable([]);
    const { ensureOAuthUser } = await loadModule();

    const id = await ensureOAuthUser("New.Person@Example.com", "New Person");

    expect(typeof id).toBe("string");
    expect(table.inserted).toHaveLength(1);
    const row = table.inserted[0];
    expect(row.email).toBe("new.person@example.com");
    expect(row.name).toBe("New Person");
    expect(row.id).toBe(id);
  });

  it("stores a blank hash so the account cannot be used for password sign-in", async () => {
    const table = createUserTable([]);
    const { ensureOAuthUser } = await loadModule();

    await ensureOAuthUser("oauth@example.com", "OAuth Person");

    expect(table.inserted[0].passwordHash).toBe("");
  });

  it("resolves to the winner when a concurrent sign-in inserted the row first", async () => {
    const table = createUserTable([]);
    const { ensureOAuthUser } = await loadModule();

    table.failNextInsert({ message: "duplicate key value violates unique constraint" });
    table.addRowBehindOurBack({ id: "winner-id", email: "race@example.com" });

    await expect(ensureOAuthUser("race@example.com", "Racer")).resolves.toBe("winner-id");
  });

  it("returns null when the address is unusable", async () => {
    const table = createUserTable([]);
    const { ensureOAuthUser } = await loadModule();

    await expect(ensureOAuthUser(null, "No Email")).resolves.toBeNull();
    await expect(ensureOAuthUser("   ", "Blank")).resolves.toBeNull();
    expect(table.inserted).toHaveLength(0);
  });
});
