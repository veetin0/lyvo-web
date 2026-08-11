import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    // Agent worktrees under .claude hold full project copies, including their
    // own tests. Without this they get collected alongside the real suite.
    exclude: ["**/node_modules/**", "**/dist/**", ".claude/**"],
    coverage: {
      reporter: ["text", "html"]
    }
  }
});
