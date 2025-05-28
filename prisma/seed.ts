import { PrismaClient, Role, ProjectStatus, AdvisorRequestStatus, MergeRequestStatus, ReviewDecision, ChangeType, TaskStatus, FeedbackStatus, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- Configuration ---
const NUM_USERS = 25;
const NUM_GROUPS = 6;
const NUM_PROJECTS_PER_GROUP_RANGE = [2, 4];
const NUM_REPOS_PER_GROUP_RANGE = [4, 6];
// const NUM_USER_REPOS = 0; // Removed as unused
const COMMITS_PER_BRANCH = 6;
const BRANCHES_PER_REPO = 4;
const MAX_MEMBERS_PER_GROUP = 7;
const TASKS_PER_PROJECT = 12;
const FEEDBACK_ITEMS = 35;
const EVALUATIONS_PER_PROJECT = 4;
const MR_PER_REPO = 8;
const REVIEWS_PER_MR = 3;
const NOTIFICATIONS_PER_USER = 8;
const ANNOUNCEMENTS = 8;
const GROUP_INVITES = 50;
const ADVISOR_REQUESTS = 30;

// --- Helper Functions ---

function getRandomElement<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubset<T>(arr: T[], count: number): T[] {
    if (arr.length === 0) return [];
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, arr.length));
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// --- Main Seeding Function ---

async function main() {
    console.log('Starting seeding process...');
    // Ensure Prisma Client is generated and up-to-date
    // Consider adding `npx prisma generate` to your pre-seed script

    // --- Clear Existing Data (Order Matters!) ---
    console.log('Clearing existing data...');
    // Start with models that have few or no dependencies on others
    await prisma.notification.deleteMany();
    await prisma.groupInvite.deleteMany();
    // AdvisorRequest depends on Group, User, Project -> delete before Project
    // await prisma.advisorRequest.deleteMany(); // Moved down
    await prisma.announcement.deleteMany(); // Depends on User
    await prisma.rule.deleteMany(); // Singleton
    await prisma.evaluation.deleteMany(); // Depends on Project, User
    await prisma.feedback.deleteMany(); // Depends on Project?, MR?, Repo?, User
    await prisma.task.deleteMany(); // Depends on Project, User
    await prisma.mergeRequestReview.deleteMany(); // Depends on MR, User
    await prisma.fileChange.deleteMany(); // Depends on Commit

    // Handle potential cycles or complex dependencies before deleting core items
    // Commit has mergeRequestId? which points to MergeRequest. Set this null first.
    // The relation Commit.mergeRequest has onDelete: SetNull, so Prisma should handle this.
    // Let's explicitly update for safety during cleanup phase.
    await prisma.commit.updateMany({data: {mergeRequestId: null}}); // Break MR->Commit link explicitly
    // MergeRequest has sourceBranchId and targetBranchId pointing to Branch. onDelete: Cascade handles this if MR deleted first.
    // MergeRequest has mergeCommit Commit? relation, but FK is on Commit.
    await prisma.mergeRequest.deleteMany(); // Depends on Repository, User, Branch (onDelete: Cascade for Reviews, Feedback)
    // Branch has headCommitId pointing to Commit. onDelete: Restrict on Commit.relation BranchHead.
    // => Must delete Branches *before* the Commits they point to, or handle headCommitId update.
    // => Let's delete Branch first. It depends on Repo.
    await prisma.branch.deleteMany(); // Depends on Repository, Commit (headCommitId - handled by deleting Branch first)
    // Commit depends on Repo, User. FileChanges already deleted. MR links nulled.
    await prisma.commit.deleteMany(); // Depends on Repository, User
    // ProjectRepository depends on Project, Repository, Group.
    await prisma.projectRepository.deleteMany();
    // Remote depends on Repository
    await prisma.remote.deleteMany();
    // Repository depends on Group (owner relation). MRs, Branches, Commits, Remotes deleted.
    await prisma.repository.deleteMany();
    // Task depends on Project, User.
    // await prisma.task.deleteMany(); // Already deleted above
    // ProjectEvaluator depends on Project, User.
    await prisma.projectEvaluator.deleteMany();
    // Evaluation depends on Project, User.
    // await prisma.evaluation.deleteMany(); // Already deleted above
    // AdvisorRequest depends on Group, User, Project.
    await prisma.advisorRequest.deleteMany(); // Delete before Project
    // Project depends on Group, User (advisor). Tasks, Evals, Evaluators, ProjectRepos deleted.
    await prisma.project.deleteMany();
    // GroupMember depends on Group, User.
    await prisma.groupMember.deleteMany();
    // GroupInvite depends on Group, User.
    // await prisma.groupInvite.deleteMany(); // Already deleted above
    // Group depends on User (leader). Projects, Members, Invites, Repos, AdvisorRequests deleted.
    await prisma.group.deleteMany();
    // Announcement depends on User.
    // await prisma.announcement.deleteMany(); // Already deleted above
    // Notification depends on User.
    // await prisma.notification.deleteMany(); // Already deleted above
    // User is base model. Relations pointing to it should be handled by cascades or previous deletes.
    await prisma.user.deleteMany();
    // Rule is singleton.
    // await prisma.rule.deleteMany(); // Already deleted above

    console.log('Existing data cleared.');


    // --- Seed Rule (Singleton) ---
    console.log('Seeding Rule...');
    await prisma.rule.upsert({
        where: { id: 1 }, // Use the fixed ID
        update: {}, // No updates needed if it exists
        create: {
            id: 1, // Explicitly set the fixed ID
            maxGroupSize: MAX_MEMBERS_PER_GROUP,
            // Make deadlines optional based on schema
            advisorRequestDeadline: faker.datatype.boolean(0.8) ? faker.date.future({ years: 1 }) : null,
            projectSubmissionDeadline: faker.datatype.boolean(0.8) ? faker.date.future({ years: 1 }) : null,
        },
    });
    console.log('Rule seeded.');

    // --- Seed Users ---
    console.log(`Seeding ${NUM_USERS} Users...`);
    const usersData: Prisma.UserCreateManyInput[] = [];
    const passwordHash = await hashPassword('password123');
    const roles = Object.values(Role);
    for (let i = 0; i < NUM_USERS; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        // Generate a more unique userId, less prone to collisions
        const baseUsername = faker.internet.userName({ firstName, lastName }).toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 15);
        const userId = `${baseUsername}_${faker.string.alphanumeric(5)}_${i}`;
        // Generate a more unique email
        const baseEmail = faker.internet.email({ firstName, lastName, provider: 'test.edu' }).toLowerCase();
        const emailParts = baseEmail.split('@');
        const email = `${emailParts[0].substring(0, 20)}_${faker.string.alphanumeric(5)}_${i}@${emailParts[1]}`;

        usersData.push({
            userId,
            firstName,
            lastName,
            email,
            passwordHash,
            role: getRandomElement(roles) ?? Role.STUDENT,
            // Ensure profileInfo matches potential structure (example)
            profileInfo: {
                department: faker.commerce.department(),
                bio: faker.lorem.sentence(),
                expertise: faker.datatype.boolean(0.6) ? getRandomSubset(faker.definitions.hacker.ingverb.concat(faker.definitions.hacker.adjective), getRandomInt(1, 4)) : undefined,
            },
            passwordResetToken: faker.datatype.boolean(0.05) ? faker.string.uuid() : null,
            passwordResetExpires: faker.datatype.boolean(0.05) ? faker.date.future() : null,
        });
    }
    try {
        // Using createMany with skipDuplicates might hide issues if generation isn't unique enough.
        // Let's try individual creates for better error reporting if needed.
        let userCreateCount = 0;
        for (const userData of usersData) {
            try {
                await prisma.user.create({ data: userData });
                userCreateCount++;
            } catch (error) {
                 if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                     console.warn(`Could not create user due to duplicate field (likely email or userId): ${userData.userId} / ${userData.email}. Skipping.`);
                 } else {
                     console.error(`Could not create user ${userData.userId}: ${error}`);
                 }
            }
        }
         console.log(`Created ${userCreateCount} users.`);
        // await prisma.user.createMany({ data: usersData, skipDuplicates: true });
    } catch (e) {
        // This catch block might not be reached if using individual creates above
        console.error("Error creating users batch:", e);
    }

    const createdUsers = await prisma.user.findMany();
    const studentUsers = createdUsers.filter(u => u.role === Role.STUDENT);
    const advisorUsers = createdUsers.filter(u => u.role === Role.ADVISOR);
    const evaluatorUsers = createdUsers.filter(u => u.role === Role.EVALUATOR);
    const adminUsers = createdUsers.filter(u => u.role === Role.ADMINISTRATOR);
    console.log(`${createdUsers.length} Users seeded. Students: ${studentUsers.length}, Advisors: ${advisorUsers.length}, Evaluators: ${evaluatorUsers.length}, Admins: ${adminUsers.length}`);

    // --- Seed Groups ---
    console.log(`Seeding ${NUM_GROUPS} Groups...`);
    const groupsData: Prisma.GroupCreateInput[] = []; // Use CreateInput for relations
    if (studentUsers.length === 0) {
        console.warn("No student users found to lead groups. Skipping group creation.");
    } else {
        for (let i = 0; i < NUM_GROUPS; i++) {
            const leader = getRandomElement(studentUsers);
            if (leader?.userId) { // Ensure leader and userId exist
                const uniqueSuffix = faker.string.alphanumeric(6);
                const groupUserName = `group_${leader.userId.substring(0, 5)}_${uniqueSuffix}_${i}`.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 30); // Make username more unique and safe
                const groupName = faker.company.name().substring(0, 30) + ` ${uniqueSuffix}`;

                groupsData.push({
                    groupUserName: groupUserName,
                    name: groupName,
                    description: faker.lorem.paragraph(),
                    // Connect leader using relation syntax
                    leader: { connect: { userId: leader.userId } },
                });
            } else {
                 console.warn("Could not select a valid leader for a group. Skipping one group creation.");
            }
        }
        let groupCreateCount = 0;
        for (const groupData of groupsData) {
            try {
                await prisma.group.create({ data: groupData });
                groupCreateCount++;
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                     console.warn(`Could not create group due to duplicate groupUserName: ${groupData.groupUserName}. Skipping.`);
                 } else {
                    console.warn(`Could not create group ${groupData.name}: ${error}`);
                }
            }
        }
        console.log(`Created ${groupCreateCount} groups individually.`);
    }
    const createdGroups = await prisma.group.findMany();
    console.log(`${createdGroups.length} Groups seeded.`);

    // --- Seed Group Members ---
    console.log('Seeding Group Members...');
    const groupMembersData: Prisma.GroupMemberCreateManyInput[] = [];
    // Keep track of members already added to avoid duplicates per group
    const groupMembershipTracker: { [key: string]: Set<string> } = {};

    if (studentUsers.length > 0 && createdGroups.length > 0) {
        for (const group of createdGroups) {
            groupMembershipTracker[group.groupUserName] = new Set<string>();

            // Add leader if they exist
            if (group.leaderId) {
                 // Check if leader is already tracked (shouldn't happen here, but good practice)
                 if(!groupMembershipTracker[group.groupUserName].has(group.leaderId)){
                    groupMembersData.push({ groupUserName: group.groupUserName, userId: group.leaderId });
                    groupMembershipTracker[group.groupUserName].add(group.leaderId);
                 }
            }

            // Add other members
            const memberCount = getRandomInt(0, MAX_MEMBERS_PER_GROUP - 1); // 0 to MAX-1 additional members
            // Ensure potential members are students and not the leader
            const potentialMembers = studentUsers.filter(u => u.userId !== group.leaderId);
            const membersToAdd = getRandomSubset(potentialMembers, memberCount);

            for (const member of membersToAdd) {
                if (member.userId && !groupMembershipTracker[group.groupUserName].has(member.userId)) {
                    groupMembersData.push({ groupUserName: group.groupUserName, userId: member.userId });
                    groupMembershipTracker[group.groupUserName].add(member.userId);
                }
            }
        }
        console.log(`Generated ${groupMembersData.length} group member entries.`);

        // Deduplication might be redundant now due to the tracker, but keep for safety
        const uniqueGroupMembers = Array.from(new Set(groupMembersData.map(gm => `${gm.groupUserName}|${gm.userId}`)))
            .map(idPair => {
                const [groupUserName, userId] = idPair.split('|');
                return groupMembersData.find(gm => gm.groupUserName === groupUserName && gm.userId === userId);
            })
            .filter((gm): gm is Prisma.GroupMemberCreateManyInput => gm !== undefined && gm.groupUserName !== undefined && gm.userId !== undefined);

        console.log(`After explicit deduplication, ${uniqueGroupMembers.length} unique group member entries.`);

        if (uniqueGroupMembers.length > 0) {
            try {
                const result = await prisma.groupMember.createMany({
                    data: uniqueGroupMembers,
                    skipDuplicates: true // Use Prisma's built-in skipping for composite keys
                });
                console.log(`${result.count} Group Memberships seeded.`);
            } catch (e) {
                console.error('Error creating group members:', e);
                 // Try individual inserts if batch fails
                 let memberCreateCount = 0;
                 for (const memberData of uniqueGroupMembers) {
                     try {
                         await prisma.groupMember.create({ data: memberData });
                         memberCreateCount++;
                     } catch (indivError) {
                         if (indivError instanceof Prisma.PrismaClientKnownRequestError && indivError.code === 'P2002') {
                             console.warn(`Skipping duplicate group member: User ${memberData.userId} in Group ${memberData.groupUserName}`);
                         } else if (indivError instanceof Prisma.PrismaClientKnownRequestError && indivError.code === 'P2003'){
                             console.warn(`Skipping group member due to missing User ${memberData.userId} or Group ${memberData.groupUserName}`);
                         } else {
                            console.error(`Failed to create group membership for User ${memberData.userId} in Group ${memberData.groupUserName}: ${indivError}`);
                         }
                     }
                 }
                 console.log(`Seeded ${memberCreateCount} group members individually.`);
            }
        } else {
            console.log('No unique group members generated to seed.');
        }
    } else {
        console.warn("No student users or groups found to create memberships.");
    }

     // --- Seed Repositories ---
    console.log(`Seeding Repositories...`);
    // Use the correct type which includes scalar fields like groupUserName
    const repositoriesInputData: Prisma.RepositoryCreateInput[] = [];
    // Track repo names per group to ensure uniqueness [groupUserName, name]
    const repoNameTracker: Set<string> = new Set();

    for (const group of createdGroups) {
        const numRepos = getRandomInt(NUM_REPOS_PER_GROUP_RANGE[0], NUM_REPOS_PER_GROUP_RANGE[1]);
        // Any user can be the initial ownerId, though it might make more sense for it to be the leader or a member
        const membersOfGroup = await prisma.groupMember.findMany({ where: { groupUserName: group.groupUserName}, select: { userId: true } });
        const potentialOwners = await prisma.user.findMany({ where: { userId: { in: membersOfGroup.map(m => m.userId) } } });
        if (potentialOwners.length === 0) potentialOwners.push(...createdUsers); // Fallback if group has no members somehow
        const owner = getRandomElement(potentialOwners) ?? getRandomElement(createdUsers); // Select owner

        if (!owner?.userId) {
             console.warn(`Skipping repo creation for group ${group.groupUserName} - could not determine an owner.`);
             continue;
        }

        for (let i = 0; i < numRepos; i++) {
            const baseRepoName = `${faker.word.noun()}-${faker.word.adjective()}`.toLowerCase().replace(/ /g, '-').substring(0, 20);
            const repoName = `${baseRepoName}-${group.groupUserName.substring(0, 8)}-${i}`;
            const repoIdentifier = `${group.groupUserName}|${repoName}`;

            if (repoNameTracker.has(repoIdentifier)) {
                console.warn(`Skipping duplicate repository generation: Name '${repoName}' for group '${group.groupUserName}'.`);
                continue; // Skip if we already generated this combo
            }

            // FIX: Provide scalar fields directly. The 'owner' relation connect is not needed
            //      if the foreign key 'groupUserName' is provided, as the relation uses this field.
            //      Prisma implicitly links relations based on foreign keys.
            const repoData: Prisma.RepositoryCreateInput = {
                name: repoName,
                description: faker.lorem.sentence(),
                ownerId: owner.userId, // This field exists on Repository model for the User who created it
                isPrivate: faker.datatype.boolean(0.9),
                owner: { connect: { groupUserName: group.groupUserName } }, // Use relation connect syntax to link the group
                // owner: { connect: { groupUserName: group.groupUserName } } // REMOVED - Redundant and causes type error
            };

            repositoriesInputData.push(repoData);
            repoNameTracker.add(repoIdentifier); // Track the generated repo
        }
    }

    let createdRepoCount = 0;
    for (const repoData of repositoriesInputData) {
        try {
            // Use repoData directly
            await prisma.repository.create({ data: repoData });
            createdRepoCount++;
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                // The target fields are `name` and `groupUserName` for the primary key/unique constraint
                 const target = (e.meta?.target as string[]) ?? [];
                 if (target.includes('name') && target.includes('groupUserName')) {
                     // Access groupUserName directly from repoData (which is RepositoryCreateInput type)
                     console.warn(`Skipping duplicate repository (composite key): Name '${repoData.name}' for group '${repoData.owner.connect?.groupUserName}'.`);
                 } else {
                      console.warn(`Skipping repository '${repoData.name}' due to P2002 error on fields: ${target.join(', ')}`);
                 }
            } else if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003'){
                 // Access groupUserName directly from repoData
                 console.warn(`Skipping repository '${repoData.name}' due to missing related record (User ${repoData.ownerId} or Group ${repoData.owner.connect?.groupUserName})`);
            }
            else {
                console.error(`Failed to create repository '${repoData.name}': ${e}`);
            }
        }
    }
    console.log(`${createdRepoCount} Repositories seeded.`);
    const createdRepositories = await prisma.repository.findMany(); // Fetch including name and groupUserName


    // --- Seed Projects ---
    console.log('Seeding Projects...');
    const projectsData: Prisma.ProjectCreateManyInput[] = [];
    const projectStatuses = Object.values(ProjectStatus);
    for (const group of createdGroups) {
        const numProjects = getRandomInt(NUM_PROJECTS_PER_GROUP_RANGE[0], NUM_PROJECTS_PER_GROUP_RANGE[1]);
        for (let i = 0; i < numProjects; i++) {
            const advisor = getRandomElement(advisorUsers);
            const title = `${faker.commerce.productName()} Project ${group.groupUserName.substring(0, 6)}-${i}`.substring(0, 50); // Ensure title length

            projectsData.push({
                // id is generated by cuid()
                title: title,
                description: faker.lorem.paragraphs(2),
                status: getRandomElement(projectStatuses) ?? ProjectStatus.ACTIVE,
                isPrivate: faker.datatype.boolean(0.5),
                submissionDate: faker.datatype.boolean(0.3) ? faker.date.past({ years: 0.5 }) : null,
                archived: faker.datatype.boolean(0.1),
                groupUserName: group.groupUserName, // Link to group
                advisorId: advisor?.userId ?? null, // Link to advisor (optional)
            });
        }
    }
    if (projectsData.length > 0) {
        try {
            const result = await prisma.project.createMany({ data: projectsData });
            console.log(`${result.count} Projects seeded.`);
        } catch (e) {
             console.error("Error creating projects:", e);
        }
    } else {
        console.log('No projects generated to seed.');
    }
    const createdProjects = await prisma.project.findMany();

    // --- Seed ProjectRepository ---
    console.log('Seeding ProjectRepository links...');
    const projectRepoLinksData: Prisma.ProjectRepositoryCreateManyInput[] = [];
    const projectRepoLinkTracker: Set<string> = new Set();

    for (const project of createdProjects) {
        // Find repositories belonging to the same group as the project
        const groupRepos = createdRepositories.filter(repo => repo.groupUserName === project.groupUserName);
        if (groupRepos.length > 0) {
            // Link 1 or 2 repositories randomly
            const reposToLinkCount = getRandomInt(1, Math.min(2, groupRepos.length));
            const reposToLink = getRandomSubset(groupRepos, reposToLinkCount);

            for (const repoToLink of reposToLink) {
                const linkIdentifier = `${project.id}|${repoToLink.name}|${repoToLink.groupUserName}`;
                if (!projectRepoLinkTracker.has(linkIdentifier)) {
                    projectRepoLinksData.push({
                        projectId: project.id,
                        repositoryName: repoToLink.name, // Use name
                        groupUserName: repoToLink.groupUserName, // Use groupUserName
                    });
                    projectRepoLinkTracker.add(linkIdentifier);
                }
            }
        }
    }
    // Deduplication might be redundant due to tracker, but kept for safety
    const uniqueProjectRepoLinks = Array.from(projectRepoLinkTracker).map(idPair => {
        const [projectId, repositoryName, groupUserName] = idPair.split('|');
        return projectRepoLinksData.find(l => l.projectId === projectId && l.repositoryName === repositoryName && l.groupUserName === groupUserName)!;
    }).filter(Boolean); // Filter out potential undefined if find fails

    if (uniqueProjectRepoLinks.length > 0) {
         try {
            const result = await prisma.projectRepository.createMany({ data: uniqueProjectRepoLinks, skipDuplicates: true });
            console.log(`${result.count} ProjectRepository links seeded.`);
         } catch(e) {
            console.error(`Error seeding ProjectRepository links: ${e}`);
            // Fallback to individual creation if needed
            let linkCreateCount = 0;
            for(const link of uniqueProjectRepoLinks) {
                try {
                    await prisma.projectRepository.create({data: link});
                    linkCreateCount++;
                } catch (indivError) {
                    if (indivError instanceof Prisma.PrismaClientKnownRequestError && indivError.code === 'P2002') {
                        console.warn(`Skipping duplicate ProjectRepository link: Project ${link.projectId} -> Repo ${link.repositoryName} (Group: ${link.groupUserName})`);
                    } else if (indivError instanceof Prisma.PrismaClientKnownRequestError && indivError.code === 'P2003'){
                        console.warn(`Skipping ProjectRepository link due to missing Project ${link.projectId} or Repo ${link.repositoryName} (Group: ${link.groupUserName})`);
                    } else {
                        console.error(`Failed to create ProjectRepository link for Project ${link.projectId}: ${indivError}`);
                    }
                }
            }
            console.log(`Seeded ${linkCreateCount} ProjectRepository links individually.`)
         }
    } else {
        console.log('No unique ProjectRepository links generated to seed.');
    }


    // --- Seed Project Evaluators ---
    console.log('Seeding Project Evaluators...');
    const projectEvaluatorsData: Prisma.ProjectEvaluatorCreateManyInput[] = [];
    const projectEvaluatorTracker: Set<string> = new Set();

    if (evaluatorUsers.length > 0 && createdProjects.length > 0) {
        for (const project of createdProjects) {
            const numEvaluators = getRandomInt(1, 3);
            // Ensure evaluator is not the advisor for the *same* project
            const potentialEvaluators = evaluatorUsers.filter(e => e.userId !== project.advisorId);
            const evaluatorsToAssign = getRandomSubset(potentialEvaluators, numEvaluators);

            for (const evaluator of evaluatorsToAssign) {
                if (evaluator?.userId && project.id) {
                    const identifier = `${project.id}|${evaluator.userId}`;
                    if (!projectEvaluatorTracker.has(identifier)) {
                        projectEvaluatorsData.push({
                            projectId: project.id,
                            evaluatorId: evaluator.userId,
                        });
                        projectEvaluatorTracker.add(identifier);
                    }
                }
            }
        }
        console.log(`Generated ${projectEvaluatorsData.length} unique project evaluator entries.`);

        if (projectEvaluatorsData.length > 0) {
            try {
                const result = await prisma.projectEvaluator.createMany({
                    data: projectEvaluatorsData,
                    skipDuplicates: true // Handles composite key automatically
                });
                console.log(`${result.count} Project Evaluators seeded.`);
            } catch (e) {
                console.error('Error creating project evaluators:', e);
                 // Fallback
                let evaluatorCount = 0;
                for(const peData of projectEvaluatorsData){
                    try {
                       await prisma.projectEvaluator.create({data: peData});
                        evaluatorCount++;
                    } catch(indivError){
                        if (indivError instanceof Prisma.PrismaClientKnownRequestError && indivError.code === 'P2002') {
                            console.warn(`Skipping duplicate ProjectEvaluator: Project ${peData.projectId} / Evaluator ${peData.evaluatorId}`);
                        } else if (indivError instanceof Prisma.PrismaClientKnownRequestError && indivError.code === 'P2003'){
                             console.warn(`Skipping ProjectEvaluator due to missing Project ${peData.projectId} or User ${peData.evaluatorId}`);
                        } else {
                             console.error(`Failed to create ProjectEvaluator for Project ${peData.projectId}: ${indivError}`);
                        }
                    }
                }
                console.log(`Seeded ${evaluatorCount} Project Evaluators individually.`)
            }
        } else {
            console.log('No project evaluators generated to seed.');
        }
    } else {
        console.warn('No evaluator users or projects found to assign evaluators.');
    }

    // --- Seed Branches, Commits, FileChanges ---
    console.log('Seeding Version Control Data (Branches, Commits, FileChanges)...');
    const changeTypes = Object.values(ChangeType);
    let totalCommits = 0;
    let totalBranches = 0;
    let totalFileChanges = 0;

    for (const repo of createdRepositories) {
        // console.log(`  Seeding VC data for Repo: ${repo.name} (Group: ${repo.groupUserName})`);
        const repoBranches = [];
        const headCommitsMap = new Map<string, string>(); // Map branch name to head commit ID
        const initialCommitId = faker.git.commitSha();
        const initialAuthor = getRandomElement(createdUsers);

        if (!initialAuthor?.userId) {
            console.warn(`Skipping VC seeding for repo ${repo.name} (Group: ${repo.groupUserName}) - no users found to author initial commit.`);
            continue;
        }

        try {
            // 1. Create Initial Commit
            const initialCommit = await prisma.commit.create({
                data: {
                    id: initialCommitId,
                    message: `Initial commit for ${repo.name}`,
                    timestamp: faker.date.past({ years: 1 }),
                    repositoryName: repo.name,       // Use name
                    repositoryGroup: repo.groupUserName, // Use groupUserName
                    authorId: initialAuthor.userId,
                    parentCommitIDs: [], // No parents for initial commit
                    mergeRequestId: null, // Not a merge commit
                },
            });
            totalCommits++;

            // 2. Create 'main' Branch pointing to Initial Commit
            const mainBranchName = 'main';
            const mainBranch = await prisma.branch.create({
                data: {
                    // id is generated by cuid()
                    name: mainBranchName,
                    repositoryName: repo.name,       // Use name
                    repositoryGroup: repo.groupUserName, // Use groupUserName
                    headCommitId: initialCommit.id,  // Point to the commit
                },
            });
            totalBranches++;
            repoBranches.push(mainBranch);
            headCommitsMap.set(mainBranchName, initialCommit.id);

            // 3. Create Feature Branches (starting from main's initial commit)
            for (let b = 0; b < BRANCHES_PER_REPO - 1; b++) {
                const branchName = `${faker.word.verb()}/${faker.word.noun().replace(/ /g, '-')}-${b}`.substring(0, 50);
                const startCommitId = headCommitsMap.get(mainBranchName) ?? initialCommit.id; // Branch off main

                // Check for potential duplicate branch name within the repo
                 const existingBranch = await prisma.branch.findUnique({
                     where: { repositoryName_repositoryGroup_name: { repositoryName: repo.name, repositoryGroup: repo.groupUserName, name: branchName } }
                 });
                 if (existingBranch) {
                     console.warn(`Skipping branch creation: Branch '${branchName}' already exists in repo ${repo.name} (Group: ${repo.groupUserName}).`);
                     continue;
                 }

                const branch = await prisma.branch.create({
                    data: {
                        name: branchName,
                        repositoryName: repo.name,
                        repositoryGroup: repo.groupUserName,
                        headCommitId: startCommitId, // Starts pointing to the same commit as main initially
                    },
                });
                repoBranches.push(branch);
                headCommitsMap.set(branchName, startCommitId); // Track its head
                totalBranches++;
            }

             // 4. Create Commits and FileChanges on each branch
             for (const branch of repoBranches) {
                 let currentHeadId = headCommitsMap.get(branch.name)!; // Get current head from map
                 let parentIds = [currentHeadId]; // Start with the current head as parent

                 // Find the timestamp of the parent commit to ensure commits are sequential
                 let lastCommitTimestamp = (await prisma.commit.findUnique({ where: { id: currentHeadId }, select: { timestamp: true } }))?.timestamp ?? faker.date.past({years: 0.5});

                 for (let c = 0; c < COMMITS_PER_BRANCH; c++) {
                     const commitId = faker.git.commitSha();
                     const author = getRandomElement(createdUsers);
                     if (!author?.userId) continue; // Skip if no author found

                     // Ensure commit timestamp is after its parent(s)
                     lastCommitTimestamp = faker.date.soon({ days: 2, refDate: lastCommitTimestamp });

                     const newCommit = await prisma.commit.create({
                         data: {
                             id: commitId,
                             message: faker.git.commitMessage(),
                             timestamp: lastCommitTimestamp,
                             repositoryName: repo.name,
                             repositoryGroup: repo.groupUserName,
                             authorId: author.userId,
                             parentCommitIDs: parentIds, // Link to previous commit(s)
                             mergeRequestId: null,
                         },
                     });
                     totalCommits++;

                     // Create File Changes for this commit
                     const numChanges = getRandomInt(1, 5);
                     const fileChangesData: Prisma.FileChangeCreateManyInput[] = [];
                     for (let f = 0; f < numChanges; f++) {
                         const changeType = getRandomElement(changeTypes) ?? ChangeType.MODIFIED;
                         const filePath = `${faker.system.directoryPath()}/${faker.system.commonFileName()}`.substring(1); // Remove leading '/' if present
                         fileChangesData.push({
                             // id is generated by cuid()
                             filePath: filePath,
                             changeType: changeType,
                             fileContentHash: changeType !== ChangeType.DELETED ? faker.string.alphanumeric(40) : null,
                             previousFileContentHash: changeType !== ChangeType.ADDED ? faker.string.alphanumeric(40) : null,
                             commitId: newCommit.id, // Link to the commit
                         });
                     }
                     if (fileChangesData.length > 0) {
                         await prisma.fileChange.createMany({ data: fileChangesData });
                         totalFileChanges += fileChangesData.length;
                     }

                     // Update tracking for the next iteration
                     currentHeadId = newCommit.id; // The new commit is now the head
                     parentIds = [currentHeadId];   // The next commit will point to this one
                     headCommitsMap.set(branch.name, currentHeadId); // Update the map

                     // Update the branch's headCommitId in the database *after* the loop finishes
                 }
                 // After creating all commits for the branch, update the branch's head pointer
                  await prisma.branch.update({
                     where: { id: branch.id },
                     data: { headCommitId: currentHeadId }, // Point branch to the final commit created
                  });
             }
        } catch (error) {
            console.error(`Error seeding VC data for repo ${repo.name} (Group: ${repo.groupUserName}): ${error}`);
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'){
                 console.error("-> Unique constraint violation detail:", error.meta);
             }
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003'){
                 console.error("-> Foreign key constraint violation detail:", error.meta);
             }
        }
    }
    console.log(`VC Seeding complete: ${totalBranches} Branches, ${totalCommits} Commits, ${totalFileChanges} File Changes.`);


    // --- Seed Merge Requests ---
    console.log(`Seeding Merge Requests...`);
    // Fetch created branches with necessary details
    const allBranches = await prisma.branch.findMany({ select: { id: true, name: true, repositoryName: true, repositoryGroup: true, headCommitId: true } });
    const createdMergeRequests: (Prisma.MergeRequestGetPayload<{ include: { repository: true, sourceBranch: true, targetBranch: true, creator: true } }>)[] = [];
    const mrStatuses = Object.values(MergeRequestStatus);
    let createdMRCount = 0;
    let mergeCommitCreations = 0;

    for (const repo of createdRepositories) {
        const branchesInRepo = allBranches.filter(b => b.repositoryName === repo.name && b.repositoryGroup === repo.groupUserName);
        if (branchesInRepo.length < 2) {
            // console.warn(`Skipping MR creation for repo ${repo.name} (Group: ${repo.groupUserName}): Needs at least 2 branches.`);
            continue;
        }

        for (let i = 0; i < MR_PER_REPO; i++) {
            // Use const as these are not reassigned
            const sourceBranch = getRandomElement(branchesInRepo);
            const targetBranch = getRandomElement(branchesInRepo.filter(b => b.id !== sourceBranch?.id)); // Ensure different branches
            const creator = getRandomElement(createdUsers);

            // Retry if selection failed or branches are the same
            if (!sourceBranch || !targetBranch || !creator?.userId) {
                 console.warn(`Skipping MR creation attempt for repo ${repo.name} (Group: ${repo.groupUserName}): Could not select valid distinct source/target branches or creator.`);
                 continue;
            }

            const status = getRandomElement(mrStatuses) ?? MergeRequestStatus.OPEN;

            const mrData: Prisma.MergeRequestCreateInput = {
                // id generated by cuid()
                title: `MR-${i}: Merge ${sourceBranch.name} into ${targetBranch.name}`.substring(0, 80),
                description: faker.lorem.sentence(),
                status: status,
                // Connect using composite key for repository
                repository: { connect: { name_groupUserName: { name: repo.name, groupUserName: repo.groupUserName } } },
                creator: { connect: { userId: creator.userId } },
                sourceBranch: { connect: { id: sourceBranch.id } },
                targetBranch: { connect: { id: targetBranch.id } },
                // mergeCommitId is set later if status is MERGED
            };

            try {
                const createdMR = await prisma.mergeRequest.create({
                    data: mrData,
                    include: { repository: true, sourceBranch: true, targetBranch: true, creator: true }, // Include for potential merge commit
                });
                createdMergeRequests.push(createdMR);
                createdMRCount++;

                // If status is MERGED, create a merge commit
                if (status === MergeRequestStatus.MERGED) {
                    const mergeAuthor = getRandomElement(createdUsers) ?? creator; // Can be creator or someone else
                    // Fetch the head commits of source and target branches *at the time of MR creation*
                    const sourceHeadCommit = await prisma.commit.findUnique({ where: { id: createdMR.sourceBranch.headCommitId } });
                    const targetHeadCommit = await prisma.commit.findUnique({ where: { id: createdMR.targetBranch.headCommitId } });

                    if (sourceHeadCommit && targetHeadCommit && mergeAuthor?.userId) {
                        const mergeCommitId = faker.git.commitSha();
                        try {
                            // Create the merge commit
                            const mergeCommit = await prisma.commit.create({
                                data: {
                                    id: mergeCommitId,
                                    message: `Merge branch '${createdMR.sourceBranch.name}' into ${createdMR.targetBranch.name}\n\nCloses MR #${createdMR.id}`, // Reference MR id
                                    timestamp: faker.date.soon({ days: 1, refDate: createdMR.updatedAt }), // Timestamp after MR update
                                    repositoryName: repo.name,
                                    repositoryGroup: repo.groupUserName,
                                    authorId: mergeAuthor.userId,
                                    parentCommitIDs: [sourceHeadCommit.id, targetHeadCommit.id], // Two parents
                                    // Link the commit back to the MR using the foreign key field
                                    mergeRequestId: createdMR.id
                                },
                            });
                            totalCommits++;
                            mergeCommitCreations++;

                            // Update the target branch to point to the new merge commit
                            await prisma.branch.update({
                                where: { id: createdMR.targetBranch.id },
                                data: { headCommitId: mergeCommit.id },
                            });

                             // No need for the explicit commit update here anymore, as mergeRequestId was set during creation

                        } catch (commitError) {
                            console.error(`Failed to create merge commit for MR ${createdMR.id}: ${commitError}`);
                            // If merge commit fails, perhaps revert MR status?
                            await prisma.mergeRequest.update({ where: { id: createdMR.id }, data: { status: MergeRequestStatus.APPROVED } }); // Revert to approved maybe
                        }
                    } else {
                        console.warn(`Could not create merge commit for MR ${createdMR.id}: Missing source/target head commits or merge author.`);
                        // If data is missing, revert status
                        await prisma.mergeRequest.update({ where: { id: createdMR.id }, data: { status: MergeRequestStatus.APPROVED } }); // Revert to approved
                    }
                } // end if status === MERGED
            } catch (e) {
                 if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
                     console.warn(`Skipping MR creation for repo ${repo.name} due to missing related record (Repo, User, or Branch)`);
                     // console.warn(" -> Details:", mrData); // Log data for debugging if needed
                 } else {
                    console.error(`Failed to create MR for repo ${repo.name} (Group: ${repo.groupUserName}): ${e}`);
                 }
            }
        } // end loop MR_PER_REPO
    } // end loop createdRepositories
    console.log(`${createdMRCount} Merge Requests seeded. ${mergeCommitCreations} merge commits created.`);

    // --- Seed Merge Request Reviews ---
    console.log('Seeding Merge Request Reviews...');
    const mrReviewsData: Prisma.MergeRequestReviewCreateManyInput[] = [];
    const reviewDecisions = Object.values(ReviewDecision);
    const potentialReviewers = createdUsers; // Any user can review for simplicity

    for (const mr of createdMergeRequests) {
        // Don't add reviews to already merged/closed MRs usually, but maybe some for history
        if ((mr.status === MergeRequestStatus.MERGED || mr.status === MergeRequestStatus.CLOSED) && Math.random() > 0.2) {
            continue; // Only add reviews to a fraction of completed MRs
        }
        if (mr.status === MergeRequestStatus.REJECTED && Math.random() > 0.5) {
             continue; // Less likely to add more reviews after rejection
        }

        const numReviews = getRandomInt(0, REVIEWS_PER_MR);
        // Reviewers should not be the MR creator
        const reviewers = getRandomSubset(potentialReviewers.filter(u => u.userId !== mr.creatorId), numReviews);

        for (const reviewer of reviewers) {
            if (reviewer?.userId) {
                mrReviewsData.push({
                    // id generated by cuid()
                    decision: getRandomElement(reviewDecisions) ?? ReviewDecision.COMMENTED,
                    comment: faker.lorem.sentences(getRandomInt(1, 3)),
                    mergeRequestId: mr.id,
                    reviewerId: reviewer.userId,
                });
            }
        }
    }
    if (mrReviewsData.length > 0) {
        try {
            const result = await prisma.mergeRequestReview.createMany({ data: mrReviewsData });
            console.log(`${result.count} Merge Request Reviews seeded.`);
        } catch (e) {
             console.error(`Error seeding Merge Request Reviews: ${e}`);
        }
    } else {
        console.log('No Merge Request Reviews generated to seed.');
    }


    // --- Seed Tasks ---
    console.log('Seeding Tasks...');
    const tasksData: Prisma.TaskCreateManyInput[] = [];
    const taskStatuses = Object.values(TaskStatus);
    for (const project of createdProjects) {
        // Find members of the project's group + the advisor (if any) as potential creators/assignees
        const groupMembers = await prisma.groupMember.findMany({
            where: { groupUserName: project.groupUserName },
            select: { user: { select: { userId: true } } }, // Select only userId needed
        });
        const memberUsers = await prisma.user.findMany({
             where: { userId: { in: groupMembers.map(gm => gm.user.userId) } }
        });

        const potentialAssignees = [...memberUsers]; // Usually assigned to members
        const potentialCreators = [...memberUsers];
        if (project.advisorId) {
            const advisor = await prisma.user.findUnique({ where: { userId: project.advisorId } });
            if (advisor) {
                potentialCreators.push(advisor); // Advisor can also create tasks
                // potentialAssignees.push(advisor); // Advisor could potentially be assigned too
            }
        }

        if (potentialCreators.length === 0) {
            console.warn(`Skipping task creation for project ${project.title}: No potential creators found.`);
            continue;
        }

        for (let i = 0; i < TASKS_PER_PROJECT; i++) {
            const creator = getRandomElement(potentialCreators);
            // Assign task more often than not, usually to a group member
            const assignee = potentialAssignees.length > 0 && faker.datatype.boolean(0.8)
                                ? getRandomElement(potentialAssignees)
                                : null;

            if (!creator?.userId) continue; // Skip if creator selection failed

            tasksData.push({
                // id generated by cuid()
                title: `${faker.hacker.verb()} ${faker.hacker.noun()} - P:${project.id.substring(0, 4)}`.substring(0, 60),
                description: faker.lorem.paragraph(),
                status: getRandomElement(taskStatuses) ?? TaskStatus.TODO,
                deadline: faker.datatype.boolean(0.6) ? faker.date.future({ years: 0.5 }) : null,
                projectId: project.id,
                assigneeId: assignee?.userId ?? null,
                creatorId: creator.userId,
            });
        }
    }
    if (tasksData.length > 0) {
         try {
            const result = await prisma.task.createMany({ data: tasksData });
            console.log(`${result.count} Tasks seeded.`);
        } catch (e) {
             console.error(`Error seeding Tasks: ${e}`);
        }
    } else {
        console.log('No tasks generated to seed.');
    }


    // --- Seed Feedback ---
    console.log('Seeding Feedback...');
    const feedbackItemsData: Prisma.FeedbackCreateManyInput[] = [];
    const feedbackStatuses = Object.values(FeedbackStatus);

    for (let i = 0; i < FEEDBACK_ITEMS; i++) {
        const author = getRandomElement(createdUsers);
        if (!author?.userId) continue;

        // Determine the target: Project, MR, or Repository
        const feedbackType = getRandomInt(1, 3);
        let projectId: string | null = null;
        let mergeRequestId: string | null = null;
        let repositoryName: string | null = null;
        let repositoryGroup: string | null = null; // Requires groupUserName as well

        if (feedbackType === 1 && createdProjects.length > 0) {
            // Feedback on a Project
            projectId = getRandomElement(createdProjects)?.id ?? null;
        } else if (feedbackType === 2 && createdMergeRequests.length > 0) {
            // Feedback on a Merge Request
            const targetMR = getRandomElement(createdMergeRequests);
            mergeRequestId = targetMR?.id ?? null;
            // Implicitly link to repo via MR? Schema allows direct link too. Let's keep it simple.
        } else if (feedbackType === 3 && createdRepositories.length > 0) {
            // Feedback on a Repository
            const targetRepo = getRandomElement(createdRepositories);
            if (targetRepo) {
                repositoryName = targetRepo.name;
                repositoryGroup = targetRepo.groupUserName;
            }
        } else {
            // Fallback: Try linking to anything available
             if (createdProjects.length > 0) projectId = getRandomElement(createdProjects)?.id ?? null;
             else if (createdMergeRequests.length > 0) mergeRequestId = getRandomElement(createdMergeRequests)?.id ?? null;
             else if (createdRepositories.length > 0) {
                 const repo = getRandomElement(createdRepositories);
                 if (repo) {
                     repositoryName = repo.name;
                     repositoryGroup = repo.groupUserName;
                 }
             }
        }

        // Ensure at least one target is set
        if (!projectId && !mergeRequestId && !repositoryName) {
            // console.warn("Skipping feedback item: Could not find a target (Project, MR, or Repo).");
            continue;
        }
        // Ensure repo feedback has both name and group
        if (repositoryName && !repositoryGroup) {
             console.warn(`Skipping feedback item targeting repo ${repositoryName}: Missing groupUserName.`);
             continue;
        }

        feedbackItemsData.push({
            // id generated by cuid()
            title: faker.datatype.boolean(0.7) ? faker.lorem.sentence(5).substring(0, 50) : null,
            content: faker.lorem.paragraphs(getRandomInt(1, 4)),
            status: getRandomElement(feedbackStatuses) ?? FeedbackStatus.OPEN,
            authorId: author.userId,
            // Link to the determined target
            projectId,
            mergeRequestId,
            repositoryName,
            repositoryGroup,
        });
    }
    if (feedbackItemsData.length > 0) {
        try {
            const result = await prisma.feedback.createMany({ data: feedbackItemsData });
            console.log(`${result.count} Feedback items seeded.`);
        } catch (e) {
            console.error(`Error seeding Feedback: ${e}`);
             if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003'){
                 console.warn("-> Feedback seeding failed likely due to missing related record (User, Project, MR, or Repo). Check FKs.");
             }
        }
    } else {
        console.log('No feedback items generated to seed.');
    }

    // --- Seed Evaluations ---
    console.log('Seeding Evaluations...');
    const evaluationsData: Prisma.EvaluationCreateManyInput[] = [];
    // const evaluationTracker: Set<string> = new Set(); // Removed - allow multiple evals per author

    for (const project of createdProjects) {
        // Potential evaluators: Assigned evaluators + Project advisor
        const assignedEvaluators = await prisma.projectEvaluator.findMany({
            where: { projectId: project.id },
            include: { evaluator: { select: { userId: true } } }, // Select user ID
        });
        const potentialAuthors = [...assignedEvaluators.map(pe => pe.evaluator)]; // Start with assigned evaluators

        if (project.advisorId) {
            const advisor = await prisma.user.findUnique({ where: { userId: project.advisorId }, select: { userId: true } });
            if (advisor) {
                // Ensure advisor isn't already in the list from ProjectEvaluator (unlikely but possible)
                if (!potentialAuthors.some(pa => pa.userId === advisor.userId)) {
                     potentialAuthors.push(advisor);
                }
            }
        }

        if (potentialAuthors.length === 0) {
            // console.warn(`Skipping evaluations for project ${project.title}: No potential authors (assigned evaluators or advisor) found.`);
            continue;
        }

        const numEvals = getRandomInt(0, EVALUATIONS_PER_PROJECT); // Can have 0 evaluations now

        for (let i = 0; i < numEvals; i++) {
            const author = getRandomElement(potentialAuthors);
            if (!author?.userId) continue;

            // const identifier = `${project.id}|${author.userId}`; // Removed - allow multiple evals per author
            // if (evaluationTracker.has(identifier)) continue; // Skip if this author already evaluated this project

            evaluationsData.push({
                // id generated by cuid()
                score: faker.datatype.boolean(0.9) ? faker.number.float({ min: 40, max: 100, fractionDigits: 1 }) : null, // Use fractionDigits
                comments: faker.lorem.paragraphs(getRandomInt(2, 6)),
                // Example criteria JSON structure
                criteriaData: {
                    originality: faker.number.int({ min: 1, max: 10 }),
                    methodology: faker.number.int({ min: 1, max: 10 }),
                    presentation: faker.number.int({ min: 1, max: 10 }),
                    effort: faker.number.int({ min: 1, max: 10 }),
                    viability: faker.number.int({min: 1, max: 5}),
                    notes: faker.lorem.sentence(),
                },
                authorId: author.userId,
                projectId: project.id,
            });
            // evaluationTracker.add(identifier); // Add to tracker if enforcing one-per-author
        }
    }

    if (evaluationsData.length > 0) {
        try {
            const result = await prisma.evaluation.createMany({ data: evaluationsData });
            console.log(`${result.count} Evaluations seeded.`);
        } catch (e) {
            console.error(`Error seeding Evaluations: ${e}`);
        }
    } else {
        console.log('No evaluations generated to seed.');
    }

    // --- Seed Advisor Requests ---
    console.log('Seeding Advisor Requests...');
    const advisorRequestsData: Prisma.AdvisorRequestCreateManyInput[] = [];
    const requestStatuses = Object.values(AdvisorRequestStatus);
    const advisorRequestTracker: Set<string> = new Set(); // Track group-advisor-project requests

    if (createdGroups.length > 0 && advisorUsers.length > 0 && createdProjects.length > 0) {
        for (let i = 0; i < ADVISOR_REQUESTS; i++) {
            const group = getRandomElement(createdGroups);
            const requestedAdvisor = getRandomElement(advisorUsers);
            // Find a project associated with the group
            const project = getRandomElement(createdProjects.filter(p => p.groupUserName === group?.groupUserName));

            if (!group?.groupUserName || !requestedAdvisor?.userId || !project?.id) {
                 // console.warn("Skipping advisor request: Missing group, advisor, or valid project for the group.");
                 continue; // Need all three components
            }

            // Check if this advisor is already advising *this specific* project
            if (project.advisorId === requestedAdvisor.userId) {
                // console.warn(`Skipping advisor request: Advisor ${requestedAdvisor.userId} already advises project ${project.id}.`);
                continue;
            }

            // Use a composite identifier including the project
            const identifier = `${group.groupUserName}|${requestedAdvisor.userId}|${project.id}`;
            if (advisorRequestTracker.has(identifier)) {
                // console.warn(`Skipping duplicate advisor request for group ${group.groupUserName}, advisor ${requestedAdvisor.userId}, project ${project.id}`);
                continue;
            }

            advisorRequestsData.push({
                // id generated by cuid()
                status: getRandomElement(requestStatuses) ?? AdvisorRequestStatus.PENDING,
                requestMessage: faker.lorem.sentence(),
                responseMessage: faker.datatype.boolean(0.4) ? faker.lorem.sentence() : null,
                groupUserName: group.groupUserName,
                requestedAdvisorId: requestedAdvisor.userId,
                projectId: project.id, // Link to the specific project
            });
            advisorRequestTracker.add(identifier);
        }

        // Deduplication might be redundant due to tracker, but keep just in case
        const uniqueAdvisorRequestsData = Array.from(advisorRequestTracker).map((keyStr) => {
            const [groupUserName, requestedAdvisorId, projectId] = keyStr.split('|');
            return advisorRequestsData.find(ar => ar.groupUserName === groupUserName && ar.requestedAdvisorId === requestedAdvisorId && ar.projectId === projectId)!;
        }).filter(Boolean);

        if (uniqueAdvisorRequestsData.length > 0) {
            try {
                const result = await prisma.advisorRequest.createMany({ data: uniqueAdvisorRequestsData });
                console.log(`${result.count} Advisor Requests seeded.`);
            } catch (e) {
                console.error(`Error seeding Advisor Requests: ${e}`);
                 if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003'){
                     console.warn("-> Advisor Request seeding failed likely due to missing related Group, User, or Project.");
                 }
            }
        } else {
            console.log('No unique advisor requests generated to seed.');
        }
    } else {
        console.warn('Cannot seed Advisor Requests: Need Groups, Advisor Users, and Projects to exist.');
    }


    // --- Seed Group Invites ---
    console.log('Seeding Group Invites...');
    const groupInvitesData: Prisma.GroupInviteCreateManyInput[] = [];
    const inviteCodeTracker: Set<string> = new Set(); // Track generated codes

    if (createdGroups.length > 0 && createdUsers.length > 0) {
        for (let i = 0; i < GROUP_INVITES; i++) {
            const group = getRandomElement(createdGroups);
            // Invite creator could be leader, a member, or even an admin/advisor in some systems
            const members = await prisma.groupMember.findMany({ where: { groupUserName: group?.groupUserName }, select: { userId: true}});
            const potentialCreators = await prisma.user.findMany({ where: { userId: { in: [group?.leaderId ?? '', ...members.map(m => m.userId)] } } });
            if (potentialCreators.length === 0) potentialCreators.push(...createdUsers); // Fallback
            const creator = getRandomElement(potentialCreators);

            if (!group?.groupUserName || !creator?.userId) {
                 // console.warn("Skipping group invite: Missing group or creator.");
                 continue;
            }

            const code = `${faker.string.alphanumeric(12)}_${i}`;
             if(inviteCodeTracker.has(code)){
                 console.warn(`Skipping group invite due to duplicate code generation: ${code}`);
                 continue;
             }

            groupInvitesData.push({
                // id generated by cuid()
                code: code,
                expiresAt: faker.date.future({ years: 0.1 }),
                usedAt: faker.datatype.boolean(0.3) ? faker.date.past({ years: 0.05 }) : null,
                createdById: creator.userId,
                groupUserName: group.groupUserName,
                email: faker.datatype.boolean(0.4) ? faker.internet.email().toLowerCase() : null, // Optional targeted email
            });
             inviteCodeTracker.add(code);
        }
        if (groupInvitesData.length > 0) {
            try {
                // Use skipDuplicates because the `code` field has a @unique constraint
                const result = await prisma.groupInvite.createMany({ data: groupInvitesData, skipDuplicates: true });
                console.log(`${result.count} Group Invites seeded (duplicates skipped).`);
            } catch (e) {
                console.error(`Error seeding Group Invites: ${e}`);
                 // Fallback needed? skipDuplicates should handle P2002 for 'code'
                 if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003'){
                     console.warn("-> Group Invite seeding failed likely due to missing related Group or User.");
                 }
            }
        } else {
            console.log('No group invites generated to seed.');
        }
    } else {
        console.warn('Cannot seed Group Invites: No groups or users exist.');
    }

    // --- Seed Announcements ---
    console.log('Seeding Announcements...');
    const announcementsData: Prisma.AnnouncementCreateManyInput[] = [];
    if (adminUsers.length > 0) {
        for (let i = 0; i < ANNOUNCEMENTS; i++) {
            const creator = getRandomElement(adminUsers);
            if (!creator?.userId) continue;
            announcementsData.push({
                // id generated by cuid()
                title: faker.company.catchPhrase().substring(0, 70),
                content: faker.lorem.paragraphs(3),
                active: faker.datatype.boolean(0.8),
                priority: getRandomInt(0, 5),
                creatorId: creator.userId,
            });
        }
        if (announcementsData.length > 0) {
             try {
                const result = await prisma.announcement.createMany({ data: announcementsData });
                console.log(`${result.count} Announcements seeded.`);
            } catch (e) {
                console.error(`Error seeding Announcements: ${e}`);
            }
        } else {
            console.log('No announcements generated to seed.');
        }
    } else {
        console.warn('No admin users found to create announcements.');
    }

    // --- Seed Notifications ---
    console.log('Seeding Notifications...');
    const notificationsData: Prisma.NotificationCreateManyInput[] = [];
    if (createdUsers.length > 0) {
        for (const user of createdUsers) {
            if (!user?.userId) continue;
            for (let i = 0; i < NOTIFICATIONS_PER_USER; i++) {
                notificationsData.push({
                    // id generated by cuid()
                    message: faker.lorem.sentence(10),
                    read: faker.datatype.boolean(0.3),
                    link: faker.datatype.boolean(0.5) ? `/some/path/${faker.string.alphanumeric(8)}` : null, // Example internal link
                    recipientId: user.userId,
                });
            }
        }
        if (notificationsData.length > 0) {
            const batchSize = 1000; // Insert in batches for performance
            let createdNotificationCount = 0;
            console.log(`Attempting to seed ${notificationsData.length} notifications...`);
            for (let i = 0; i < notificationsData.length; i += batchSize) {
                const batch = notificationsData.slice(i, i + batchSize);
                try {
                    const result = await prisma.notification.createMany({ data: batch });
                    createdNotificationCount += result.count;
                } catch (e) {
                     console.error(`Error seeding Notification batch (starting index ${i}): ${e}`);
                      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003'){
                         console.warn("-> Notification seeding failed likely due to missing recipient User.");
                         // Optionally try individual inserts for the failing batch here
                     }
                }
            }
            console.log(`${createdNotificationCount} Notifications seeded.`);
        } else {
            console.log('No notifications generated to seed.');
        }
    } else {
        console.warn('No users found to send notifications to.');
    }

    // --- Seed Remotes ---
    console.log('Seeding Remotes...');
    const remotesData: Prisma.RemoteCreateManyInput[] = [];
    const remoteTracker: Set<string> = new Set(); // Track repo-group-name combinations

    for (const repo of createdRepositories) {
        if (faker.datatype.boolean(0.7)) { // Add 'origin' more often
            const remoteName = 'origin';
            const identifier = `${repo.name}|${repo.groupUserName}|${remoteName}`;
            if (!remoteTracker.has(identifier)) {
                remotesData.push({
                    // id generated by cuid()
                    name: remoteName,
                    url: `${faker.internet.url()}/${repo.groupUserName}/${repo.name}.git`,
                    repositoryName: repo.name,       // Link using name
                    repositoryGroup: repo.groupUserName, // Link using groupUserName
                });
                remoteTracker.add(identifier);
            }
        }
        if (faker.datatype.boolean(0.3)) { // Add 'upstream' less often
             const remoteName = 'upstream';
             const identifier = `${repo.name}|${repo.groupUserName}|${remoteName}`;
             if (!remoteTracker.has(identifier)) {
                remotesData.push({
                    name: remoteName,
                    url: `${faker.internet.url()}/upstream/${repo.name}.git`,
                    repositoryName: repo.name,
                    repositoryGroup: repo.groupUserName,
                });
                remoteTracker.add(identifier);
            }
        }
         // Add other random remotes occasionally
         if (faker.datatype.boolean(0.1)) {
             const remoteName = faker.word.verb();
             const identifier = `${repo.name}|${repo.groupUserName}|${remoteName}`;
             if (!remoteTracker.has(identifier)) {
                 remotesData.push({
                     name: remoteName,
                     url: `${faker.internet.url()}/${faker.internet.userName()}/${repo.name}-fork.git`,
                     repositoryName: repo.name,
                     repositoryGroup: repo.groupUserName,
                 });
                 remoteTracker.add(identifier);
             }
         }
    }

    if (remotesData.length > 0) {
        try {
            // Use skipDuplicates for the @@unique([repositoryName, repositoryGroup, name]) constraint
            const result = await prisma.remote.createMany({ data: remotesData, skipDuplicates: true });
            console.log(`${result.count} Remotes seeded (duplicates skipped).`);
        } catch (e) {
            console.error(`Error seeding Remotes: ${e}`);
             if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003'){
                 console.warn("-> Remote seeding failed likely due to missing related Repository.");
             }
        }
    } else {
        console.log('No remotes generated to seed.');
    }


    console.log('Seeding finished successfully!');
}

// --- Execute Seeding ---
main()
    .catch((e) => {
        console.error('\n--- Fatal Error during Seeding ---');
        console.error(e);
         if (e instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`Prisma Error Code: ${e.code}`);
            console.error(`Prisma Meta: ${JSON.stringify(e.meta)}`);
        }
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log('Prisma client disconnected.');
    });