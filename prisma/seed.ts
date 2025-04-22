import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test user with known credentials
  const passwordHash = await bcrypt.hash('password123', 10);
  
  try {
    // First check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'testuser' }
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          passwordHash,
          role: Role.STUDENT,
          profileInfo: {
            idNumber: 'TEST001',
            email: 'test@bdu.edu.et',
            department: 'computer-science',
            batchYear: '2023'
          }
        }
      });
      console.log('Created test user:', user.username);
    } else {
      console.log('Test user already exists');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
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