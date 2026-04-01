import fs from "node:fs";
import http from "node:http";
import path from "node:path";

export function loadPromptTemplate(rootDir, name) {
  const promptPath = path.join(rootDir, "prompts", `${name}.md`);
  return fs.readFileSync(promptPath, "utf8");
}

export function interpolateTemplate(template, variables) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : "";
  });
}

/**
 * Query Oracle knowledge base via HTTP API.
 * Graceful fallback: returns [] on any error or timeout.
 */
export async function queryOracle(query, { limit = 5, type = "learning" } = {}) {
  if (!query || typeof query !== "string") return [];
  const params = new URLSearchParams({ q: query, limit: String(limit), type, mode: "hybrid" });
  const url = `http://localhost:47778/api/search?${params}`;

  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1500 }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const results = Array.isArray(parsed.results) ? parsed.results : [];
          resolve(results);
        } catch { resolve([]); }
      });
    });
    req.on("error", () => resolve([]));
    req.on("timeout", () => { req.destroy(); resolve([]); });
  });
}

/**
 * Format Oracle results as XML context block for Codex prompts.
 * Strips YAML frontmatter from content.
 */
export function formatOracleContext(results) {
  if (!Array.isArray(results) || !results.length) return "";
  const items = results
    .filter(r => r && typeof r.content === "string")
    .map((r, i) => {
      const clean = r.content.replace(/^---[\s\S]*?---\s*/m, "").trim();
      return `${i + 1}. [${r.type || "unknown"}] ${clean.slice(0, 300)}`;
    })
    .join("\n");
  if (!items) return "";
  return `<oracle_learnings>\nRelevant knowledge from past work:\n${items}\n</oracle_learnings>\n\n`;
}
