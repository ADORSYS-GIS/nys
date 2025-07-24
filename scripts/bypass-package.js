/**
 * This script packages the extension without dependency validation
 * by directly calling vsce with the right parameters
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = packageJson.version;
const name = packageJson.name;

console.log(`Packaging ${name} v${version}...`);

try {
  // First, compile the extension
  console.log('Compiling TypeScript...');
  execSync('npm run compile', { stdio: 'inherit' });

  // Then package it with --no-dependencies
  console.log('\nPackaging extension (bypassing dependency validation)...');
  execSync('npx vsce package --no-dependencies', { stdio: 'inherit' });

  console.log(`\n✅ Successfully packaged: ${name}-${version}.vsix`);
} catch (error) {
  console.error('\n❌ Packaging failed:', error.message);
  process.exit(1);
}
