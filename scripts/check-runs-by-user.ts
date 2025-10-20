import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking qualification runs by user...\n')

  const users = await prisma.user.findMany({
    include: {
      qualificationRuns: {
        include: {
          icp: {
            include: {
              company: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  users.forEach(user => {
    console.log(`\n📧 User: ${user.email} (ID: ${user.id})`)
    console.log(`   Name: ${user.name || 'No name'}`)
    console.log(`   Qualification Runs: ${user.qualificationRuns.length}`)
    
    if (user.qualificationRuns.length > 0) {
      user.qualificationRuns.forEach((run, index) => {
        console.log(`\n   ${index + 1}. Run ${run.id}`)
        console.log(`      Status: ${run.status}`)
        console.log(`      Progress: ${run.completed}/${run.totalProspects}`)
        console.log(`      ICP: ${run.icp.title}`)
        console.log(`      Company: ${run.icp.company.name || run.icp.company.domain}`)
        console.log(`      Created: ${run.createdAt}`)
      })
    } else {
      console.log('   No qualification runs found.')
    }
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
