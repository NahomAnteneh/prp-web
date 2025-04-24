import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.groupId;

    // Get request data
    const { email, inviteCode, groupName } = await request.json();

    // Validate input
    if (!email || !inviteCode || !groupName) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // In a production environment, you would send a real email here
    // For this demo, we'll simulate sending an email
    
    console.log(`Sending invitation email to ${email} for group ${groupName} (ID: ${groupId}) with code ${inviteCode}`);
    
    // This would be replaced with actual email sending logic
    // Example with a service like SendGrid:
    // 
    // await sendgrid.send({
    //   to: email,
    //   from: 'noreply@yourapp.com',
    //   subject: `Invitation to join ${groupName} on [Your App Name]`,
    //   text: `You've been invited to join ${groupName}. Use the code ${inviteCode} to join.`,
    //   html: `<p>You've been invited to join <strong>${groupName}</strong>.</p>
    //          <p>Use the code <strong>${inviteCode}</strong> to join.</p>`,
    // });

    // Mock successful email sending
    return NextResponse.json({ message: 'Invitation email sent' }, { status: 200 });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return NextResponse.json(
      { message: 'Error sending invitation email' },
      { status: 500 }
    );
  }
} 