#!/bin/bash

# This script bundles the extension with dependencies and installs it

echo "📦 Step 1: Bundling extension with dependencies..."
node ./scripts/bundle-extension.js.new

if [ $? -ne 0 ]; then
    echo "❌ Bundling failed. Exiting."
    exit 1
fi

echo "\n🔍 Step 2: Finding the VSIX file..."
VSIX_FILE=$(find . -maxdepth 1 -name "*.vsix" | sort -V | tail -n 1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ No VSIX file found. Exiting."
    exit 1
fi

echo "📦 Found VSIX file: $VSIX_FILE"

echo "\n🔌 Step 3: Uninstalling previous extension version..."
code --uninstall-extension christian237.nys || true
code --uninstall-extension christian237.vscode-mcp-client || true

echo "\n💿 Step 4: Installing new extension version..."
code --install-extension "$VSIX_FILE"

if [ $? -eq 0 ]; then
    echo "\n✅ Success! Extension installed. Please restart VS Code."
else
    echo "\n❌ Installation failed."
    exit 1
fi
