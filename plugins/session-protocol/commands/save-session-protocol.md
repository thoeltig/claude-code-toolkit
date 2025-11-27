---
description: Save unfinished tasks and context for next session
---

Use the **managing-session-continuity** skill to save the current session context to session-protocol.json.

Execute Workflow 1 (Saving Session Context) from the skill:
1. Extract conversation context (tasks, files, decisions, git state)
2. Build JSON structure following schema in skill
3. Write to session-protocol.json in working directory
4. Provide summary with task counts and next action

The skill handles all details of context extraction, JSON generation, and file writing.