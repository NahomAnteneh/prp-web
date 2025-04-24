// This file contains mock data for API responses

export const mockRules = {
  maxGroupSize: 5,
  advisorRequestDeadline: "2024-12-31T23:59:59.999Z",
  projectSubmissionDeadline: "2025-05-31T23:59:59.999Z",
};

export const mockGroup = {
  id: "group-1",
  name: "Team Innovators",
  description: "Working on innovative solutions for modern problems",
  leaderId: "user-1",
  createdAt: "2023-09-01T10:00:00.000Z",
  updatedAt: "2023-09-15T14:30:00.000Z",
  members: [
    {
      userId: "user-1",
      joinedAt: "2023-09-01T10:00:00.000Z",
      user: {
        id: "user-1",
        name: "John Doe",
        username: "johndoe",
      },
    },
    {
      userId: "user-2",
      joinedAt: "2023-09-02T11:00:00.000Z",
      user: {
        id: "user-2",
        name: "Jane Smith",
        username: "janesmith",
      },
    },
    {
      userId: "user-3",
      joinedAt: "2023-09-03T12:00:00.000Z",
      user: {
        id: "user-3",
        name: "Bob Johnson",
        username: "bobjohnson",
      },
    },
  ],
  advisorRequests: {
    id: "request-1",
    status: "PENDING",
    createdAt: "2023-09-10T15:00:00.000Z",
    advisorId: "advisor-1",
    message: "We're working on a project related to AI and would appreciate your guidance.",
    advisor: {
      id: "advisor-1",
      name: "Dr. Alice Johnson",
      username: "alicejohnson",
    },
  },
  project: {
    id: "project-1",
    title: "AI Assistant Application",
    description: "An AI-powered assistant for scheduling and task management",
    status: "ACTIVE",
    submissionDate: null,
    createdAt: "2023-09-15T14:30:00.000Z",
    updatedAt: "2023-09-20T09:45:00.000Z",
    advisorId: "advisor-1",
    advisor: {
      id: "advisor-1",
      name: "Dr. Alice Johnson",
      username: "alicejohnson",
      profileInfo: {
        expertise: ["Artificial Intelligence", "Machine Learning", "Data Science"],
        bio: "Professor of Computer Science with 15 years of experience in AI research.",
      },
    },
    milestones: [
      {
        title: "Requirements Analysis",
        description: "Define project requirements and user stories",
        deadline: "2023-10-15T23:59:59.999Z",
        completed: true,
      },
      {
        title: "Design Phase",
        description: "Create system architecture and UI/UX designs",
        deadline: "2023-11-30T23:59:59.999Z",
        completed: false,
      },
      {
        title: "Implementation Phase",
        description: "Develop the core functionality",
        deadline: "2024-02-28T23:59:59.999Z",
        completed: false,
      },
    ],
  },
};

export const mockProjects = [
  {
    id: "project-1",
    title: "AI Assistant Application",
    description: "An AI-powered assistant for scheduling and task management",
    status: "ACTIVE",
    submissionDate: null,
    createdAt: "2023-09-15T14:30:00.000Z",
    updatedAt: "2023-09-20T09:45:00.000Z",
    milestones: [
      {
        title: "Requirements Analysis",
        description: "Define project requirements and user stories",
        deadline: "2023-10-15T23:59:59.999Z",
        completed: true,
      },
      {
        title: "Design Phase",
        description: "Create system architecture and UI/UX designs",
        deadline: "2023-11-30T23:59:59.999Z",
        completed: false,
      },
      {
        title: "Implementation Phase",
        description: "Develop the core functionality",
        deadline: "2024-02-28T23:59:59.999Z",
        completed: false,
      },
    ],
  },
];

export const mockTasks = [
  {
    id: "task-1",
    title: "Create wireframes for user interface",
    description: "Design wireframes for the main dashboard and user interaction flows",
    status: "DONE",
    dueDate: "2023-10-10T23:59:59.999Z",
    createdAt: "2023-09-20T10:00:00.000Z",
    assigneeId: "user-2",
    assignee: {
      id: "user-2",
      name: "Jane Smith",
      username: "janesmith",
    },
    creatorId: "user-1",
    creator: {
      id: "user-1",
      name: "John Doe",
      username: "johndoe",
    },
    projectId: "project-1",
    project: {
      id: "project-1",
      title: "AI Assistant Application",
    },
  },
  {
    id: "task-2",
    title: "Implement core scheduling algorithm",
    description: "Develop the AI algorithm for optimal scheduling of tasks",
    status: "IN_PROGRESS",
    dueDate: "2023-11-15T23:59:59.999Z",
    createdAt: "2023-09-25T11:30:00.000Z",
    assigneeId: "user-1",
    assignee: {
      id: "user-1",
      name: "John Doe",
      username: "johndoe",
    },
    creatorId: "user-1",
    creator: {
      id: "user-1",
      name: "John Doe",
      username: "johndoe",
    },
    projectId: "project-1",
    project: {
      id: "project-1",
      title: "AI Assistant Application",
    },
  },
  {
    id: "task-3",
    title: "Set up database schema",
    description: "Design and implement the database schema for storing user data and scheduling information",
    status: "TODO",
    dueDate: "2023-11-30T23:59:59.999Z",
    createdAt: "2023-09-30T14:15:00.000Z",
    assigneeId: "user-3",
    assignee: {
      id: "user-3",
      name: "Bob Johnson",
      username: "bobjohnson",
    },
    creatorId: "user-1",
    creator: {
      id: "user-1",
      name: "John Doe",
      username: "johndoe",
    },
    projectId: "project-1",
    project: {
      id: "project-1",
      title: "AI Assistant Application",
    },
  },
];

export const mockFeedback = [
  {
    id: "feedback-1",
    content: "Your project proposal is well-structured, but I suggest focusing more on the technical feasibility of the AI components. Please provide more details about the algorithms you plan to use.",
    createdAt: "2023-10-05T16:45:00.000Z",
    projectId: "project-1",
    project: {
      id: "project-1",
      title: "AI Assistant Application",
    },
    authorId: "advisor-1",
    author: {
      id: "advisor-1",
      name: "Dr. Alice Johnson",
      username: "alicejohnson",
      role: "ADVISOR",
    },
    mergeRequestId: null,
    mergeRequest: null,
  },
  {
    id: "feedback-2",
    content: "The wireframes look good, but consider improving the user flow for the scheduling feature. The current design might be confusing for new users.",
    createdAt: "2023-10-15T11:20:00.000Z",
    projectId: "project-1",
    project: {
      id: "project-1",
      title: "AI Assistant Application",
    },
    authorId: "advisor-1",
    author: {
      id: "advisor-1",
      name: "Dr. Alice Johnson",
      username: "alicejohnson",
      role: "ADVISOR",
    },
    mergeRequestId: "merge-1",
    mergeRequest: {
      id: "merge-1",
      title: "UI Design Implementation",
    },
  },
];

export const mockMessages = [
  {
    id: "message-1",
    content: "Hello team! I've reviewed your project proposal and have some suggestions. Let's schedule a meeting to discuss them.",
    createdAt: "2023-10-01T10:30:00.000Z",
    senderId: "advisor-1",
    sender: {
      id: "advisor-1",
      name: "Dr. Alice Johnson",
      username: "alicejohnson",
      role: "ADVISOR",
    },
    recipientId: "group-1",
    recipient: {
      id: "group-1",
      name: "Team Innovators",
      role: "GROUP",
    },
    isFromGroup: false,
  },
  {
    id: "message-2",
    content: "Thank you for the feedback, Dr. Johnson! We're available for a meeting this Thursday at 2 PM if that works for you.",
    createdAt: "2023-10-01T14:15:00.000Z",
    senderId: "user-1",
    sender: {
      id: "user-1",
      name: "John Doe",
      username: "johndoe",
      role: "STUDENT",
    },
    recipientId: "advisor-1",
    recipient: {
      id: "advisor-1",
      name: "Dr. Alice Johnson",
      role: "ADVISOR",
    },
    isFromGroup: true,
  },
  {
    id: "message-3",
    content: "Thursday at 2 PM works perfectly. I'll send a calendar invite with the meeting details. Please prepare any specific questions you have about the AI components.",
    createdAt: "2023-10-02T09:45:00.000Z",
    senderId: "advisor-1",
    sender: {
      id: "advisor-1",
      name: "Dr. Alice Johnson",
      username: "alicejohnson",
      role: "ADVISOR",
    },
    recipientId: "group-1",
    recipient: {
      id: "group-1",
      name: "Team Innovators",
      role: "GROUP",
    },
    isFromGroup: false,
  },
]; 