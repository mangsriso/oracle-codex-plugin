import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import {
  clearBrokerSession,
  loadBrokerSession,
  teardownBrokerSession
} from "../plugins/ox/scripts/lib/broker-lifecycle.mjs";

const tempDirs = [];

export function makeTempDir(prefix = "codex-plugin-test-") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function isBrokerProcess(pid) {
  // Brokers are detached+unref'd daemons; a stale broker.json could hold a
  // recycled PID, so never SIGKILL a PID we cannot attribute to the broker.
  try {
    const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
    return cmdline.includes("app-server-broker");
  } catch {
    // No /proc (non-Linux) or process already gone: the PID was recorded by a
    // broker spawned during this run, so attempt the kill and let it no-op.
    return true;
  }
}

// The companion under test spawns brokers detached+unref'd, so they outlive
// the test process unless explicitly swept (observed: 58 brokers idle for 31
// days after one suite run). Handler must stay synchronous ("exit" event).
process.on("exit", () => {
  for (const dir of tempDirs) {
    let session = null;
    try {
      session = loadBrokerSession(dir);
    } catch {
      continue;
    }
    if (!session) {
      continue;
    }
    try {
      teardownBrokerSession({
        ...session,
        killProcess: (pid) => {
          if (isBrokerProcess(pid)) {
            process.kill(pid, "SIGKILL");
          }
        }
      });
      clearBrokerSession(dir);
    } catch {
      // Best-effort sweep; never let cleanup mask the test result.
    }
  }
});

export function writeExecutable(filePath, source) {
  fs.writeFileSync(filePath, source, { encoding: "utf8", mode: 0o755 });
}

export function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    input: options.input,
    shell: process.platform === "win32" && !path.isAbsolute(command),
    windowsHide: true
  });
}

export function initGitRepo(cwd) {
  run("git", ["init", "-b", "main"], { cwd });
  run("git", ["config", "user.name", "Codex Plugin Tests"], { cwd });
  run("git", ["config", "user.email", "tests@example.com"], { cwd });
  run("git", ["config", "commit.gpgsign", "false"], { cwd });
  run("git", ["config", "tag.gpgsign", "false"], { cwd });
}
