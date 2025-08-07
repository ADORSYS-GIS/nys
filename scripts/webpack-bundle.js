/**
 * This script bundles the extension with webpack to include all dependencies
 */
/**
 * This script bundles the extension using webpack
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;
const name = packageJson.name;

console.log(` Bundling ${name} v${version} with webpack...\n`);

// Helper function to run commands with error handling
function runCommand(command, errorMessage, continueOnError = false) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\n⚠️ ${errorMessage}: ${error.message}`);
    if (continueOnError) {
      return false;
    } else {
      throw error;
    }
  }
}

try {
  // 1. Ensure TypeScript is installed
  console.log('1️⃣ Ensuring TypeScript is installed...');
  runCommand('node ./scripts/install-typescript.js', 'Failed to ensure TypeScript installation', true);

  // 2. Install webpack and related dependencies if needed
  console.log('2️⃣ Ensuring webpack dependencies are installed...');
  runCommand('npm install --no-save webpack webpack-cli ts-loader', 'Failed to install webpack dependencies', true);

  // 3. Install critical runtime dependencies
  console.log('3️⃣ Installing critical runtime dependencies...');
  runCommand('npm install --no-save ws axios uuid', 'Failed to install runtime dependencies', true);

  // 4. Run webpack to bundle the extension
  console.log('4️⃣ Bundling with webpack...');
  runCommand('npx webpack --mode production', 'Webpack bundling failed');

  // 5. Package the extension with the bundled output
  console.log('5️⃣ Packaging extension...');
  try {
    runCommand('npx vsce package --no-dependencies', 'Standard packaging method failed');
  } catch (packageError) {
    console.log('⚠️ Standard packaging failed, trying alternative method...');
    runCommand('npm run package-no-deps', 'All packaging methods failed');
  }

  console.log(`✅ Extension packaged successfully!\n`);
  console.log(` VSIX package created: ${name}-${version}.vsix`);

} catch (error) {
  console.error(`\n❌ Error during webpack bundling: ${error.message}`);
  process.exit(1);
}
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;
const name = packageJson.name;

console.log(`🚀 Bundling ${name} v${version} with webpack...
`);

try {
  // 1. Install all dependencies
  console.log('1️⃣ Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed!\n');

  // 2. Create webpack bundle
  console.log('2️⃣ Creating webpack bundle...');
  execSync('npx webpack --mode production', { stdio: 'inherit' });
  console.log('✅ Webpack bundle created!\n');

  // 3. Update .vscodeignore to exclude node_modules but include dist
  console.log('3️⃣ Updating .vscodeignore...');
  const vscodeignorePath = path.join(__dirname, '..', '.vscodeignore');
  const vscodeignoreContent = `
.vscode/**
.vscode-test/**
.gitignore
.yarnrc
vsc-extension-quickstart.md
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts
.editorconfig
out/**
.github/**
webpack.config.js
USAGE_GUIDE.md
run-mcp-server.sh
scripts/**
node_modules/**
src/**

# Keep only the dist bundle
!dist/**
`;

  fs.writeFileSync(vscodeignorePath, vscodeignoreContent);
  console.log('✅ .vscodeignore updated!\n');

  // 4. Update package.json main field to point to dist
  console.log('4️⃣ Updating package.json...');
  packageJson.main = './dist/extension.js';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json updated!\n');

  // 5. Package the extension
  console.log('5️⃣ Packaging extension...');
  execSync('npx vsce package --no-dependencies', { stdio: 'inherit' });
  console.log(`✅ Extension packaged successfully!\n`);

  // 6. Restore package.json
  console.log('6️⃣ Restoring package.json...');
  packageJson.main = './out/extension.js';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json restored!\n');

  console.log(`🎉 VSIX package created: ${name}-${version}.vsix`);
  console.log('\nThis package includes all dependencies bundled with webpack.');
  console.log('To install: code --install-extension ' + `${name}-${version}.vsix`);

} catch (error) {
  console.error(`\n❌ Error during bundling: ${error.message}`);

  // Restore package.json if needed
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.main === './dist/extension.js') {
    console.log('Restoring package.json main field...');
    packageJson.main = './out/extension.js';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  process.exit(1);
}
