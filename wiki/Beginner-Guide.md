# Beginner Guide: Create and Play a Story (No Coding Required)

Welcome! This guide helps you create and play an interactive story using QNCE Engine without writing code. You’ll use simple JSON and the built-in CLI.

## What you’ll do
- Install the QNCE CLI (one-time)
- Create a tiny story file (copy/paste)
- Play it in your terminal
- Save and load progress (optional)

## 1) Install the CLI

```bash
npm install -g qnce-engine
```

Verify:
```bash
qnce-play --help
```

No admin rights? Use npx each time:
```bash
npx qnce-play --help
```

## 2) Create a story file
Create a new file called `my-story.json` and paste this:

```json
{
  "initialNodeId": "start",
  "nodes": [
    {
      "id": "start",
      "text": "You wake up in a cozy cottage. A kettle whistles softly.",
      "choices": [
        { "text": "Make tea", "nextNodeId": "tea" },
        { "text": "Go outside", "nextNodeId": "outside" }
      ]
    },
    {
      "id": "tea",
      "text": "The tea warms your spirit. You feel ready for the day.",
      "choices": []
    },
    {
      "id": "outside",
      "text": "The morning sun greets you. Birds are singing.",
      "choices": []
    }
  ]
}
```

Tips:
- `text` is what players read.
- `choices` move the story to another `id` via `nextNodeId`.
- End a path by leaving `choices` as an empty list `[]`.

## 3) Play your story

```bash
qnce-play my-story.json
```

You’ll see the story text and numbered choices. Type a number (e.g., `1`) and press Enter.

## 4) Optional: Save/Load progress

```bash
# Save your current state to a key
qnce-play my-story.json --storage memory --non-interactive --save-key slot1

# List saves
qnce-play my-story.json --storage memory --list-keys

# Load a save
qnce-play my-story.json --storage memory --load-key slot1
```

## 5) Add simple rules (optional)
Hide/show choices based on flags with a condition. Example:

```json
{
  "id": "start",
  "text": "You find a locked chest.",
  "choices": [
    { "text": "Search for a key", "nextNodeId": "find_key", "flagEffects": { "hasKey": true } },
    { "text": "Open the chest", "nextNodeId": "open_chest", "condition": "flags.hasKey" }
  ]
}
```

- `flagEffects` sets a flag (like `hasKey`) when you pick a choice.
- `condition` checks flags before showing a choice.

## Next steps
- Use the demo story included in the repo: `demo-story.json`
- Import stories from Twine or other formats using `qnce-import`
- Explore the full Getting Started guide for React/Vue examples

Helpful links:
- Getting Started: Getting-Started
- CLI Usage: CLI-Usage
- Release Notes: Release-Notes
- API Reference (advanced): API-Reference

Happy storytelling!