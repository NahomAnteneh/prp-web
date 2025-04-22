#!/bin/bash

echo "🔍 Testing APIs in the PRP Final project"
echo "========================================"

# Check if Next.js server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Error: Next.js server is not running on http://localhost:3000"
  echo "Please start the server with: npm run dev"
  exit 1
fi

# Check if the directory exists, if not create it
if [ ! -d "api-test" ]; then
  echo "Creating api-test directory..."
  mkdir -p api-test
fi

# Navigate to the api-test directory
cd api-test

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the tests
echo "Running API tests..."
npm test

echo "Done!" 