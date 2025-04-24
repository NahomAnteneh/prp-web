import { PrismaClient, Role, MergeRequestStatus, TaskStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { mockRules } from '../app/api/mock-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test users with known credentials
  const passwordHash = await bcrypt.hash('password123', 10);
  
  try {
    // Create admin user
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        name: 'Admin User',
        passwordHash,
        role: Role.ADMINISTRATOR,
        emailVerified: true,
        profileInfo: {
          idNumber: 'ADMIN001',
          email: 'admin@bdu.edu.et',
          department: 'administration',
          position: 'System Administrator'
        }
      }
    });

    // Create advisor user
    const advisor = await prisma.user.upsert({
      where: { username: 'advisor' },
      update: {},
      create: {
        username: 'advisor',
        name: 'Dr. Advisor Smith',
        passwordHash,
        role: Role.ADVISOR,
        emailVerified: true,
        profileInfo: {
          idNumber: 'ADV001',
          email: 'advisor@bdu.edu.et',
          department: 'computer-science',
          expertise: ['Software Engineering', 'Machine Learning'],
          position: 'Senior Lecturer'
        }
      }
    });

    // Create evaluator user
    const evaluator = await prisma.user.upsert({
      where: { username: 'evaluator' },
      update: {},
      create: {
        username: 'evaluator',
        name: 'Prof. Evaluator Johnson',
        passwordHash,
        role: Role.EVALUATOR,
        emailVerified: true,
        profileInfo: {
          idNumber: 'EVAL001',
          email: 'evaluator@bdu.edu.et',
          department: 'computer-science',
          expertise: ['Data Science', 'AI'],
          position: 'Professor'
        }
      }
    });

    // Create student users
    const students = await Promise.all([
      prisma.user.upsert({
        where: { username: 'student1' },
        update: {},
        create: {
          username: 'student1',
          name: 'John Doe',
          passwordHash,
          role: Role.STUDENT,
          emailVerified: true,
          profileInfo: {
            idNumber: 'STU001',
            email: 'student1@bdu.edu.et',
            department: 'computer-science',
            batchYear: '2023',
            gpa: 3.8
          }
        }
      }),
      prisma.user.upsert({
        where: { username: 'student2' },
        update: {},
        create: {
          username: 'student2',
          name: 'Jane Smith',
          passwordHash,
          role: Role.STUDENT,
          emailVerified: true,
          profileInfo: {
            idNumber: 'STU002',
            email: 'student2@bdu.edu.et',
            department: 'computer-science',
            batchYear: '2023',
            gpa: 3.9
          }
        }
      })
    ]);

    // Create a group
    const group = await prisma.group.create({
      data: {
        name: 'Team Alpha',
        description: 'Final year project group focusing on AI applications',
        leaderId: students[0].id,
        members: {
          create: [
            { userId: students[0].id },
            { userId: students[1].id }
          ]
        }
      }
    });

    // Create a project
    const project = await prisma.project.create({
      data: {
        title: 'AI-Powered Student Performance Analysis System',
        description: 'A machine learning system to analyze and predict student performance',
        status: 'Active',
        groupId: group.id,
        advisorId: advisor.id,
        milestones: {
          projectProposal: '2024-01-15',
          literatureReview: '2024-02-15',
          systemDesign: '2024-03-15',
          implementation: '2024-04-15',
          testing: '2024-05-15',
          finalSubmission: '2024-06-15'
        }
      }
    });

    // Create repository for the project
    const repository = await prisma.repository.create({
      data: {
        name: 'ai-student-analysis',
        isPrivate: true,
        projectId: project.id
      }
    });

    // Create branches for the repository
    const branches = await Promise.all([
      prisma.branch.create({
        data: {
          name: 'main',
          headCommitId: 'initial',
          repositoryId: repository.id
        }
      }),
      prisma.branch.create({
        data: {
          name: 'develop',
          headCommitId: 'initial',
          repositoryId: repository.id
        }
      }),
      prisma.branch.create({
        data: {
          name: 'feature/ml-model',
          headCommitId: 'initial',
          repositoryId: repository.id
        }
      })
    ]);

    // Create tasks
    await Promise.all([
      prisma.task.create({
        data: {
          title: 'Project Proposal Draft',
          description: 'Create initial project proposal document',
          status: TaskStatus.DONE,
          deadline: new Date('2024-01-10'),
          projectId: project.id,
          creatorId: advisor.id,
          assigneeId: students[0].id
        }
      }),
      prisma.task.create({
        data: {
          title: 'Literature Review',
          description: 'Research existing student performance analysis systems',
          status: TaskStatus.IN_PROGRESS,
          deadline: new Date('2024-02-10'),
          projectId: project.id,
          creatorId: advisor.id,
          assigneeId: students[1].id
        }
      }),
      prisma.task.create({
        data: {
          title: 'System Architecture Design',
          description: 'Design the overall system architecture',
          status: TaskStatus.TODO,
          deadline: new Date('2024-03-10'),
          projectId: project.id,
          creatorId: advisor.id,
          assigneeId: students[0].id
        }
      })
    ]);

    // Create merge requests
    await Promise.all([
      prisma.mergeRequest.create({
        data: {
          title: 'Add ML model implementation',
          description: 'Implementing the core machine learning model',
          status: MergeRequestStatus.OPEN,
          repositoryId: repository.id,
          creatorId: students[0].id,
          sourceBranchId: branches[2].id,
          targetBranchId: branches[1].id,
          reviews: {
            create: {
              decision: MergeRequestStatus.OPEN,
              comment: 'Please add more documentation',
              reviewerId: advisor.id
            }
          }
        }
      })
    ]);

    // Create evaluations
    await Promise.all([
      prisma.evaluation.create({
        data: {
          projectId: project.id,
          authorId: evaluator.id,
          score: 85,
          comments: 'Good progress on the project proposal. Consider adding more technical details.',
          criteriaData: {
            technicalFeasibility: 90,
            innovation: 85,
            methodology: 80
          }
        }
      })
    ]);

    // Check if rules already exist
    const existingRules = await prisma.rule.findFirst();
    
    if (!existingRules) {
      // Create the rules using values from mockRules
      const rules = await prisma.rule.create({
        data: {
          maxGroupSize: mockRules.maxGroupSize,
          advisorRequestDeadline: new Date(mockRules.advisorRequestDeadline),
          projectSubmissionDeadline: new Date(mockRules.projectSubmissionDeadline),
        },
      });
      
      console.log('Rules created:', rules);
    } else {
      console.log('Rules already exist, skipping creation');
    }

    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error creating seed data:', error);
  }

  console.log('Seed completed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 