import { PrismaClient, Role, ProjectStatus, AdvisorRequestStatus, MergeRequestStatus, ReviewDecision, ChangeType, TaskStatus, FeedbackStatus, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- Configuration ---
const NUM_USERS = 20;
const NUM_GROUPS = 5;
const NUM_PROJECTS_PER_GROUP_RANGE = [3, 5];
const NUM_REPOS_PER_GROUP_RANGE = [5, 7];
const NUM_USER_REPOS = 3;
const COMMITS_PER_BRANCH = 5;
const BRANCHES_PER_REPO = 5;
const MAX_MEMBERS_PER_GROUP = 8;
const TASKS_PER_PROJECT = 15;
const FEEDBACK_ITEMS = 30;
const EVALUATIONS_PER_PROJECT = 5;
const MR_PER_REPO = 10;
const REVIEWS_PER_MR = 4;
const NOTIFICATIONS_PER_USER = 10;
const ANNOUNCEMENTS = 10;
const GROUP_INVITES = 60;
const ADVISOR_REQUESTS = 40;

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

    // --- Clear Existing Data ---
    console.log('Clearing existing data...');
    await prisma.notification.deleteMany();
    await prisma.groupInvite.deleteMany();
    await prisma.advisorRequest.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.task.deleteMany();
    await prisma.mergeRequestReview.deleteMany();
    await prisma.fileChange.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.commit.deleteMany();
    await prisma.remote.deleteMany();
    await prisma.projectRepository.deleteMany();
    await prisma.repository.deleteMany();
    await prisma.projectEvaluator.deleteMany();
    await prisma.project.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.rule.deleteMany();
    await prisma.user.deleteMany();
    console.log('Existing data cleared.');

    // --- Seed Rule (Singleton) ---
    console.log('Seeding Rule...');
    await prisma.rule.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            maxGroupSize: MAX_MEMBERS_PER_GROUP,
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
        const uniqueSuffix = faker.string.alphanumeric(4);
        const userId = `${faker.internet.username({ firstName, lastName }).toLowerCase().substring(0, 15)}_${uniqueSuffix}_${i}`;
        const email = `${faker.internet.email({ firstName, lastName, provider: 'test.edu' }).toLowerCase().substring(0, 20)}_${uniqueSuffix}_${i}`;

        usersData.push({
            userId,
            firstName,
            lastName,
            email,
            passwordHash,
            role: getRandomElement(roles) ?? Role.STUDENT,
            profileInfo: {
                department: faker.commerce.department(),
                bio: faker.lorem.sentence(),
                expertise: Math.random() > 0.5 ? [faker.hacker.ingverb(), faker.hacker.adjective()] : undefined,
            },
            passwordResetToken: faker.datatype.boolean(0.05) ? faker.string.uuid() : null,
            passwordResetExpires: faker.datatype.boolean(0.05) ? faker.date.future() : null,
        });
    }
    try {
        await prisma.user.createMany({ data: usersData, skipDuplicates: true });
    } catch (e) {
        console.error("Error creating users:", e);
        console.log("Attempting user creation one by one...");
        let userCreateCount = 0;
        for (const userData of usersData) {
            try {
                await prisma.user.create({ data: userData });
                userCreateCount++;
            } catch (error) {
                console.warn(`Could not create user ${userData.userId}: ${error}`);
            }
        }
        console.log(`Created ${userCreateCount} users individually.`);
    }

    const createdUsers = await prisma.user.findMany();
    const studentUsers = createdUsers.filter(u => u.role === Role.STUDENT);
    const advisorUsers = createdUsers.filter(u => u.role === Role.ADVISOR);
    const evaluatorUsers = createdUsers.filter(u => u.role === Role.EVALUATOR);
    const adminUsers = createdUsers.filter(u => u.role === Role.ADMINISTRATOR);
    console.log(`${createdUsers.length} Users seeded.`);

    // Filter out undefined values from userIds
    const userIds = createdUsers.map(u => u.userId).filter(Boolean); // Ensure no undefined values

    // Use userIds in relevant logic (e.g., logging or further processing)
    console.log(`Generated User IDs: ${userIds.length}`);

    // --- Seed Groups ---
    console.log(`Seeding ${NUM_GROUPS} Groups...`);
    const groupsData: Prisma.GroupCreateManyInput[] = [];
    if (studentUsers.length === 0) {
        console.warn("No student users found to lead groups. Skipping group creation.");
    } else {
        for (let i = 0; i < NUM_GROUPS; i++) {
            const leader = getRandomElement(studentUsers);
            if (leader) {
                const uniqueSuffix = faker.string.alphanumeric(4);
                groupsData.push({
                    groupUserName: `group_${uniqueSuffix}_${i}`,
                    name: faker.company.name().substring(0, 20) + ` Group ${uniqueSuffix} ${i}`,
                    description: faker.lorem.paragraph(),
                    leaderId: leader.userId,
                });
            }
        }
        try {
            await prisma.group.createMany({ data: groupsData, skipDuplicates: true });
        } catch (e) {
            console.error("Error creating groups:", e);
            console.log("Attempting group creation one by one...");
            let groupCreateCount = 0;
            for (const groupData of groupsData) {
                try {
                    await prisma.group.create({ data: groupData });
                    groupCreateCount++;
                } catch (error) {
                    console.warn(`Could not create group ${groupData.name}: ${error}`);
                }
            }
            console.log(`Created ${groupCreateCount} groups individually.`);
        }
    }
    const createdGroups = await prisma.group.findMany();
    console.log(`${createdGroups.length} Groups seeded.`);

    // --- Seed Group Members ---
    console.log('Seeding Group Members...');
    const groupMembersData: Prisma.GroupMemberCreateManyInput[] = [];
    if (studentUsers.length > 0 && createdGroups.length > 0) {
        for (const group of createdGroups) {
            // Add the group leader as a member
            if (group.leaderId) {
                groupMembersData.push({ groupId: group.id, userId: group.leaderId });
            }
            const memberCount = getRandomInt(1, MAX_MEMBERS_PER_GROUP - 1);
            const potentialMembers = studentUsers.filter(u => u.userId !== group.leaderId);
            const membersToAdd = getRandomSubset(potentialMembers, memberCount);
            for (const member of membersToAdd) {
                if (member.userId) {
                    groupMembersData.push({ groupId: group.id, userId: member.userId });
                }
            }
        }
        console.log(`Generated ${groupMembersData.length} group member entries.`);

        // Deduplicate and ensure no undefined entries
        const uniqueGroupMembers = Array.from(new Set(groupMembersData.map(gm => `${gm.groupId}-${gm.userId}`)))
            .map(idPair => {
                const [groupId, userId] = idPair.split('-');
                return groupMembersData.find(gm => gm.groupId === groupId && gm.userId === userId);
            })
            .filter((gm): gm is Prisma.GroupMemberCreateManyInput => gm !== undefined && gm.groupId !== undefined && gm.userId !== undefined);

        console.log(`After deduplication, ${uniqueGroupMembers.length} unique group member entries.`);

        if (uniqueGroupMembers.length > 0) {
            try {
                await prisma.groupMember.createMany({ 
                    data: uniqueGroupMembers, 
                    skipDuplicates: true 
                });
                console.log(`${uniqueGroupMembers.length} Group Memberships seeded.`);
            } catch (e) {
                console.error('Error creating group members:', e);
            }
        } else {
            console.log('No group members seeded.');
        }
    } else {
        console.warn("No student users or groups found to create memberships.");
    }

    // --- Seed Repositories ---
    console.log(`Seeding Repositories...`);
    const repositoriesData: Prisma.RepositoryCreateInput[] = [];
    const repoOwners = [...createdUsers];
    for (const group of createdGroups) {
        const numRepos = getRandomInt(NUM_REPOS_PER_GROUP_RANGE[0], NUM_REPOS_PER_GROUP_RANGE[1]);
        const owner = getRandomElement(repoOwners);
        if (!owner) continue;
        for (let i = 0; i < numRepos; i++) {
            repositoriesData.push({
                name: `${faker.word.noun()}-${faker.word.adjective()}-${i}`,
                description: faker.lorem.sentence(),
                owner: { connect: { userId: owner.userId } },
                group: { connect: { id: group.id } },
                isPrivate: faker.datatype.boolean(0.9),
            });
        }
    }
    for (let i = 0; i < NUM_USER_REPOS; i++) {
        const owner = getRandomElement(repoOwners);
        if (!owner) continue;
        repositoriesData.push({
            name: `${faker.word.verb()}-${faker.word.noun()}-${i}`,
            description: faker.lorem.sentence(),
            owner: { connect: { userId: owner.userId } },
            isPrivate: faker.datatype.boolean(0.7),
        });
    }
    let createdRepoCount = 0;
    for (const repoData of repositoriesData) {
        try {
            await prisma.repository.create({ data: repoData });
            createdRepoCount++;
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                console.warn(`Skipping duplicate repository: Name '${repoData.name}' likely exists for owner/group.`);
            } else {
                console.error(`Failed to create repository '${repoData.name}': ${e}`);
            }
        }
    }
    console.log(`${createdRepoCount} Repositories seeded.`);

    const createdRepositories = await prisma.repository.findMany();

    // --- Seed Projects ---
    console.log('Seeding Projects...');
    const projectsData: Prisma.ProjectCreateManyInput[] = [];
    const projectStatuses = Object.values(ProjectStatus);
    for (const group of createdGroups) {
        const numProjects = getRandomInt(NUM_PROJECTS_PER_GROUP_RANGE[0], NUM_PROJECTS_PER_GROUP_RANGE[1]);
        for (let i = 0; i < numProjects; i++) {
            const advisor = getRandomElement(advisorUsers);
            projectsData.push({
                title: faker.commerce.productName().substring(0, 30) + ` Project ${group.id.substring(0,4)}-${i}`,
                description: faker.lorem.paragraphs(2),
                status: getRandomElement(projectStatuses) ?? ProjectStatus.ACTIVE,
                isPrivate: faker.datatype.boolean(0.5),
                submissionDate: Math.random() > 0.7 ? faker.date.past() : null,
                archived: Math.random() > 0.9,
                groupId: group.id,
                advisorId: advisor?.userId ?? null,
            });
        }
    }
    if (projectsData.length > 0) {
        await prisma.project.createMany({ data: projectsData });
        console.log(`${projectsData.length} Projects seeded.`);
    } else {
        console.log('No projects seeded.');
    }
    const createdProjects = await prisma.project.findMany();

    // --- Seed ProjectRepository ---
    console.log('Seeding ProjectRepository links...');
    const projectRepoLinksData: Prisma.ProjectRepositoryCreateManyInput[] = [];
    for (const project of createdProjects) {
        const groupRepos = createdRepositories.filter(repo => repo.groupId === project.groupId);
        if (groupRepos.length > 0) {
            const repoToLink = getRandomElement(groupRepos);
            if (repoToLink) {
                projectRepoLinksData.push({
                    projectId: project.id,
                    repositoryId: repoToLink.id,
                    groupId: project.groupId,
                });
            }
        }
    }
    const uniqueProjectRepoLinks = Array.from(new Set(projectRepoLinksData.map(link => `${link.projectId}-${link.repositoryId}`)))
        .map(idPair => {
            const [projectId, repositoryId] = idPair.split('-');
            return projectRepoLinksData.find(l => l.projectId === projectId && l.repositoryId === repositoryId)!;
        });
    if (uniqueProjectRepoLinks.length > 0) {
        await prisma.projectRepository.createMany({ data: uniqueProjectRepoLinks, skipDuplicates: true });
        console.log(`${uniqueProjectRepoLinks.length} ProjectRepository links seeded.`);
    } else {
        console.log('No ProjectRepository links seeded.');
    }

    // --- Seed Project Evaluators ---
    console.log('Seeding Project Evaluators...');
    const projectEvaluatorsData: Prisma.ProjectEvaluatorCreateManyInput[] = [];
    if (evaluatorUsers.length > 0) {
        for (const project of createdProjects) {
            const numEvaluators = getRandomInt(1, 3);
            const evaluatorsToAssign = getRandomSubset(evaluatorUsers, numEvaluators);
            const validEvaluators = evaluatorsToAssign.filter(e => e.userId !== project.advisorId && e.userId);
            for (const evaluator of validEvaluators) {
                if (evaluator?.userId && project.id) {
                    projectEvaluatorsData.push({
                        projectId: project.id,
                        evaluatorId: evaluator.userId,
                    });
                }
            }
        }
        console.log(`Generated ${projectEvaluatorsData.length} project evaluator entries.`);

        // Log sample of projectEvaluatorsData for debugging
        console.log('Project evaluators data sample:', projectEvaluatorsData.slice(0, 5));

        // Deduplicate and ensure no undefined entries
        const uniqueProjectEvaluators = Array.from(
            new Set(projectEvaluatorsData.map(pe => `${pe.projectId}-${pe.evaluatorId}`))
        )
            .map(idPair => {
                const [projectId, evaluatorId] = idPair.split('-');
                const entry = projectEvaluatorsData.find(pe => pe.projectId === projectId && pe.evaluatorId === evaluatorId);
                if (!entry) {
                    console.warn(`No entry found for projectId: ${projectId}, evaluatorId: ${evaluatorId}`);
                }
                return entry;
            })
            .filter((pe): pe is Prisma.ProjectEvaluatorCreateManyInput => 
                pe !== undefined && pe.projectId !== undefined && pe.evaluatorId !== undefined
            );

        console.log(`After deduplication, ${uniqueProjectEvaluators.length} unique project evaluator entries.`);

        // Log sample of uniqueProjectEvaluators for debugging
        console.log('Unique project evaluators sample:', uniqueProjectEvaluators.slice(0, 5));

        if (uniqueProjectEvaluators.length > 0) {
            try {
                await prisma.projectEvaluator.createMany({ 
                    data: uniqueProjectEvaluators, 
                    skipDuplicates: true 
                });
                console.log(`${uniqueProjectEvaluators.length} Project Evaluators seeded.`);
            } catch (e) {
                console.error('Error creating project evaluators:', e);
                console.log('Project evaluators data sample:', uniqueProjectEvaluators.slice(0, 5));
            }
        } else {
            console.log('No project evaluators seeded.');
        }
    } else {
        console.warn('No evaluator users found to assign to projects.');
    }

    // --- Seed Branches, Commits, FileChanges ---
    console.log('Seeding Branches, Commits, FileChanges...');
    const changeTypes = Object.values(ChangeType);
    let totalCommits = 0;
    let totalBranches = 0;
    let totalFileChanges = 0;

    for (const repo of createdRepositories) {
        console.log(`  Seeding VC data for Repo: ${repo.name} (ID: ${repo.id})`);
        const repoBranches = [];
        const headCommitsMap = new Map<string, string>();
        const initialCommitId = faker.git.commitSha();
        const initialAuthor = getRandomElement(createdUsers);
        if (!initialAuthor) {
            console.warn(`Skipping repo ${repo.id} - no users found`);
            continue;
        }

        try {
            const initialCommit = await prisma.commit.create({
                data: {
                    id: initialCommitId,
                    message: `Initial commit for ${repo.name}`,
                    timestamp: faker.date.past({ years: 1 }),
                    repositoryId: repo.id,
                    authorId: initialAuthor.userId,
                    parentCommitIDs: [],
                    mergeRequestId: null,
                },
            });
            totalCommits++;

            const mainBranchName = 'main';
            const mainBranch = await prisma.branch.create({
                data: {
                    name: mainBranchName,
                    repositoryId: repo.id,
                    headCommitId: initialCommit.id,
                },
            });
            totalBranches++;
            repoBranches.push(mainBranch);
            headCommitsMap.set(mainBranchName, initialCommit.id);

            for (let b = 0; b < BRANCHES_PER_REPO - 1; b++) {
                const branchName = `${faker.word.verb()}/${faker.word.noun()}-${b}`;
                const startCommitId = headCommitsMap.get(mainBranchName) ?? initialCommit.id;
                const branch = await prisma.branch.create({
                    data: {
                        name: branchName,
                        repositoryId: repo.id,
                        headCommitId: startCommitId,
                    },
                });
                repoBranches.push(branch);
                headCommitsMap.set(branchName, startCommitId);
                totalBranches++;
            }

            for (const branch of repoBranches) {
                let currentHeadId = headCommitsMap.get(branch.name)!;
                let parentIds = [currentHeadId];
                let lastCommitTimestamp = (await prisma.commit.findUnique({ where: { id: currentHeadId } }))?.timestamp ?? new Date();

                for (let c = 0; c < COMMITS_PER_BRANCH; c++) {
                    const commitId = faker.git.commitSha();
                    const author = getRandomElement(createdUsers);
                    if (!author) continue;

                    lastCommitTimestamp = faker.date.soon({ days: 2, refDate: lastCommitTimestamp });

                    const newCommit = await prisma.commit.create({
                        data: {
                            id: commitId,
                            message: faker.git.commitMessage(),
                            timestamp: lastCommitTimestamp,
                            repositoryId: repo.id,
                            authorId: author.userId,
                            parentCommitIDs: parentIds,
                            mergeRequestId: null,
                        },
                    });
                    totalCommits++;

                    const numChanges = getRandomInt(1, 5);
                    const fileChangesData: Prisma.FileChangeCreateManyInput[] = [];
                    for (let f = 0; f < numChanges; f++) {
                        const changeType = getRandomElement(changeTypes) ?? ChangeType.MODIFIED;
                        fileChangesData.push({
                            filePath: `${faker.system.directoryPath()}/${faker.system.commonFileName()}`,
                            changeType: changeType,
                            fileContentHash: changeType !== ChangeType.DELETED ? faker.string.alphanumeric(40) : null,
                            previousFileContentHash: changeType !== ChangeType.ADDED ? faker.string.alphanumeric(40) : null,
                            commitId: newCommit.id,
                        });
                    }
                    if (fileChangesData.length > 0) {
                        await prisma.fileChange.createMany({ data: fileChangesData });
                        totalFileChanges += fileChangesData.length;
                    }

                    currentHeadId = newCommit.id;
                    parentIds = [currentHeadId];
                    headCommitsMap.set(branch.name, currentHeadId);

                    if (c === COMMITS_PER_BRANCH - 1) {
                        await prisma.branch.update({
                            where: { id: branch.id },
                            data: { headCommitId: currentHeadId },
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error seeding VC data for repo ${repo.id}: ${error}`);
        }
    }
    console.log(`VC Seeding complete: ${totalBranches} Branches, ${totalCommits} Commits, ${totalFileChanges} File Changes.`);

    // --- Seed Merge Requests ---
    console.log(`Seeding Merge Requests...`);
    const createdMergeRequests: (Prisma.MergeRequestGetPayload<{ include: { repository: true, sourceBranch: true, targetBranch: true } }>)[] = [];
    const mrStatuses = Object.values(MergeRequestStatus);
    let createdMRCount = 0;
    let mergeCommitCreations = 0;

    for (const repo of createdRepositories) {
        const branchesInRepo = await prisma.branch.findMany({ where: { repositoryId: repo.id } });
        if (branchesInRepo.length < 2) continue;

        for (let i = 0; i < MR_PER_REPO; i++) {
            let sourceBranch = getRandomElement(branchesInRepo);
            let targetBranch = getRandomElement(branchesInRepo);
            const creator = getRandomElement(createdUsers);

            if (!sourceBranch || !targetBranch || sourceBranch.id === targetBranch.id || !creator) {
                sourceBranch = getRandomElement(branchesInRepo.filter(b => b.id !== targetBranch?.id));
                targetBranch = getRandomElement(branchesInRepo.filter(b => b.id !== sourceBranch?.id));
                if (!sourceBranch || !targetBranch || sourceBranch.id === targetBranch.id || !creator) {
                    console.warn(`Skipping MR creation for repo ${repo.id}: Could not find valid distinct source/target branches or creator.`);
                    continue;
                }
            }

            const status = getRandomElement(mrStatuses) ?? MergeRequestStatus.OPEN;

            const mrData: Prisma.MergeRequestCreateInput = {
                title: `MR-${i}: Merge ${sourceBranch.name} into ${targetBranch.name}`,
                description: faker.lorem.sentence(),
                status: status,
                repository: { connect: { id: repo.id } },
                creator: { connect: { userId: creator.userId } },
                sourceBranch: { connect: { id: sourceBranch.id } },
                targetBranch: { connect: { id: targetBranch.id } },
            };

            try {
                const createdMR = await prisma.mergeRequest.create({
                    data: mrData,
                    include: { repository: true, sourceBranch: true, targetBranch: true },
                });
                createdMergeRequests.push(createdMR);
                createdMRCount++;

                if (status === MergeRequestStatus.MERGED) {
                    const mergeAuthor = getRandomElement(createdUsers) ?? creator;
                    const sourceHead = await prisma.commit.findUnique({ where: { id: createdMR.sourceBranch.headCommitId } });
                    const targetHead = await prisma.commit.findUnique({ where: { id: createdMR.targetBranch.headCommitId } });

                    if (sourceHead && targetHead && mergeAuthor) {
                        const mergeCommitId = faker.git.commitSha();
                        try {
                            const mergeCommit = await prisma.commit.create({
                                data: {
                                    id: mergeCommitId,
                                    message: `Merge branch '${createdMR.sourceBranch.name}' into ${createdMR.targetBranch.name}\n\nCloses MR ${createdMR.id}`,
                                    timestamp: faker.date.soon({ days: 1, refDate: createdMR.updatedAt }),
                                    repositoryId: repo.id,
                                    authorId: mergeAuthor.userId,
                                    parentCommitIDs: [sourceHead.id, targetHead.id],
                                    mergeRequestId: createdMR.id,
                                },
                            });
                            await prisma.branch.update({
                                where: { id: createdMR.targetBranch.id },
                                data: { headCommitId: mergeCommit.id },
                            });
                            totalCommits++;
                            mergeCommitCreations++;
                        } catch (commitError) {
                            console.error(`Failed to create merge commit for MR ${createdMR.id}: ${commitError}`);
                            await prisma.mergeRequest.update({ where: { id: createdMR.id }, data: { status: MergeRequestStatus.APPROVED } });
                        }
                    } else {
                        console.warn(`Could not create merge commit for MR ${createdMR.id}: Missing source/target head commits or author.`);
                        await prisma.mergeRequest.update({ where: { id: createdMR.id }, data: { status: MergeRequestStatus.APPROVED } });
                    }
                }
            } catch (e) {
                console.error(`Failed to create MR for repo ${repo.id}: ${e}`);
            }
        }
    }
    console.log(`${createdMRCount} Merge Requests seeded. ${mergeCommitCreations} merge commits created.`);

    // --- Seed Merge Request Reviews ---
    console.log('Seeding Merge Request Reviews...');
    const mrReviewsData: Prisma.MergeRequestReviewCreateManyInput[] = [];
    const reviewDecisions = Object.values(ReviewDecision);
    const potentialReviewers = createdUsers;

    for (const mr of createdMergeRequests) {
        if (mr.status === MergeRequestStatus.MERGED || mr.status === MergeRequestStatus.CLOSED) {
            if (Math.random() < 0.7) continue;
        }

        const numReviews = getRandomInt(0, REVIEWS_PER_MR);
        const reviewers = getRandomSubset(potentialReviewers.filter(u => u.userId !== mr.creatorId), numReviews);

        for (const reviewer of reviewers) {
            mrReviewsData.push({
                decision: getRandomElement(reviewDecisions) ?? ReviewDecision.COMMENTED,
                comment: faker.lorem.sentences(getRandomInt(1, 3)),
                mergeRequestId: mr.id,
                reviewerId: reviewer.userId,
            });
        }
    }
    if (mrReviewsData.length > 0) {
        await prisma.mergeRequestReview.createMany({ data: mrReviewsData });
        console.log(`${mrReviewsData.length} Merge Request Reviews seeded.`);
    } else {
        console.log('No Merge Request Reviews seeded.');
    }

    // --- Seed Tasks ---
    console.log('Seeding Tasks...');
    const tasksData: Prisma.TaskCreateManyInput[] = [];
    const taskStatuses = Object.values(TaskStatus);
    for (const project of createdProjects) {
        const groupMembers = await prisma.groupMember.findMany({
            where: { groupId: project.groupId },
            include: { user: true },
        });
        const potentialAssignees = groupMembers.map(gm => gm.user);
        const projectAdvisor = project.advisorId ? await prisma.user.findUnique({ where: { userId: project.advisorId } }) : null;
        const potentialCreators = [...potentialAssignees];
        if (projectAdvisor) potentialCreators.push(projectAdvisor);

        if (potentialCreators.length === 0) continue;

        for (let i = 0; i < TASKS_PER_PROJECT; i++) {
            const creator = getRandomElement(potentialCreators);
            const assignee = potentialAssignees.length > 0 && Math.random() > 0.2 ? getRandomElement(potentialAssignees) : null;
            if (!creator) continue;

            tasksData.push({
                title: faker.hacker.verb() + " " + faker.hacker.noun() + ` P:${project.id.substring(0,4)}`,
                description: faker.lorem.paragraph(),
                status: getRandomElement(taskStatuses) ?? TaskStatus.TODO,
                deadline: Math.random() > 0.5 ? faker.date.future({ years: 0.5 }) : null,
                projectId: project.id,
                assigneeId: assignee?.userId ?? null,
                creatorId: creator.userId,
            });
        }
    }
    if (tasksData.length > 0) {
        await prisma.task.createMany({ data: tasksData });
        console.log(`${tasksData.length} Tasks seeded.`);
    } else {
        console.log('No tasks seeded.');
    }

    // --- Seed Feedback ---
    console.log('Seeding Feedback...');
    const feedbackItemsData: Prisma.FeedbackCreateManyInput[] = [];
    const feedbackStatuses = Object.values(FeedbackStatus);
    for (let i = 0; i < FEEDBACK_ITEMS; i++) {
        const author = getRandomElement(createdUsers);
        if (!author) continue;

        const feedbackType = getRandomInt(1, 3);
        let projectId: string | null = null;
        let mergeRequestId: string | null = null;
        let repositoryId: string | null = null;

        if (feedbackType === 1 && createdProjects.length > 0) {
            projectId = getRandomElement(createdProjects)?.id ?? null;
        } else if (feedbackType === 2 && createdMergeRequests.length > 0) {
            mergeRequestId = getRandomElement(createdMergeRequests)?.id ?? null;
        } else if (feedbackType === 3 && createdRepositories.length > 0) {
            repositoryId = getRandomElement(createdRepositories)?.id ?? null;
        } else {
            projectId = getRandomElement(createdProjects)?.id ?? null;
            if (!projectId && createdRepositories.length > 0) {
                repositoryId = getRandomElement(createdRepositories)?.id ?? null;
            }
            if (!projectId && !repositoryId && createdMergeRequests.length > 0) {
                mergeRequestId = getRandomElement(createdMergeRequests)?.id ?? null;
            }
        }

        if (!projectId && !mergeRequestId && !repositoryId) {
            console.warn("Skipping feedback item: No target found.");
            continue;
        }

        feedbackItemsData.push({
            title: Math.random() > 0.6 ? faker.lorem.sentence(5) : null,
            content: faker.lorem.paragraphs(getRandomInt(1, 4)),
            status: getRandomElement(feedbackStatuses) ?? FeedbackStatus.OPEN,
            authorId: author.userId,
            projectId,
            mergeRequestId,
            repositoryId,
        });
    }
    if (feedbackItemsData.length > 0) {
        await prisma.feedback.createMany({ data: feedbackItemsData });
        console.log(`${feedbackItemsData.length} Feedback items seeded.`);
    } else {
        console.log('No feedback items seeded.');
    }

    // --- Seed Evaluations ---
    console.log('Seeding Evaluations...');
    const evaluationsData: Prisma.EvaluationCreateManyInput[] = [];
    for (const project of createdProjects) {
        const assignedEvaluators = await prisma.projectEvaluator.findMany({
            where: { projectId: project.id },
            include: { evaluator: true },
        });
        const potentialAuthors = [...assignedEvaluators.map(pe => pe.evaluator)];
        if (project.advisorId) {
            const advisor = await prisma.user.findUnique({ where: { userId: project.advisorId } });
            if (advisor) potentialAuthors.push(advisor);
        }

        if (potentialAuthors.length === 0) continue;

        const numEvals = getRandomInt(1, EVALUATIONS_PER_PROJECT);
        for (let i = 0; i < numEvals; i++) {
            const author = getRandomElement(potentialAuthors);
            if (!author) continue;

            evaluationsData.push({
                score: Math.random() > 0.1 ? faker.number.float({ min: 40, max: 100, fractionDigits: 1 }) : null,
                comments: faker.lorem.paragraphs(getRandomInt(2, 6)),
                criteriaData: {
                    originality: faker.number.int({ min: 1, max: 10 }),
                    methodology: faker.number.int({ min: 1, max: 10 }),
                    presentation: faker.number.int({ min: 1, max: 10 }),
                    effort: faker.number.int({ min: 1, max: 10 }),
                    notes: faker.lorem.sentence(),
                },
                authorId: author.userId,
                projectId: project.id,
            });
        }
    }
    const uniqueEvaluationsData = Array.from(new Set(evaluationsData.map(e => `${e.projectId}-${e.authorId}`)))
        .map((keyStr) => {
            const [projectId, authorId] = keyStr.split('-');
            return evaluationsData.find(e => e.projectId === projectId && e.authorId === authorId)!;
        });

    if (uniqueEvaluationsData.length > 0) {
        await prisma.evaluation.createMany({ data: uniqueEvaluationsData });
        console.log(`${uniqueEvaluationsData.length} Evaluations seeded.`);
    } else {
        console.log('No evaluations seeded.');
    }

    // --- Seed Advisor Requests ---
    console.log('Seeding Advisor Requests...');
    const advisorRequestsData: Prisma.AdvisorRequestCreateManyInput[] = [];
    const requestStatuses = Object.values(AdvisorRequestStatus);
    if (createdGroups.length > 0 && advisorUsers.length > 0 && createdProjects.length > 0) {
        for (let i = 0; i < ADVISOR_REQUESTS; i++) {
            const group = getRandomElement(createdGroups);
            const requestedAdvisor = getRandomElement(advisorUsers);
            const project = getRandomElement(createdProjects.filter(p => p.groupId === group?.id));
            if (!group || !requestedAdvisor || !project) continue;

            const isAlreadyAdvisor = await prisma.project.findFirst({ where: { advisorId: requestedAdvisor.userId, groupId: group.id } });
            if (isAlreadyAdvisor) continue;

            advisorRequestsData.push({
                status: getRandomElement(requestStatuses) ?? AdvisorRequestStatus.PENDING,
                requestMessage: faker.lorem.sentence(),
                responseMessage: Math.random() > 0.5 ? faker.lorem.sentence() : null,
                projectId: project.id,
                groupId: group.id,
                requestedAdvisorId: requestedAdvisor.userId,
            });
        }
        const uniqueAdvisorRequestsData = Array.from(new Set(advisorRequestsData.map(ar => `${ar.groupId}-${ar.requestedAdvisorId}-${ar.projectId}`)))
            .map((keyStr) => {
                const [groupId, requestedAdvisorId, projectId] = keyStr.split('-');
                return advisorRequestsData.find(ar => ar.groupId === groupId && ar.requestedAdvisorId === requestedAdvisorId && ar.projectId === projectId)!;
            });

        if (uniqueAdvisorRequestsData.length > 0) {
            await prisma.advisorRequest.createMany({ data: uniqueAdvisorRequestsData });
            console.log(`${uniqueAdvisorRequestsData.length} Advisor Requests seeded.`);
        } else {
            console.log('No advisor requests seeded.');
        }
    } else {
        console.warn('Cannot seed Advisor Requests: No groups, advisors, or projects exist.');
    }

    // --- Seed Group Invites ---
    console.log('Seeding Group Invites...');
    const groupInvitesData: Prisma.GroupInviteCreateManyInput[] = [];
    if (createdGroups.length > 0 && createdUsers.length > 0) {
        for (let i = 0; i < GROUP_INVITES; i++) {
            const group = getRandomElement(createdGroups);
            const creator = getRandomElement(createdUsers);
            if (!group || !creator) continue;

            groupInvitesData.push({
                code: faker.string.alphanumeric(12) + i,
                expiresAt: faker.date.future({ years: 0.1 }),
                usedAt: Math.random() > 0.7 ? faker.date.past({ years: 0.05 }) : null,
                createdById: creator.userId,
                groupId: group.id,
                email: Math.random() > 0.5 ? faker.internet.email() : null,
            });
        }
        if (groupInvitesData.length > 0) {
            try {
                await prisma.groupInvite.createMany({ data: groupInvitesData, skipDuplicates: true });
                console.log(`${groupInvitesData.length} Group Invites attempted.`);
            } catch (e) {
                console.error(`Error seeding Group Invites: ${e}`);
            }
        } else {
            console.log('No group invites seeded.');
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
            if (!creator) continue;
            announcementsData.push({
                title: faker.company.catchPhrase(),
                content: faker.lorem.paragraphs(3),
                active: faker.datatype.boolean(0.8),
                priority: getRandomInt(0, 5),
                creatorId: creator.userId,
            });
        }
        if (announcementsData.length > 0) {
            await prisma.announcement.createMany({ data: announcementsData });
            console.log(`${announcementsData.length} Announcements seeded.`);
        } else {
            console.log('No announcements seeded.');
        }
    } else {
        console.warn('No admin users found to create announcements.');
    }

    // --- Seed Notifications ---
    console.log('Seeding Notifications...');
    const notificationsData: Prisma.NotificationCreateManyInput[] = [];
    if (createdUsers.length > 0) {
        for (const user of createdUsers) {
            for (let i = 0; i < NOTIFICATIONS_PER_USER; i++) {
                notificationsData.push({
                    message: faker.lorem.sentence(),
                    read: faker.datatype.boolean(0.3),
                    link: Math.random() > 0.6 ? faker.internet.url() : null,
                    recipientId: user.userId,
                });
            }
        }
        if (notificationsData.length > 0) {
            const batchSize = 1000;
            let createdNotificationCount = 0;
            for (let i = 0; i < notificationsData.length; i += batchSize) {
                const batch = notificationsData.slice(i, i + batchSize);
                await prisma.notification.createMany({ data: batch });
                createdNotificationCount += batch.length;
            }
            console.log(`${createdNotificationCount} Notifications seeded.`);
        } else {
            console.log('No notifications seeded.');
        }
    } else {
        console.warn('No users found to send notifications to.');
    }

    // --- Seed Remotes ---
    console.log('Seeding Remotes...');
    const remotesData: Prisma.RemoteCreateManyInput[] = [];
    for (const repo of createdRepositories) {
        if (Math.random() > 0.5) {
            remotesData.push({
                name: 'origin',
                url: faker.internet.url() + `/${repo.name}.git`,
                repositoryId: repo.id,
            });
        }
        if (Math.random() > 0.8) {
            if (!remotesData.find(r => r.repositoryId === repo.id && r.name === 'upstream')) {
                remotesData.push({
                    name: 'upstream',
                    url: faker.internet.url() + `/upstream/${repo.name}.git`,
                    repositoryId: repo.id,
                });
            }
        }
    }
    if (remotesData.length > 0) {
        await prisma.remote.createMany({ data: remotesData, skipDuplicates: true });
        const createdRemotesCount = await prisma.remote.count({ where: { repositoryId: { in: createdRepositories.map(r => r.id) } } });
        console.log(`${createdRemotesCount} Remotes seeded.`);
    } else {
        console.log('No remotes seeded.');
    }

    console.log('Seeding finished successfully!');
}

// --- Execute Seeding ---
main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });