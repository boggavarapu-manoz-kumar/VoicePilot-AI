#!/usr/bin/env bash
# VoicePilot AI - Repository Integrity & Smoke Test Script

set -e

echo "=== [1/3] Verifying Directory Layout ==="
required_paths=(
  "frontend"
  "backend"
  "infrastructure/database"
  "docs/architecture"
  "docs/development"
  "scripts"
  ".gitignore"
  ".editorconfig"
  "README.md"
  ".env.example"
)

for p in "${required_paths[@]}"; do
  if [ ! -e "$p" ]; then
    echo "ERROR: Required path '$p' does not exist."
    exit 1
  fi
done
echo "Directory layout verified."

echo "=== [2/3] Checking Frontend Compilation ==="
cd frontend
npm run build
cd ..
echo "Frontend built successfully."

echo "=== [3/3] Checking Sensitive Files ==="
if [ -f ".env" ]; then
  echo "WARNING: .env file found in root directory! Ensure it is not tracked by Git."
fi

echo "=== All checks passed! ==="
