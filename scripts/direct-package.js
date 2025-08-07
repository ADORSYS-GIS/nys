/**
 * This script directly packages the VS Code extension without any dependency checks
 * It forces the creation of a VSIX file regardless of node_modules issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get extension details from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const name = packageJson.name;
const version = packageJson.version;
const vsixFilename = `${name}-${version}.vsix`;

console.log('🚀 Starting direct VSIX package creation\n');

try {
  // First, make sure TypeScript is compiled
  console.log('1️⃣ Compiling TypeScript...');
  execSync('tsc -p ./', { stdio: 'inherit' });
  console.log('✅ Compilation successful!\n');

  // Build the VSIX using a direct command with all options to skip validation
  console.log('2️⃣ Creating VSIX package (bypassing all validation)...');
  const cmd = 'npx vsce package --no-dependencies --no-yarn --skip-license --ignoreFile ./.vscodeignore';
  execSync(cmd, { stdio: 'inherit' });

  // Check if VSIX file was created
  if (fs.existsSync(path.join(__dirname, '..', vsixFilename))) {
    console.log(`\n✅ VSIX package created successfully: ${vsixFilename}`);
    console.log('\n📦 You can install this package in VS Code:');
    console.log('   1. Open VS Code');
    console.log('   2. Go to Extensions (Ctrl+Shift+X)');
    console.log('   3. Click the "..." menu in the top-right');
    console.log('   4. Select "Install from VSIX..."');
    console.log(`   5. Navigate to and select ${vsixFilename}`);
  } else {
    console.error('❌ VSIX file was not created!');
  }
} catch (error) {
  console.error(`\n❌ Error creating VSIX package: ${error.message}`);

  // Fallback to the absolute most direct method if the above fails
  console.log('\n🔄 Trying alternative packaging method...');
  try {
    const fallbackCmd = 'npx vsce package --no-dependencies --no-yarn --skip-license --no-update-package-json';
    execSync(fallbackCmd, { stdio: 'inherit' });
    console.log(`\n✅ VSIX package created with fallback method: ${vsixFilename}`);
  } catch (fallbackError) {
    console.error(`\n❌ All packaging methods failed: ${fallbackError.message}`);
    console.log('\n💡 Try running this command directly in your terminal:');
    console.log('   npx vsce package --no-dependencies --no-yarn --skip-license');
  }
}
