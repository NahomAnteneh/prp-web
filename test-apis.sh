#!/bin/bash

echo "🔍 Testing APIs in the PRP Final project"
echo "========================================"

# Check if Next.js server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Error: Next.js server is not running on http://localhost:3000"
  echo "Please start the server with: npm run dev"
  exit 1
fi

# Run the tests
echo "Running API tests..."
npm run test

echo "Done!" 