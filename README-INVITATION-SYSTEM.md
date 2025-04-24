# Group Invitation System Implementation Guide

This document provides instructions for setting up the new group invitation system in the application.

## Overview

The invitation system allows group leaders to:
- Generate invitation codes for potential group members
- Send email invitations directly to students
- Track and manage invitations

Students can join groups using invitation codes, ensuring controlled group membership.

## Implementation Steps

### 1. Update the Prisma Schema

We've added a new `GroupInvite` model to the Prisma schema. Before the new routes can work correctly, the database needs to be updated:

```bash
# Generate Prisma client with the updated schema
npx prisma generate

# Create and apply a migration for the database changes
npx prisma migrate dev --name add_group_invites
```

### 2. Implement API Routes

The following API routes have been created or updated:

1. **Generate Invitation Code**: 
   - `POST /api/groups/[groupId]/invite-code`
   - Creates a unique invitation code for a group
   - Stores it in the database with an expiration time

2. **View Invitation Details**:
   - `GET /api/groups/[groupId]/invite-code?code=[code]` 
   - Retrieves information about a specific invitation
   - Group leaders can list all active invitations for their group

3. **Join Group with Invitation Code**:
   - `POST /api/groups/join`
   - Validates the invitation code
   - Adds the user to the group if the invitation is valid

4. **Send Email Invitation**:
   - `POST /api/groups/[groupId]/invite-email`
   - Sends an email with the invitation code to a specific email address

### 3. Invitation System Behavior

- **Security**: Only group leaders can generate invitation codes
- **Expiration**: Invitation codes expire after 24 hours
- **Single-use**: Each invitation code can only be used once
- **Capacity Check**: Invitations are only valid if the group isn't already full

### 4. Fallback Mechanism

The system includes fallback logic to handle the transition period before the migration is applied:

- The join route includes error handling for when the GroupInvite model isn't available yet
- If database errors occur, informative messages are displayed to users

## Troubleshooting

If you encounter any issues:

1. Ensure Prisma migrations have been applied
2. Check that database permissions are correctly set
3. Verify that the user has the correct permissions for the operation they're attempting
4. Look for any error messages in the server logs

## Future Enhancements

- Add admin dashboard for invitation management
- Implement invitation revocation
- Add analytics for tracking invitation usage
- Include batch invitation creation for multiple recipients 