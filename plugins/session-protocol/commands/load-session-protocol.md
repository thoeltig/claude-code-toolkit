---
description: Load unfinished tasks and context from previous session
---

Use the **managing-session-continuity** skill to load the previous session context from @session-protocol.json.

Execute Workflow 2 (Loading Session Context) from the skill:
1. Read and parse @session-protocol.json
2. Validate git state if available (check for drift)
3. Validate file references still exist (warn if missing)
4. Build structured summary with task counts, next action, warnings
5. Present context to user

The skill handles all details of JSON parsing, validation, and context restoration.