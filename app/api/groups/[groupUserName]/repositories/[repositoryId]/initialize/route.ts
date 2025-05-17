import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChangeType } from '@prisma/client';
import { z } from 'zod';

// Define file change type
interface FileChange {
  filePath: string;
  changeType: ChangeType;
  fileContentHash: string | null;
  previousFileContentHash: string | null;
}

const initializeSchema = z.object({
  withReadme: z.boolean(),
  withGitignore: z.boolean().optional().default(false),
  withLicense: z.boolean().optional().default(false),
  readmeTemplate: z.string().optional().default('default'),
  gitignoreTemplate: z.string().optional(),
  licenseTemplate: z.string().optional(),
  commitMessage: z.string().trim().min(1, 'Commit message is required'),
  branch: z.string().optional().default('main'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { groupUserName, repositoryId } = params;
    if (!groupUserName || !repositoryId) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const validationResult = initializeSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { withReadme, withGitignore, withLicense, readmeTemplate, gitignoreTemplate, licenseTemplate, commitMessage, branch } = validationResult.data;

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repositoryId,
          groupUserName,
        }
      },
    });

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    // Generate content based on templates
    const fileChanges: FileChange[] = [];
    
    if (withReadme) {
      const readmeContent = getReadmeContent(readmeTemplate, repositoryId);
      fileChanges.push({
        filePath: 'README.md',
        changeType: 'ADDED',
        fileContentHash: Buffer.from(readmeContent).toString('base64'),
        previousFileContentHash: null,
      });
    }

    if (withGitignore && gitignoreTemplate) {
      const gitignoreContent = getGitignoreContent(gitignoreTemplate);
      fileChanges.push({
        filePath: '.gitignore',
        changeType: 'ADDED',
        fileContentHash: Buffer.from(gitignoreContent).toString('base64'),
        previousFileContentHash: null,
      });
    }

    if (withLicense && licenseTemplate) {
      const licenseContent = getLicenseContent(licenseTemplate);
      fileChanges.push({
        filePath: 'LICENSE',
        changeType: 'ADDED',
        fileContentHash: Buffer.from(licenseContent).toString('base64'),
        previousFileContentHash: null,
      });
    }

    if (fileChanges.length === 0) {
      return NextResponse.json(
        { error: 'No files to initialize' },
        { status: 400 }
      );
    }

    // Create the commit and necessary structures
    const result = await prisma.$transaction(async (tx) => {
      // Create a commit ID
      const commitId = `commit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Check if branch exists, create it if not
      let branchRecord = await tx.branch.findFirst({
        where: {
          name: branch,
          repositoryName: repositoryId,
          repositoryGroup: groupUserName,
        },
      });

      // Create the commit 
      const commit = await tx.commit.create({
        data: {
          id: commitId,
          message: commitMessage,
          timestamp: new Date(),
          repositoryName: repositoryId,
          repositoryGroup: groupUserName,
          authorId: session.user.userId,
          parentCommitIDs: [], // No parent commit for initial commit
          fileChanges: {
            create: fileChanges,
          },
        },
        include: {
          fileChanges: true,
          author: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create or update the branch
      if (branchRecord) {
        branchRecord = await tx.branch.update({
          where: {
            id: branchRecord.id,
          },
          data: {
            headCommitId: commit.id,
          },
        });
      } else {
        branchRecord = await tx.branch.create({
          data: {
            name: branch,
            repositoryName: repositoryId,
            repositoryGroup: groupUserName,
            headCommitId: commit.id,
          },
        });
      }

      return {
        commit,
        branch: branchRecord,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Repository initialized successfully',
        branch: result.branch.name,
        commit: {
          id: result.commit.id,
          message: result.commit.message,
          timestamp: result.commit.timestamp,
          author: result.commit.author,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error initializing repository:', error);
    return NextResponse.json(
      { error: 'Failed to initialize repository' },
      { status: 500 }
    );
  }
}

// Helper functions to generate content
function getReadmeContent(template: string, repositoryName: string): string {
  switch (template) {
    case 'default':
      return `# ${repositoryName}\n\nThis is a new repository created with PRP.\n\n## Getting Started\n\nThis README file is automatically generated during the repository initialization.`;
    case 'minimal':
      return `# ${repositoryName}`;
    default:
      return `# ${repositoryName}\n\nThis is a new repository.`;
  }
}

function getGitignoreContent(template: string): string {
  // This would fetch gitignore templates based on the template name
  // For simplicity, we're providing basic templates
  switch (template) {
    case 'node':
      return `# Logs\nlogs\n*.log\nnpm-debug.log*\n\n# Dependencies\nnode_modules/\n\n# Build output\ndist/\nbuild/\n\n# Environment variables\n.env\n.env.local\n\n# Editor files\n.vscode/\n.idea/\n*.swp\n*.swo`;
    case 'python':
      return `# Byte-compiled / optimized / DLL files\n__pycache__/\n*.py[cod]\n*$py.class\n\n# Distribution / packaging\ndist/\nbuild/\n*.egg-info/\n\n# Virtual environments\nvenv/\nenv/\n.env/\n\n# Unit test / coverage reports\nhtmlcov/\n.coverage\n.pytest_cache/`;
    default:
      return `# Default .gitignore\n.DS_Store\nThumbs.db\n*.log\n*.tmp\n`;
  }
}

function getLicenseContent(template: string): string {
  // This would fetch license templates based on the template name
  const currentYear = new Date().getFullYear();
  
  switch (template) {
    case 'mit':
      return `MIT License\n\nCopyright (c) ${currentYear}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
    case 'apache-2.0':
      return `                                 Apache License\n                           Version 2.0, January 2004\n                        http://www.apache.org/licenses/\n\nCopyright (c) ${currentYear}\n\nLicensed under the Apache License, Version 2.0 (the "License");\nyou may not use this file except in compliance with the License.\nYou may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\nUnless required by applicable law or agreed to in writing, software\ndistributed under the License is distributed on an "AS IS" BASIS,\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\nSee the License for the specific language governing permissions and\nlimitations under the License.`;
    default:
      return `Copyright (c) ${currentYear}\n\nAll rights reserved.`;
  }
} 