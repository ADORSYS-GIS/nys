#!/bin/bash

# This script performs a clean reinstall of all dependencies

echo "Removing node_modules..."
rm -rf node_modules
rm -f package-lock.json

echo "Installing dependencies..."
npm install

echo "Dependencies reinstalled successfully!"
