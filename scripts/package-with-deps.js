/**
 * This script packages the extension with required dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = packageJson.version;
const name = packageJson.name;

console.log(`Packaging ${name} v${version} with dependencies...`);

try {
  // First, ensure dependencies are installed
  console.log('Installing dependencies...');
  execSync('npm install ws axios', { stdio: 'inherit' });

  // Next, compile the extension
  console.log('\nCompiling TypeScript...');
  execSync('npm run compile', { stdio: 'inherit' });

  // Then package it
  console.log('\nPackaging extension...');
  execSync('npx vsce package --no-yarn', { stdio: 'inherit' });

  console.log(`\n✅ Successfully packaged with dependencies: ${name}-${version}.vsix`);
} catch (error) {
  console.error('\n❌ Packaging failed:', error.message);
  process.exit(1);
}
