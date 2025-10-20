const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompaniesAPI() {
  try {
    console.log('🧪 Testing companies API logic...');
    
    // Test for user 2 (the one with the issue)
    const testUserId = 'cmgzbt0jm0000l804eqd48qow'; // giovanitest@test.com
    
    console.log(`\n🔍 Testing for user: ${testUserId}`);
    
    const companies = await prisma.company.findMany({
      where: {
        userId: testUserId,
      },
      include: {
        icps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            icps: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Companies found for this user: ${companies.length}`);
    
    if (companies.length > 0) {
      companies.forEach((company, index) => {
        console.log(`\n${index + 1}. Company:`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Domain: ${company.domain}`);
        console.log(`   Name: ${company.name}`);
        console.log(`   Description: ${company.description}`);
        console.log(`   Industry: ${company.industry}`);
        console.log(`   ICPs: ${company.icps.length}`);
        console.log(`   Created: ${company.createdAt}`);
        
        if (company.icps.length > 0) {
          console.log(`   Latest ICP: ${company.icps[0].title}`);
        }
      });
    }
    
    // Also check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        _count: {
          select: {
            companies: true
          }
        }
      }
    });
    
    console.log(`\n👤 User details:`);
    console.log(`   Email: ${user?.email}`);
    console.log(`   Name: ${user?.name}`);
    console.log(`   Active: ${user?.isActive}`);
    console.log(`   Total companies: ${user?._count.companies}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompaniesAPI();