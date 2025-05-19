/**
 * Type declarations for database models to use across the application
 */

import { Document, User } from '@prisma/client';

// Document with optional relations
export interface DocumentWithRelations extends Document {
  uploadedBy?: User | null;
}

// Document for use in API responses
export interface DocumentResponse {
  id: string;
  title: string;
  content?: string | null;
  type?: string | null;
  url: string;
  size?: number | null;
  category: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  projectId: string;
  uploadedById?: string | null;
  uploadedBy?: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
} 