/**
 * This script helps fix extraneous dependencies by moving them to the correct section
 * in package.json and cleaning up node_modules.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Ensure dependencies section exists
if (!packageJson.dependencies) {
  packageJson.dependencies = {};
}

// Save the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Package.json updated. Cleaning node_modules...');

try {
  // Clean and reinstall dependencies
  execSync('rm -rf node_modules', { stdio: 'inherit' });
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies fixed successfully!');
} catch (error) {
  console.error('Error fixing dependencies:', error.message);
  process.exit(1);
}
