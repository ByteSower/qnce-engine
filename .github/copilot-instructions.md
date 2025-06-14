<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions for QNCE Demo

This project is a Vite + React + TypeScript demo for the Quantum Narrative Convergence Engine (QNCE).

## QNCE Concepts
- **Superposition:** Multiple narrative outcomes exist until a choice is made.
- **Collapse:** Choices "collapse" the narrative to a specific path, updating state and flags.
- **Entanglement:** Early decisions affect later outcomes, enabling complex, interconnected stories.

## Component Responsibilities
- **useQNCE:** Manages narrative state, node transitions, and flag updates.
- **NarrativeDisplay:** Renders the current narrative text with fade-in animation.
- **ChoiceSelector:** Displays available choices as accessible, responsive buttons.
- **StateDebugOverlay:** Toggleable overlay showing current node, flags, and history.
- **DemoFlow:** Orchestrates the narrative flow and debug overlay toggle.

## Usage & Development Guidelines
- Use idiomatic React and TypeScript.
- Use Tailwind CSS for all styling and ensure responsiveness.
- Organize code in `/src` by feature, not by type.
- Prioritize clarity and maintainability for demo and onboarding purposes.
- All narrative logic should be encapsulated in hooks or context.
- Document all QNCE-specific logic and data models clearly.
- Version: v0.1.0

## How to Run & Test
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Interact with the demo, reset, and toggle debug overlay as described in the README.

## Contributing
- Suggest enhancements, new narrative branches, or integration ideas via GitHub Issues or Discussions.
- Test narrative paths and flag logic for correctness.
- Follow the above conventions for code and documentation.

---
