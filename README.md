# CalcRoom

A dark-mode calculator with a mental math quiz mode, built with React, TypeScript, and Tailwind.

**Live app:** https://ryheinz.github.io/CalcQuiz/

## Features

- **Calculator** — standard arithmetic (+, −, ×, ÷), percent, sign toggle, backspace, thousands-separator formatting, and a proper error state on invalid operations like division by zero.
- **Quiz** — 60-second timed mental-math round with streak tracking, score, wrong-answer feedback, and a game-over screen with a "Play Again" restart.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev
```

The app opens at `http://localhost:3000`.

## Build

```bash
npm run build
npm run preview
```

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via `.github/workflows/deploy.yml`.
