#!/bin/bash

# This script generates a VSIX package file for VS Code extension

# Check if vsce is installed
if ! command -v vsce &> /dev/null; then
    echo "vsce command not found. Installing @vscode/vsce..."
    npm install -g @vscode/vsce
fi

# Clean up any existing VSIX files
rm -f *.vsix

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
NAME=$(node -p "require('./package.json').name")

echo "Generating VSIX package for $NAME version $VERSION"

# Package the extension
vsce package --no-dependencies

if [ $? -eq 0 ]; then
    echo "\nVSIX package generated successfully!"
    echo "\nYou can find your VSIX file in the current directory:"
    ls -la *.vsix
    echo "\nTo install this extension manually in VS Code:"
    echo "1. Open VS Code"
    echo "2. Go to Extensions (Ctrl+Shift+X)"
    echo "3. Click the '...' menu in the top-right of the Extensions panel"
    echo "4. Select 'Install from VSIX...'"
    echo "5. Browse to and select the VSIX file"
else
    echo "\nFailed to generate VSIX package."
    echo "Try running with the command manually: vsce package --no-dependencies"
fi
