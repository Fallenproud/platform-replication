import { mkdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

const command = process.argv[2];
if (command === "--version") {
  console.log("fake-ai-rules 1.7.0-test");
  process.exit(0);
}
if (command !== "generate") {
  console.error("unsupported command", command);
  process.exit(2);
}

const root = process.cwd();
const generatedDir = path.join(root, "ai-rules", ".generated-ai-rules");
await mkdir(generatedDir, { recursive: true });
await writeFile(
  path.join(generatedDir, "ai-rules-generated-AGENTS.md"),
  "# Generated Rules\nPreserve provenance.\n",
  "utf8",
);

for (const output of ["CLAUDE.md", "AGENTS.md"]) {
  await rm(path.join(root, output), { force: true, recursive: true });
  await symlink(
    "ai-rules/.generated-ai-rules/ai-rules-generated-AGENTS.md",
    path.join(root, output),
  );
}

await mkdir(path.join(root, ".codex"), { recursive: true });
await mkdir(path.join(root, ".cursor"), { recursive: true });
await writeFile(path.join(root, ".mcp.json"), '{"mcpServers":{}}\n', "utf8");
await writeFile(path.join(root, ".codex", "config.toml"), '[mcp_servers]\n', "utf8");
await writeFile(path.join(root, ".cursor", "mcp.json"), '{"mcpServers":{}}\n', "utf8");

if (process.env.DEMO_EXTRA_OUTPUT === "1") {
  await writeFile(path.join(root, "extra-output.txt"), "not declared\n", "utf8");
}

console.log("generated fake outputs");
