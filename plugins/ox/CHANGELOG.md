# Changelog

## 1.0.5

- Port Claude session transfer from upstream (openai/codex-plugin-cc 430e2a8): `/ox:transfer [--source <claude-jsonl>]` imports a Claude Code session into a resumable Codex thread via the `externalAgentConfig/import` app-server RPC
- SHA256 idempotency ledger (`~/.codex/external_agent_session_imports.json`) — re-importing the same source reuses the existing thread
- Drop `experimentalRawEvents` from thread params (removed upstream; absent in current Codex app-server types)
- Fix `bump-version.mjs` to target the OX plugin (`plugins/ox`, marketplace name `ox`)
- Sync to upstream v1.0.5

## 1.0.4

- Cherry-pick upstream rescue routing fix: route `/ox:rescue` through the Agent tool to stop Skill recursion
- Fix broker daemon leaks from test runs + make broker SIGTERM reliable

## 1.0.0

- Initial version of the Codex plugin for Claude Code
