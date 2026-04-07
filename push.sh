#!/bin/bash
set -e
cd "$(dirname "$0")"
git add .github/ vite.config.ts src/App.tsx
git commit -m "feat: add GitHub Pages deploy workflow and base path config"
git push origin master
