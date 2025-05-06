export enum Role {
  STUDENT = "STUDENT",
  ADVISOR = "ADVISOR",
  EVALUATOR = "EVALUATOR",
}

export enum ProjectStatus {
  ACTIVE = "ACTIVE", // Project is ongoing
  SUBMITTED = "SUBMITTED", // Project work submitted for evaluation
  COMPLETED = "COMPLETED", // Evaluation done, project finished
  ARCHIVED = "ARCHIVED", // Project closed and archived
}

export enum AdvisorRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum MergeRequestStatus {
  OPEN = "OPEN", // Request is open for review
  APPROVED = "APPROVED", // Request has been approved (but not yet merged)
  REJECTED = "REJECTED", // Request has been rejected
  MERGED = "MERGED", // Request has been successfully merged
  CLOSED = "CLOSED", // Request closed without merging
}

export enum ReviewDecision {
  APPROVED = "APPROVED", // Reviewer approves the changes
  REJECTED = "REJECTED", // Reviewer rejects the changes
  CHANGES_REQUESTED = "CHANGES_REQUESTED", // Reviewer requests specific changes
  COMMENTED = "COMMENTED", // Reviewer left comments without a specific decision
}

export enum ChangeType {
  ADDED = "ADDED",
  MODIFIED = "MODIFIED",
  DELETED = "DELETED",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}

export enum FeedbackStatus {
  OPEN = "OPEN", // Feedback requires attention
  ADDRESSED = "ADDRESSED", // Feedback has been acknowledged or acted upon
  CLOSED = "CLOSED", // Feedback resolution confirmed
}

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: Role;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  profileInfo: {
    idNumber: string;
    department: string;
    batchYear?: string | null;
    expertise?: string[] | null;
    position?: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;

  // --- Relations ---
  advisorRequestsMade: AdvisorRequest[];
  announcementsCreated: Announcement[];
  commitsAuthored: Commit[];
  evaluationsProvided: Evaluation[];
  feedbackProvided: Feedback[];
  groupsLed: Group[];
  groupsMemberOf: GroupMember[];
  invitesCreated: GroupInvite[];
  mergeRequestsCreated: MergeRequest[];
  mergeRequestsReviews: MergeRequestReview[];
  notifications: Notification[];
  advisedProjects: Project[];
  evaluatedProjects: ProjectEvaluator[];
  tasksAssigned: Task[];
  tasksCreated: Task[];
  repositoriesOwned: Repository[];
}

export interface Group {
  id: string;
  uniqueName: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** ID of the student who is the group leader */
  leaderId: string;

  // --- Relations ---
  leader: User;
  members: GroupMember[];
  projects: Project[];
  invites: GroupInvite[];
  advisorRequests: AdvisorRequest[];
  repositories: Repository[];
  projectRepositories: ProjectRepository[];
}

export interface GroupMember {
  groupId: string;
  userId: string;
  joinedAt: Date;

  // --- Relations ---
  group: Group;
  user: User;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  /** Status of the project using a predefined enum */
  status: ProjectStatus;
  submissionDate?: Date | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  groupId: string;
  advisorId?: string | null;

  // --- Relations ---
  group: Group;
  advisor?: User | null;
  evaluations: Evaluation[];
  feedback: Feedback[];
  projectEvaluators: ProjectEvaluator[];
  tasks: Task[];
  repositories: ProjectRepository[];
}

export interface ProjectEvaluator {
  projectId: string;
  evaluatorId: string;
  assignedAt: Date;

  // --- Relations ---
  project: Project;
  evaluator: User;
}

export interface ProjectRepository {
  projectId: string;
  repositoryId: string;
  assignedAt: Date;
  groupId: string; // ID of the group owning both the project and the repository

  // --- Relations ---
  project: Project;
  repository: Repository;
  group: Group; // Explicit link to the owning group
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  /** The User who created or primarily manages the repository */
  ownerId: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** ID of the group that owns this repository. If null, it's a user-owned repository. */
  groupId?: string | null;

  // --- Relations ---
  owner: User;
  group?: Group | null;
  branches: Branch[];
  commits: Commit[];
  mergeRequests: MergeRequest[];
  remotes: Remote[];
  feedback: Feedback[];
  projects: ProjectRepository[];
}

export interface Commit {
  id: string; // Use the actual commit hash as ID
  message: string;
  timestamp: Date;
  createdAt: Date;
  repositoryId: string;
  authorId: string; // User who authored the commit
  parentCommitIDs: string[]; // IDs (hashes) of parent commits
  /** ID of the merge request that resulted in this commit (if applicable). This is the foreign key. */
  mergeRequestId?: string | null;

  // --- Relations ---
  repository: Repository;
  author: User;
  mergeRequest?: MergeRequest | null;
  fileChanges: FileChange[];
  branchesHead: Branch[]; // Branches where this commit is the head
}

export interface FileChange {
  id: string;
  filePath: string;
  changeType: ChangeType; // ADDED, MODIFIED, DELETED
  fileContentHash?: string | null; // Hash of the content after the change (null for DELETED)
  previousFileContentHash?: string | null; // Hash of the content before the change (null for ADDED)
  commitId: string; // Commit ID (hash)

  // --- Relations ---
  commit: Commit;
}

export interface Branch {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  repositoryId: string;
  headCommitId: string; // ID (hash) of the latest commit on this branch

  // --- Relations ---
  repository: Repository;
  headCommit: Commit;
  mergeRequestsAsSource: MergeRequest[];
  mergeRequestsAsTarget: MergeRequest[];
}

export interface MergeRequest {
  id: string;
  title: string;
  description?: string | null;
  status: MergeRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  repositoryId: string;
  creatorId: string; // User who created the MR
  sourceBranchId: string; // Branch changes are coming from
  targetBranchId: string; // Branch changes are intended for

  // --- Relations ---
  repository: Repository;
  creator: User;
  sourceBranch: Branch;
  targetBranch: Branch;
  reviews: MergeRequestReview[];
  feedback: Feedback[];
  mergeCommit?: Commit | null; // Relation back to the merge commit
}

export interface MergeRequestReview {
  id: string;
  decision: ReviewDecision;
  comment?: string | null;
  createdAt: Date;
  mergeRequestId: string;
  reviewerId: string;

  // --- Relations ---
  mergeRequest: MergeRequest;
  reviewer: User;
}

export interface Remote {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  repositoryId: string;

  // --- Relations ---
  repository: Repository;
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
  assigneeId?: string | null; // User assigned to the task
  creatorId: string; // User who created the task

  // --- Relations ---
  project: Project;
  assignee?: User | null;
  creator: User;
}

export interface Feedback {
  id: string;
  title?: string | null; // Optional title
  content: string;
  status: FeedbackStatus;
  createdAt: Date;
  authorId: string; // User who gave the feedback
  projectId?: string | null; // Link if feedback is on a Project
  mergeRequestId?: string | null; // Link if feedback is on a Merge Request
  repositoryId?: string | null; // Link if feedback is on a Repository

  // --- Relations ---
  author: User;
  project?: Project | null;
  mergeRequest?: MergeRequest | null;
  repository?: Repository | null;
}

export interface Evaluation {
  id: string;
  score?: number | null; // Overall score (optional)
  comments: string;
  /** Store specific criteria scores/comments as JSON */
  criteriaData?: any | null; // Prisma Json type maps to 'any' or a specific type
  createdAt: Date;
  authorId: string; // User (Evaluator/Advisor role) who submitted the evaluation
  projectId: string;

  // --- Relations ---
  author: User;
  project: Project;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  link?: string | null; // Optional URL link related to the notification
  createdAt: Date;
  recipientId: string;

  // --- Relations ---
  recipient: User;
}

export interface AdvisorRequest {
  id: string;
  status: AdvisorRequestStatus;
  requestMessage?: string | null;
  responseMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  groupId: string; // The group making the request
  requestedAdvisorId: string; // The User (potential advisor) being requested

  // --- Relations ---
  group: Group;
  requestedAdvisor: User;
}

export interface GroupInvite {
  id: string;
  code: string; // Unique code for the invite link
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date | null; // Timestamp when the invite was used
  createdById: string; // User who created the invite (usually group leader or member)
  groupId: string; // Group the invite is for
  email?: string | null; // Optionally target a specific email

  // --- Relations ---
  group: Group;
  createdBy: User;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
  priority: number; // For ordering announcements
  createdAt: Date;
  updatedAt: Date;
  creatorId: string; // Admin user who created it

  // --- Relations ---
  creator: User;
}

export interface Rule {
  id: number; // Fixed ID for singleton
  maxGroupSize: number;
  advisorRequestDeadline?: Date | null;
  projectSubmissionDeadline?: Date | null;
  updatedAt: Date;

  // Add other global settings as needed
}
