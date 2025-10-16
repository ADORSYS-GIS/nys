## Build & Package

To build and package the extension (including all persistent state in `.nys/`):

```bash
npm run compile
npx vsce package
```

- The build/package scripts ensure `.nys/` is always included in the VSIX.
- You can also use `scripts/bundle-extension.js` or `scripts/generate-vsix.sh` for advanced packaging.
- After packaging, install the VSIX in VS Code via Extensions → ... → Install from VSIX.
