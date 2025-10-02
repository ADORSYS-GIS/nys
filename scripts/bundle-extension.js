/**
 * This script bundles the extension with all required dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;
const name = packageJson.name;

console.log(`🚀 Bundling ${name} v${version} with dependencies...\n`);

try {
  // 1. Clean previous build artifacts
  console.log('1️⃣ Cleaning previous build artifacts...');
  if (fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  if (fs.existsSync(path.join(__dirname, '..', 'package-lock.json'))) {
    execSync('rm -f package-lock.json', { stdio: 'inherit' });
  }
  console.log('✅ Cleanup complete!\n');

  // 2. Install only the required dependencies
  console.log('2️⃣ Installing dependencies...');
  execSync('npm install --no-package-lock ws axios', { stdio: 'inherit' });
  console.log('✅ Dependencies installed!\n');

  // 3. Create a temporary .vscodeignore file that won't exclude node_modules
  console.log('3️⃣ Creating temporary .vscodeignore file...');
  const vscodeignorePath = path.join(__dirname, '..', '.vscodeignore');
  let vscodeignoreContent = '';

  if (fs.existsSync(vscodeignorePath)) {
    vscodeignoreContent = fs.readFileSync(vscodeignorePath, 'utf8');
  }

  // Create a backup of the original .vscodeignore
  fs.writeFileSync(`${vscodeignorePath}.backup`, vscodeignoreContent);

  // Create a new .vscodeignore that doesn't exclude node_modules
  const newVscodeignore = vscodeignoreContent
    .split('\n')
    // Remove any lines that might exclude node_modules or .nys/
    .filter(line => !line.includes('node_modules') && !line.match(/(^|\/)\.nys(\/|\*|$)/))
    .join('\n');
  
  // Add rules to include only needed node_modules and always include .nys/
  const finalVscodeignore = `${newVscodeignore}
  # Always include persistent state directory
  !.nys/**
  # Include only needed dependencies
  node_modules/**
  !node_modules/ws/**
  !node_modules/axios/**
  !node_modules/buffer-from/**
  !node_modules/event-target-shim/**
  !node_modules/follow-redirects/**
  !node_modules/proxy-from-env/**
  !node_modules/form-data/**
  !node_modules/asynckit/**
  !node_modules/combined-stream/**
  !node_modules/mime-types/**
  !node_modules/mime-db/**
  !node_modules/delayed-stream/**
  `;
  
  fs.writeFileSync(vscodeignorePath, finalVscodeignore);
  console.log('✅ .vscodeignore updated!\n');

  // 4. Compile the TypeScript code
  console.log('4️⃣ Compiling TypeScript...');
  execSync('npm run compile', { stdio: 'inherit' });
  console.log('✅ Compilation successful!\n');

  // 5. Package the extension
  console.log('5️⃣ Packaging extension...');
  execSync('npx vsce package --no-yarn', { stdio: 'inherit' });
  console.log(`✅ Extension packaged successfully!\n`);

console.log(`Bundling ${name} v${version} with dependencies...`);

  // 6. Restore the original .vscodeignore
  console.log('6️⃣ Restoring original .vscodeignore...');
  fs.copyFileSync(`${vscodeignorePath}.backup`, vscodeignorePath);
  fs.unlinkSync(`${vscodeignorePath}.backup`);
  console.log('✅ Original .vscodeignore restored!\n');

  console.log(`🎉 VSIX package created: ${name}-${version}.vsix`);
  console.log('\nYou can install this package in VS Code:');
  console.log('1. Open VS Code');
  console.log('2. Go to Extensions (Ctrl+Shift+X)');
  console.log('3. Click the "..." menu in the top-right corner');
  console.log('4. Select "Install from VSIX..."');
  console.log(`5. Navigate to and select ${name}-${version}.vsix`);
} catch (error) {
  console.error(`\n❌ Error during bundling: ${error.message}`);

  // Attempt to restore the original .vscodeignore if it exists
  const vscodeignorePath = path.join(__dirname, '..', '.vscodeignore');
  const backupPath = `${vscodeignorePath}.backup`;

  if (fs.existsSync(backupPath)) {
    console.log('Restoring original .vscodeignore from backup...');
    fs.copyFileSync(backupPath, vscodeignorePath);
    fs.unlinkSync(backupPath);
  }

  process.exit(1);
}

const vsixFilename = `${name}-${version}.vsix`;

// Function to execute shell commands with better error handling
function runCommand(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\n❌ ${errorMessage}:\n${error.message}`);
    return false;
  }
}

// Main bundling process
async function bundleExtension() {
  console.log(`\n🚀 Bundling ${name} v${version}...\n`);

  // Step 1: Make sure TypeScript is compiled
  console.log('1️⃣ Compiling TypeScript...');
  if (!runCommand('npm run compile', 'TypeScript compilation failed')) {
    process.exit(1);
  }
  console.log('✅ Compilation successful!\n');

  // Step 2: Package the extension
  console.log('2️⃣ Creating VSIX package...');

  // Use the package script from package.json
  if (!runCommand('npm run package', 'Packaging failed')) {
    // Try alternative packaging method if the main one fails
    console.log('\n🔄 Trying alternative packaging method...');
    if (!runCommand('npx vsce package --no-dependencies', 'All packaging methods failed')) {
      process.exit(1);
    }
  }

  // Check if VSIX was created successfully
  const vsixPath = path.join(__dirname, '..', vsixFilename);
  if (fs.existsSync(vsixPath)) {
    console.log(`\n✅ VSIX package created successfully: ${vsixFilename}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Run the bundle-and-install.sh script to install the extension`);
    console.log(`   2. Or manually install with: code --install-extension ${vsixFilename}`);
    return vsixPath;
  } else {
    console.error('\n❌ VSIX file was not created!');
    process.exit(1);
  }
}

// Execute the bundling process
bundleExtension().catch(err => {
  console.error('Unexpected error during bundling:', err);
  process.exit(1);
});