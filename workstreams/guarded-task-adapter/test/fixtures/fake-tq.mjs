import { writeFile } from "node:fs/promises";

const recordPath = process.env.FAKE_TQ_RECORD;
if (recordPath) {
  await writeFile(
    recordPath,
    `${JSON.stringify({ argv: process.argv.slice(2), pid: process.pid }, null, 2)}\n`,
    "utf8",
  );
}

process.on("SIGTERM", async () => {
  if (process.env.FAKE_TQ_TERMINATION_RECORD) {
    await writeFile(process.env.FAKE_TQ_TERMINATION_RECORD, "terminated\n", "utf8");
  }
  process.exit(143);
});

if (process.env.FAKE_TQ_STDOUT) {
  process.stdout.write(process.env.FAKE_TQ_STDOUT);
}
if (process.env.FAKE_TQ_STDERR) {
  process.stderr.write(process.env.FAKE_TQ_STDERR);
}

const sleepMs = Number(process.env.FAKE_TQ_SLEEP_MS ?? "0");
if (Number.isFinite(sleepMs) && sleepMs > 0) {
  await new Promise((resolve) => setTimeout(resolve, sleepMs));
}

process.exit(Number(process.env.FAKE_TQ_EXIT_CODE ?? "0"));
