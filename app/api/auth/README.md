# Authentication API Documentation

This folder contains the authentication API for the application. Everything related to user authentication (login, registration, session retrieval) is handled through the NextAuth integration in `[...nextauth]/route.ts`.

## Available Endpoints

### 1. Login (`POST /api/auth/signin`)
Uses NextAuth's built-in credentials provider to authenticate users by either username or email.

**Request body:**
```json
{
  "identifier": "username_or_email",
  "password": "user_password"
}
```

**Response:**
- 200 OK: Returns a session cookie and user data
- 401 Unauthorized: Invalid credentials

### 2. Registration (`POST /api/auth/register`)
Creates a new user account.

**Request body:**
```json
{
  "username": "user123",
  "idNumber": "ID12345",
  "email": "user@example.com",
  "password": "secure_password",
  "department": "Computer Science",
  "batchYear": "2023"
}
```

**Response:**
- 201 Created: User registered successfully
- 400 Bad Request: Missing required fields
- 409 Conflict: Username or email already exists

### 3. Session Check (`POST /api/auth/session`)
Checks if the user has a valid session and returns the user data.

**Response:**
- 200 OK: Returns user data if authenticated
- 401 Unauthorized: No valid session

## Implementation Notes

- Authentication is handled by NextAuth using a JWT strategy
- Sessions last for 30 days by default
- Passwords are hashed using bcrypt
- The authentication flow supports login via either username or email

## Error Handling

All endpoints return appropriate HTTP status codes and error messages in the response body. Authentication errors are logged to the console for debugging purposes. 