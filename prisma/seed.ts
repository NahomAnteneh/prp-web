import { PrismaClient, Role, ProjectStatus, TaskStatus, FeedbackStatus, AdvisorRequestStatus, MergeRequestStatus, ReviewDecision, ChangeType } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {

  // Hash passwords for users
  const passwordHash = await hash('password123', 10);

  // Create Users (fields: username, email)
  const admin = await prisma.user.create({
    data: {
      username: 'admin1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@university.edu',
      passwordHash,
      role: Role.ADMINISTRATOR,
      emailVerified: true,
    },
  });

  const advisor = await prisma.user.create({
    data: {
      username: 'advisor1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@university.edu',
      passwordHash,
      role: Role.ADVISOR,
      emailVerified: true,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      username: 'student1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@university.edu',
      passwordHash,
      role: Role.STUDENT,
      emailVerified: true,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      username: 'student2',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@university.edu',
      passwordHash,
      role: Role.STUDENT,
      emailVerified: true,
    },
  });

  // Create Groups (fields: name, description)
  const group = await prisma.group.create({
    data: {
      name: 'ProjectGroup1',
      description: 'Group for final year project',
      leaderId: student1.id,
    },
  });

  // Create GroupMembers (fields: groupId, userId)
  await prisma.groupMember.createMany({
    data: [
      { groupId: group.id, userId: student1.id },
      { groupId: group.id, userId: student2.id },
    ],
  });

  // Create Projects (fields: title, description)
  const project = await prisma.project.create({
    data: {
      title: 'Capstone Project',
      description: 'A software development project',
      status: ProjectStatus.ACTIVE,
      groupId: group.id,
      advisorId: advisor.id,
    },
  });

  // Create ProjectEvaluators (fields: projectId, evaluatorId)
  await prisma.projectEvaluator.create({
    data: {
      projectId: project.id,
      evaluatorId: advisor.id,
    },
  });

  // Create Repositories (fields: name, isPrivate)
  const repo1 = await prisma.repository.create({
    data: {
      name: 'frontend',
      isPrivate: true,
      ownerId: student1.id,
      groupId: group.id,
    },
  });

  const repo2 = await prisma.repository.create({
    data: {
      name: 'backend',
      isPrivate: true,
      ownerId: student1.id,
      groupId: group.id,
    },
  });

  // Create ProjectRepositories (fields: projectId, repositoryId)
  await prisma.projectRepository.createMany({
    data: [
      { projectId: project.id, repositoryId: repo1.id, groupId: group.id },
      { projectId: project.id, repositoryId: repo2.id, groupId: group.id },
    ],
  });

  // Create Commits (fields: message, timestamp)
  const commit = await prisma.commit.create({
    data: {
      id: 'commit1',
      message: 'Initial commit',
      timestamp: new Date(),
      repositoryId: repo1.id,
      authorId: student1.id,
      parentCommitIDs: [],
    },
  });

  // Create FileChanges (fields: filePath, changeType)
  await prisma.fileChange.create({
    data: {
      filePath: 'src/index.js',
      changeType: ChangeType.ADDED,
      commitId: commit.id,
    },
  });

  // Create Branches (fields: name, headCommitId)
  const mainBranch = await prisma.branch.create({
    data: {
      name: 'main',
      headCommitId: commit.id,
      repositoryId: repo1.id,
    },
  });

  const featureBranch = await prisma.branch.create({
    data: {
      name: 'feature',
      headCommitId: commit.id,
      repositoryId: repo1.id,
    },
  });

  // Create MergeRequests (fields: title, description)
  const mergeRequest = await prisma.mergeRequest.create({
    data: {
      title: 'Feature Branch Merge',
      description: 'Merging feature branch into main',
      status: MergeRequestStatus.OPEN,
      repositoryId: repo1.id,
      creatorId: student1.id,
      sourceBranchId: featureBranch.id,
      targetBranchId: mainBranch.id,
    },
  });

  // Create MergeRequestReviews (fields: decision, comment)
  await prisma.mergeRequestReview.create({
    data: {
      decision: ReviewDecision.APPROVED,
      comment: 'Looks good, ready to merge.',
      mergeRequestId: mergeRequest.id,
      reviewerId: advisor.id,
    },
  });

  // Create Remotes (fields: name, url)
  await prisma.remote.create({
    data: {
      name: 'origin',
      url: 'https://github.com/group1/frontend.git',
      repositoryId: repo1.id,
    },
  });

  // Create Tasks (fields: title, description)
  await prisma.task.create({
    data: {
      title: 'Implement Login Page',
      description: 'Create login page UI and authentication logic',
      status: TaskStatus.TODO,
      projectId: project.id,
      creatorId: student1.id,
    },
  });

  // Create Feedback (fields: title, content)
  await prisma.feedback.create({
    data: {
      title: 'UI Feedback',
      content: 'Improve responsiveness for mobile devices.',
      status: FeedbackStatus.OPEN,
      authorId: advisor.id,
      projectId: project.id,
    },
  });

  // Create Evaluations (fields: score, comments)
  await prisma.evaluation.create({
    data: {
      score: 85.5,
      comments: 'Good progress, needs better documentation.',
      authorId: advisor.id,
      projectId: project.id,
    },
  });

  // Create Notifications (fields: message, link)
  await prisma.notification.create({
    data: {
      message: 'New feedback received on your project.',
      link: `/projects/${project.id}/feedback`,
      read: false,
      recipientId: student1.id,
    },
  });

  // Create AdvisorRequests (fields: status, requestMessage)
  await prisma.advisorRequest.create({
    data: {
      status: AdvisorRequestStatus.PENDING,
      requestMessage: 'Requesting advisor for our project.',
      groupId: group.id,
      requestedAdvisorId: advisor.id,
    },
  });

  // Create GroupInvites (fields: code, expiresAt)
  await prisma.groupInvite.create({
    data: {
      code: 'INVITE123',
      expiresAt: new Date('2025-12-31'),
      createdById: student1.id,
      groupId: group.id,
    },
  });

  // Create Announcements (fields: title, content)
  await prisma.announcement.create({
    data: {
      title: 'Project Submission Deadline',
      content: 'All projects must be submitted by Dec 1, 2025.',
      active: true,
      creatorId: admin.id,
    },
  });

  // Create Rule (fields: maxGroupSize, advisorRequestDeadline)
  await prisma.rule.create({
    data: {
      id: 1,
      maxGroupSize: 5,
      advisorRequestDeadline: new Date('2025-05-01'),
      projectSubmissionDeadline: new Date('2025-12-01'),
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });