import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking database for qualification runs...\n')

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  })
  console.log(`Found ${users.length} user(s):`)
  users.forEach(u => console.log(`  - ${u.email} (${u.name || 'No name'})`))

  console.log('\n---\n')

  const companies = await prisma.company.findMany({
    select: { id: true, domain: true, name: true, userId: true }
  })
  console.log(`Found ${companies.length} company(ies):`)
  companies.forEach(c => console.log(`  - ${c.domain} (${c.name || 'No name'})`))

  console.log('\n---\n')

  const icps = await prisma.iCP.findMany({
    select: { id: true, title: true, companyId: true }
  })
  console.log(`Found ${icps.length} ICP(s):`)
  icps.forEach(i => console.log(`  - ${i.title}`))

  console.log('\n---\n')

  const runs = await prisma.qualificationRun.findMany({
    include: {
      icp: {
        include: {
          company: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log(`Found ${runs.length} qualification run(s):`)
  runs.forEach(r => {
    console.log(`  - Run ${r.id}`)
    console.log(`    Status: ${r.status}`)
    console.log(`    Progress: ${r.completed}/${r.totalProspects}`)
    console.log(`    ICP: ${r.icp.title}`)
    console.log(`    Company: ${r.icp.company.name || r.icp.company.domain}`)
    console.log(`    Created: ${r.createdAt}`)
    console.log(`    Completed: ${r.completedAt || 'Not completed'}`)
    console.log('')
  })

  console.log('\n---\n')

  const prospects = await prisma.prospectQualification.findMany({
    select: { id: true, domain: true, score: true, fitLevel: true, status: true }
  })
  console.log(`Found ${prospects.length} prospect qualification(s):`)
  prospects.slice(0, 5).forEach(p => {
    console.log(`  - ${p.domain}: ${p.score} (${p.fitLevel}) - ${p.status}`)
  })
  if (prospects.length > 5) {
    console.log(`  ... and ${prospects.length - 5} more`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
