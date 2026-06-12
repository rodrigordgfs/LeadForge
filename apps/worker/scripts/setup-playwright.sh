#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Installing Playwright Chromium browser (user cache)…"
pnpm exec playwright install chromium

echo "Installing Playwright system dependencies (requires sudo)…"
sudo env "PATH=$PATH" node node_modules/playwright/cli.js install-deps chromium

if [ -d "$HOME/.cache/ms-playwright" ]; then
  echo "Fixing browser cache ownership…"
  sudo chown -R "$(id -un):$(id -gn)" "$HOME/.cache/ms-playwright"
fi

echo "Done."
