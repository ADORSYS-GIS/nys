#!/bin/bash

# Package Mira Extension Script
# This script compiles and packages the Mira extension for installation

echo "🚀 Packaging Mira Extension..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf out/
rm -f *.vsix

# Compile TypeScript
echo "📦 Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

# Package extension
echo "📦 Packaging extension..."
npx vsce package

if [ $? -ne 0 ]; then
    echo "❌ Packaging failed!"
    exit 1
fi

# Find the generated .vsix file
VSIX_FILE=$(ls -t *.vsix | head -n1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ No .vsix file found!"
    exit 1
fi

echo "✅ Extension packaged successfully: $VSIX_FILE"
echo ""
echo "📋 Installation Instructions:"
echo "1. Open VS Code"
echo "2. Go to Extensions (Ctrl+Shift+X)"
echo "3. Click the '...' menu and select 'Install from VSIX...'"
echo "4. Select the file: $VSIX_FILE"
echo "5. Look for the Mira icon in the activity bar (left sidebar)"
echo ""
echo "🎯 After installation:"
echo "- Click the Mira icon in the activity bar"
echo "- Click 'Get Started' to create your first issue"
echo "- Configure your OpenAI API key in VS Code settings"
echo ""
echo "🔧 VS Code Settings:"
echo "Search for 'mira' and set 'Mira: Openai Api Key'"
