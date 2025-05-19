import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.userId;
    
    // Verify the user is an evaluator
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { role: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'EVALUATOR') {
      return NextResponse.json({ error: 'Access denied. User is not an evaluator' }, { status: 403 });
    }
    
    // Get evaluator's assigned projects
    const assignedProjects = await prisma.projectEvaluator.findMany({
      where: { evaluatorId: userId },
      select: {
        project: {
          select: {
            id: true,
            title: true,
            submissionDate: true,
            evaluations: {
              where: { authorId: userId },
              select: { id: true, criteriaData: true, comments: true },
            },
          },
        },
      },
    });

    // Generate evaluation forms for each project
    // For simplicity, we're creating forms with predefined criteria
    // In a real app, these criteria might come from a separate database table
    const evaluationForms = assignedProjects.map((assignment) => {
      const project = assignment.project;
      const existing = project.evaluations[0]; // Check if there's an existing evaluation
      
      const completionPercentage = existing ? 100 : 0;
      const status = existing ? 'completed' : project.submissionDate ? 'published' : 'draft';
      
      // Default evaluation criteria
      const defaultCriteria = [
        {
          id: 'technical-implementation',
          name: 'Technical Implementation',
          weight: 30,
          description: 'Quality of code and technical solutions',
        },
        {
          id: 'project-management',
          name: 'Project Management',
          weight: 20,
          description: 'Planning, organization, and execution',
        },
        {
          id: 'innovation',
          name: 'Innovation',
          weight: 20,
          description: 'Originality and creativity of the solution',
        },
        {
          id: 'documentation',
          name: 'Documentation',
          weight: 15,
          description: 'Quality and completeness of documentation',
        },
        {
          id: 'presentation',
          name: 'Presentation',
          weight: 15,
          description: 'Communication and presentation of the project',
        },
      ];
      
      // Create the evaluation form structure
      return {
        id: project.id,
        title: `Evaluation: ${project.title}`,
        description: `Complete evaluation form for project: ${project.title}`,
        deadline: project.submissionDate 
          ? new Date(new Date(project.submissionDate).getTime() + 14 * 24 * 60 * 60 * 1000) // 2 weeks after submission
          : new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // Fallback: 30 days from now
        criteria: existing && existing.criteriaData 
          ? (existing.criteriaData as any).criteria || defaultCriteria 
          : defaultCriteria,
        status,
        completionPercentage,
        projectId: project.id,
      };
    });
    
    return NextResponse.json(evaluationForms);
    
  } catch (error) {
    console.error('Error fetching evaluation forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation forms' },
      { status: 500 }
    );
  }
} 