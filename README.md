# QNCE Demo v0.1.0

A lightweight interactive demo for the **Quantum Narrative Convergence Engine (QNCE)**.

---

## What is QNCE?
QNCE is a narrative engine inspired by quantum mechanics concepts, designed to power interactive stories and games with:
- **Superposition:** Multiple narrative possibilities exist until a choice is made.
- **Collapse:** Player choices "collapse" the narrative into a specific path, updating state and flags.
- **Entanglement:** Early decisions affect later outcomes, allowing for complex, interconnected storylines.

This demo showcases these features in a simple, visual format for onboarding, feedback, and collaboration.

---

## Demo Overview
- **Interact**: Read the narrative and select from available choices.
- **Observe**: The story and available options change based on your decisions.
- **Debug**: Toggle the debug overlay to see internal state (current node, flags, history).
- **Reset**: Restart the demo at any time to explore different paths.

---

## Core Components
- **useQNCE**: React hook managing narrative state, node transitions, and flag updates.
- **NarrativeDisplay**: Renders the current narrative text with fade-in animation.
- **ChoiceSelector**: Displays available choices as accessible, responsive buttons.
- **StateDebugOverlay**: Toggleable overlay showing current node, flags, and history.
- **DemoFlow**: Orchestrates the narrative flow and debug overlay toggle.

---

## Usage Instructions
1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the dev server:**
   ```sh
   npm run dev
   ```
3. **Interact:**
   - Make choices to progress the story.
   - Click "Restart Demo" to reset.
   - Use "Show Debug" to toggle the debug overlay.

---

## Contributing
We welcome feedback and collaboration!
- **Ideas:** Add more narrative nodes, complex outcomes, or integrate with a text RPG.
- **Testing:** Try different paths and flag combinations.
- **Improvements:** Suggest UI/UX tweaks, accessibility, or new features.
- **Versioning:** This release is **v0.1.0**. See commit history for details.

---

## Sharing & Feedback
- **Hosted at:** [GitHub Pages or repository link here]
- **Feedback:** Use GitHub Issues or Discussions to report bugs, suggest features, or share ideas.

---

## Project Structure
- `/src`: Source code (organized by feature)
- `/public`: Static assets
- `/docs`: Design docs and roadmap

---

For more, see `/docs` or open an issue to start a discussion!
