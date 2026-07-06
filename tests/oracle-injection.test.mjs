import test from "node:test";
import assert from "node:assert/strict";

import { formatOracleContext, queryOracle } from "../plugins/ox/scripts/lib/prompts.mjs";

test("formatOracleContext returns an empty string for no results", () => {
  assert.equal(formatOracleContext([]), "");
});

test("formatOracleContext wraps results, strips YAML frontmatter, and keeps the body", () => {
  const output = formatOracleContext([{ content: "---\nfm\n---\nreal body", type: "learning" }]);

  assert.match(output, /<oracle_learnings>/);
  assert.match(output, /<\/oracle_learnings>/);
  assert.match(output, /real body/);
  assert.equal(output.includes("fm"), false);
});

test("formatOracleContext truncates content to 300 characters", () => {
  const output = formatOracleContext([{ content: "x".repeat(400), type: "learning" }]);

  assert.equal(output.includes("x".repeat(300)), true);
  assert.equal(output.includes("x".repeat(301)), false);
});

test("queryOracle returns [] immediately for an empty or non-string query", async () => {
  assert.deepEqual(await queryOracle(""), []);
  assert.deepEqual(await queryOracle(null), []);
});
