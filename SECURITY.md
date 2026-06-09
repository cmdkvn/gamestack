# Security policy

## Reporting a vulnerability

Use GitHub's **private vulnerability reporting**:
[github.com/cmdkvn/gamestack/security/advisories/new](https://github.com/cmdkvn/gamestack/security/advisories/new)

Do **NOT** open a public issue for a security report.

| Target | Window |
|---|---|
| Acknowledgment of report | within 48 hours |
| Coordinated disclosure | 90 days from acknowledgment |

If we can't reproduce the issue or disagree on severity, we'll say so within the acknowledgment window so you can escalate or publish on your own timeline.

## In scope

- **Skills** (`skills/**/SKILL.md`) — content that could mislead a downstream developer into an unsafe action (e.g., a code-review skill that would tell a user to disable a security check).
- **CLIs** (`bin/impl/**/*`) — runtime behavior, file handling, network calls.
- **Hooks** — any hook scripts the catalog ships.
- **setup script** — the symlink installer's handling of host paths.
- **Engine SDKs** (`engines/{unity,godot,ios}/**`) — particularly the loopback HTTP server bindings and snapshot/restore endpoints.

## Out of scope

- **Third-party dependencies** — report to the upstream maintainer (e.g., `bun`, `actions/*`). We'll bump deps when upstream ships a fix.
- **User-installed skills outside the gamestack catalog** — gamestack does not vet third-party skills.
- **Misconfiguration of the host AI agent** (Claude Code, Codex, Cursor, OpenCode) — report to the host vendor.

## Local-only posture

gamestack transmits no telemetry. The skills and CLIs do not call home. That said, a security-conscious user should still verify:

- **Engine SDK HTTP servers bind to `127.0.0.1` only** and refuse non-loopback clients. See [`engines/unity/README.md`](engines/unity/README.md), [`engines/godot/README.md`](engines/godot/README.md), [`engines/ios/README.md`](engines/ios/README.md) for the binding posture per engine.
- **Hook scripts run with the host agent's tool permissions.** Read any hook before enabling it in your `.claude/settings.json`.
- **`./setup --check-updates`** is the only outbound network call gamestack makes by default (a `git fetch origin main` against the gamestack remote).
- **`gamestack-model-benchmark`** makes outbound Anthropic API calls using your own `ANTHROPIC_API_KEY`. Output stays on disk.
- **`/post-launch-monitor`** makes outbound HTTP calls only when you point it at your game's Steam page; opt-in per invocation.

If you find an unexpected outbound call from any other code path, that's a security issue worth reporting.

## Supply chain

- `bun.lock` is checked in across all CLIs; dependency upgrades go through PR review.
- Hooks and skills do **not** `curl | sh` or fetch remote code at runtime.
- The `setup` script writes only to the host's skill discovery path and the user's chosen CLI directory. It does not write to `/etc`, `~/.bashrc`, or any other shared system location.

## Acknowledgments

Security researchers who report a valid issue will be credited in the release notes (or stay anonymous if preferred).
