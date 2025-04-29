// types.d.ts
// TypeScript type definitions for Prisma schema models and enums

// Enums
export enum Role {
  STUDENT = 'STUDENT',
  ADVISOR = 'ADVISOR',
  EVALUATOR = 'EVALUATOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  SUBMITTED = 'SUBMITTED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum AdvisorRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum MergeRequestStatus {
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MERGED = 'MERGED',
  CLOSED = 'CLOSED',
}

export enum ReviewDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  COMMENTED = 'COMMENTED',
}

export enum ChangeType {
  ADDED = 'ADDED',
  MODIFIED = 'MODIFIED',
  DELETED = 'DELETED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum FeedbackStatus {
  OPEN = 'OPEN',
  ADDRESSED = 'ADDRESSED',
  CLOSED = 'CLOSED',
}

// Models
export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: Role;
  emailVerified: boolean;
  verificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  profileInfo: {
    idNumber: string;
    department: string;
    batchYear?: string | null;
    expertise?: string[] | null;
    position?: string | null;
    bio?: string | null;
    interests?: string[] | null;
    skills?: string[] | null;
  }; 
  createdAt: Date;
  updatedAt: Date;
  advisorRequestsMade?: AdvisorRequest[];
  announcementsCreated?: Announcement[];
  commitsAuthored?: Commit[];
  evaluationsProvided?: Evaluation[];
  feedbackProvided?: Feedback[];
  groupsLed?: Group[];
  groupsMemberOf?: GroupMember[];
  invitesCreated?: GroupInvite[];
  mergeRequestsCreated?: MergeRequest[];
  mergeRequestsReviews?: MergeRequestReview[];
  notifications?: Notification[];
  advisedProjects?: Project[];
  evaluatedProjects?: ProjectEvaluator[];
  tasksAssigned?: Task[];
  tasksCreated?: Task[];
  repositoriesOwned?: Repository[];
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  leaderId: string;
  leader?: User;
  members?: GroupMember[];
  project?: Project | null;
  invites?: GroupInvite[];
  advisorRequests?: AdvisorRequest[];
  repositories?: Repository[]; // Group can have multiple repositories
  projectRepositories?: ProjectRepository[]; // Repositories linked to projects
}

export interface GroupMember {
  groupId: string;
  userId: string;
  joinedAt: Date;
  group?: Group;
  user?: User;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  submissionDate?: Date | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  groupId: string;
  advisorId?: string | null;
  milestones?: JSON | null; // JSON type
  group?: Group;
  advisor?: User | null;
  evaluations?: Evaluation[];
  feedback?: Feedback[];
  projectEvaluators?: ProjectEvaluator[];
  tasks?: Task[];
  repositories?: ProjectRepository[]; // Many-to-many relation with Repository
}

export interface ProjectEvaluator {
  projectId: string;
  evaluatorId: string;
  assignedAt: Date;
  project?: Project;
  evaluator?: User;
}

export interface ProjectRepository {
  projectId: string;
  repositoryId: string;
  assignedAt: Date;
  groupId: string;
  project?: Project;
  repository?: Repository;
  group?: Group;
}

export interface Repository {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  groupId: string;
  owner?: User;
  group?: Group;
  branches?: Branch[];
  commits?: Commit[];
  mergeRequests?: MergeRequest[];
  remotes?: Remote[];
  feedback?: Feedback[];
  projects?: ProjectRepository[]; // Many-to-many relation with Project
}

export interface Commit {
  id: string;
  message: string;
  timestamp: Date;
  createdAt: Date;
  repositoryId: string;
  authorId: string;
  parentCommitIDs: string[];
  mergeRequestId?: string | null;
  repository?: Repository;
  author?: User;
  mergeRequest?: MergeRequest | null;
  fileChanges?: FileChange[];
  branchesHead?: Branch[];
}

export interface FileChange {
  id: string;
  filePath: string;
  changeType: ChangeType;
  fileContentHash?: string | null;
  previousFileContentHash?: string | null;
  commitId: string;
  commit?: Commit;
}

export interface Branch {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  repositoryId: string;
  headCommitId: string;
  repository?: Repository;
  headCommit?: Commit;
  mergeRequestsAsSource?: MergeRequest[];
  mergeRequestsAsTarget?: MergeRequest[];
}

export interface MergeRequest {
  id: string;
  title: string;
  description?: string | null;
  status: MergeRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  repositoryId: string;
  creatorId: string;
  sourceBranchId: string;
  targetBranchId: string;
  repository?: Repository;
  creator?: User;
  sourceBranch?: Branch;
  targetBranch?: Branch;
  reviews?: MergeRequestReview[];
  feedback?: Feedback[];
  mergeCommit?: Commit | null;
}

export interface MergeRequestReview {
  id: string;
  decision: ReviewDecision;
  comment?: string | null;
  createdAt: Date;
  mergeRequestId: string;
  reviewerId: string;
  mergeRequest?: MergeRequest;
  reviewer?: User;
}

export interface Remote {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  repositoryId: string;
  repository?: Repository;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  assigneeId?: string | null;
  creatorId: string;
  project?: Project;
  assignee?: User | null;
  creator?: User;
}

export interface Feedback {
  id: string;
  title: string;
  content: string;
  status: FeedbackStatus;
  createdAt: Date;
  authorId: string;
  projectId?: string | null;
  mergeRequestId?: string | null;
  repositoryId?: string | null;
  author?: User;
  project?: Project | null;
  mergeRequest?: MergeRequest | null;
  repository?: Repository | null;
}

export interface Evaluation {
  id: string;
  score?: number | null;
  comments: string;
  criteriaData?: JSON | null; // JSON type
  createdAt: Date;
  authorId: string;
  projectId: string;
  author?: User;
  project?: Project;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: Date;
  recipientId: string;
  recipient?: User;
}

export interface AdvisorRequest {
  id: string;
  status: AdvisorRequestStatus;
  requestMessage?: string | null;
  responseMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  groupId: string;
  requestedAdvisorId: string;
  group?: Group;
  requestedAdvisor?: User;
}

export interface GroupInvite {
  id: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date | null;
  createdById: string;
  groupId: string;
  email?: string | null;
  group?: Group;
  createdBy?: User;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  creator?: User;
}

export interface Rule {
  id: number;
  maxGroupSize: number;
  advisorRequestDeadline: Date;
  projectSubmissionDeadline: Date;
  updatedAt: Date;
}