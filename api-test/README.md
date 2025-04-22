# API Testing Tools

This directory contains tools for testing the API endpoints in the PRP Final project.

## Available Tests

The test script currently tests the following API endpoints:

1. **Register API** (`/api/auth/register`) - Tests user registration functionality
2. **Login API** (`/api/auth/callback/credentials`) - Tests user login functionality
3. **Session API** (`/api/auth/session`) - Tests session information retrieval
4. **Debug API** (`/api/auth/debug`) - Tests authentication debug information

## Prerequisites

- Node.js 14.x or higher
- The PRP Final client server running on `http://localhost:3000`

## Setup

1. Navigate to the `api-test` directory:
   ```
   cd api-test
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Tests

To run all API tests:

```
npm test
```

## Test Output

The tests will output results to the console, showing:
- The endpoint being tested
- The HTTP status code
- The response data
- Whether the test passed or failed

## Expected Results

If everything is working correctly, you should see all tests pass with appropriate status codes (200 or 201).

## Troubleshooting

If tests fail, check:
1. Is the PRP Final client server running on http://localhost:3000?
2. Do you have proper network connectivity?
3. Are the API endpoints implemented correctly in the server?

## Modifying Tests

You can modify the test parameters in `test-apis.js` file. Look for the `testUser` object to change the test credentials.

## Adding New Tests

To add tests for additional API endpoints, follow the pattern in the existing test functions. 