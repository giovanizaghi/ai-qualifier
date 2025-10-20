const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCompanies() {
  try {
    console.log('🔍 Debugging companies in database...');
    
    // Check all companies
    const allCompanies = await prisma.company.findMany({
      include: {
        icps: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    console.log(`\n📊 Total companies in database: ${allCompanies.length}`);
    
    if (allCompanies.length > 0) {
      console.log('\n📋 Companies found:');
      allCompanies.forEach((company, index) => {
        console.log(`\n${index + 1}. Company ID: ${company.id}`);
        console.log(`   Domain: ${company.domain}`);
        console.log(`   Name: ${company.name || 'NULL'}`);
        console.log(`   User ID: ${company.userId}`);
        console.log(`   User Email: ${company.user.email}`);
        console.log(`   ICPs: ${company.icps.length}`);
        console.log(`   Created: ${company.createdAt}`);
      });
    } else {
      console.log('\n❌ No companies found in database');
    }
    
    // Check users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        _count: {
          select: {
            companies: true
          }
        }
      }
    });
    
    console.log(`\n👥 Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'}) - ${user._count.companies} companies`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCompanies();