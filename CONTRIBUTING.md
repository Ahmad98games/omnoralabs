# 🏛 Omnora OS: Contributor Protocol

We are building the most advanced storefront engine in the open. To maintain the integrity of the Omnora Kernel, we enforce strict engineering standards. If you are here, we expect excellence.

## ⚖️ Engineering Standards

### ⚛️ Atomic Commits
Every commit must be a single, logical unit of change. No "Work in progress" or "Misc fixes".
- **Format**: `type(scope): description`
- **Examples**: `feat(canvas): add shadow dom isolation`, `fix(auth): resolve jwt expiration race condition`.

### 🛡 TypeScript Strict Mode
We do not suppress type errors. 
- No `any`. 
- No `@ts-ignore`. 
- Define interfaces for all store states and component props.

### 🚫 No-Library Bloat
Do not add a dependency unless it is absolutely critical for performance or accessibility. We prefer raw CSS and native browser APIs over heavy utility libraries.

## 🌊 Branching Strategy
We use a high-velocity branching model. Never push to `main`.

- `feat/feature-name`: New functionality.
- `fix/bug-description`: Repairing broken logic.
- `chore/task-name`: Essential maintenance.
- `refactor/area`: Structural improvements without logic changes.

## 👁 Code Review Mandate
**All Pull Requests must include a screen-recording or screenshot of the change.** 
If we cannot see the visual or functional impact instantly, the PR will be closed.

---

## 🚀 Surgical 'Good First Issues'

Start here to prove your craft:

### Task 1: Add Tooltips to Sidebar Icons
**Tech**: Radix Tooltip + Tailwind
**Objective**: Enhance the builder's usability by providing immediate textual context for sidebar icons using Radix's accessible tooltip primitives.

### Task 2: Implement Mobile Preview Toggle
**Tech**: Zustand + Framer Motion
**Objective**: Add a toggle in the LiveCanvas header that restricts the container width to 375px with a smooth transition, simulating mobile viewports.

### Task 3: Fix Scrollbar Jitter
**Tech**: CSS / Radix Scroll Area
**Objective**: Resolve the layout shift (jitter) in the Store Settings panel when content exceeds the viewport, ensuring a seamless 'Linear' interaction feel.

---

## 📡 Communication
For architectural proposals, use GitHub Discussions. For bug reports, use the provided templates.

"THE CODE IS PUBLIC. THE VISION IS INDUSTRIAL. OMNORA IS OPEN."
