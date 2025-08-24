# Publishing Guide for VS Code MCP Client Extension

## Generating VSIX Extension for Manual Upload

To generate a VSIX file that can be manually uploaded or shared:

1. Make sure you have the VSCE tool installed:

   ```bash
   npm install -g @vscode/vsce
   ```

2. Navigate to your extension's root directory in the terminal

3. Generate the VSIX file:

   ```bash
   vsce package --no-dependencies
   ```

   This will create a `.vsix` file in your project root (e.g., `vscode-mcp-client-0.1.0.vsix`)

4. For subsequent builds, you can increment the version in `package.json` to create versioned packages

### Manual Installation of VSIX

To install the VSIX manually in VS Code:

1. Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Click the "..." (More Actions) button at the top of the Extensions view
4. Select "Install from VSIX..."
5. Browse to and select your `.vsix` file
6. Restart VS Code if prompted

### Distributing Your VSIX File

You can distribute your VSIX file through:

- Direct download links on your website or documentation
- GitHub Releases
- Internal package repositories
- Email for private distribution

## Troubleshooting Dependency Issues

If you encounter extraneous dependency errors when packaging your extension, follow these steps:

### Option 1: Use the --no-dependencies flag

The quickest solution is to use the `--no-dependencies` flag when packaging:

```bash
vsce package --no-dependencies
```

This will skip dependency validation during packaging.

### Option 2: Clean reinstall

Perform a clean reinstallation of dependencies:

```bash
npm run clean-reinstall
```

This script removes node_modules and package-lock.json, then reinstalls all dependencies cleanly.

### Option 3: Update package.json manually

If you continue to have issues, manually update your package.json:

1. Add all extraneous dependencies to either `dependencies` or `devDependencies`
2. Make sure the versions match those installed in node_modules
3. Run `npm install` to update package-lock.json

## Publishing Your Extension

### Prerequisites

1. Create a publisher account on the VS Code Marketplace
2. Create a Personal Access Token (PAT) with publishing rights

### Publishing Steps

1. Login to your publisher account:

   ```bash
   vsce login christian237
   ```

   Enter your PAT when prompted.

2. Package your extension:

   ```bash
   npm run package
   ```

3. Publish your extension:

   ```bash
   npm run publish
   ```

   Or specify the version:

   ```bash
   vsce publish [major|minor|patch]
   ```

## Creating Extension Releases

1. Update version in package.json
2. Update CHANGELOG.md with new version details
3. Commit changes
4. Tag the release: `git tag v0.1.0`
5. Push changes and tags: `git push && git push --tags`
6. Publish the extension: `npm run publish`

## Publishing to Open VSX Registry

To publish to Open VSX Registry (for VSCodium and other VS Code forks):

```bash
npx ovsx publish -p <open-vsx-pat>
```

## Tips for Successful Publishing

1. Always test your extension thoroughly before publishing
2. Use semantic versioning (major.minor.patch)
3. Keep your README.md updated with the latest information
4. Add a proper icon to make your extension more discoverable
5. Specify meaningful tags in package.json

## Known Environment Issue: Undici and Node 18

If you see an error like:

```
ReferenceError: File is not defined
 at .../node_modules/undici/lib/web/webidl/index.js
```

Cause:
- Some tooling (including vsce and OpenAI SDK) pulls in undici v6+, which expects a global File implementation that is present in Node 20 but not reliably available in Node 18.

Fix in this repo:
- package.json includes an npm "overrides" entry that forces undici to a Node 18–compatible 5.x release.

What you need to do:
- Run a clean install so the override takes effect:

```bash
rm -rf node_modules package-lock.json
npm install
```

Alternative options:
- Use Node 20+ when running packaging tools; or
- Package with no dependency checks:

```bash
npx vsce package --no-dependencies
```
