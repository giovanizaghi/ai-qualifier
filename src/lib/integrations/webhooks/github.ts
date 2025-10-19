import { webhookRegistry, type WebhookEvent, verifyGitHubSignature } from '../webhooks'
import { sendNotificationEmail } from '../email'

// GitHub webhook event handlers
async function handleRepositoryCreated(event: WebhookEvent): Promise<void> {
  const repository = event.data.repository
  const sender = event.data.sender
  
  console.log('GitHub repository created:', repository.full_name)
  
  // Log repository creation for analytics
  console.log(`Repository ${repository.full_name} created by ${sender.login}`)
}

async function handlePushEvent(event: WebhookEvent): Promise<void> {
  const repository = event.data.repository
  const pusher = event.data.pusher
  const commits = event.data.commits
  
  console.log('GitHub push event:', repository.full_name)
  
  // Process commits for code analysis or quality metrics
  for (const commit of commits) {
    console.log(`Commit: ${commit.id} by ${commit.author.name}`)
    console.log(`Message: ${commit.message}`)
    
    // Here you could implement code quality analysis
    // or update user progress based on their contributions
  }
}

async function handleIssueOpened(event: WebhookEvent): Promise<void> {
  const issue = event.data.issue
  const repository = event.data.repository
  const sender = event.data.sender
  
  console.log('GitHub issue opened:', issue.title)
  
  // Notify team about new issue
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    await sendNotificationEmail({
      email: adminEmail,
      name: 'Admin',
      title: 'New GitHub Issue',
      message: `
        <p>A new issue has been opened in ${repository.full_name}:</p>
        <h3>${issue.title}</h3>
        <p><strong>Author:</strong> ${sender.login}</p>
        <p><strong>Description:</strong></p>
        <blockquote>${issue.body || 'No description provided'}</blockquote>
      `,
      actionUrl: issue.html_url,
      actionText: 'View Issue',
    })
  }
}

async function handlePullRequestOpened(event: WebhookEvent): Promise<void> {
  const pullRequest = event.data.pull_request
  const repository = event.data.repository
  const sender = event.data.sender
  
  console.log('GitHub pull request opened:', pullRequest.title)
  
  // Notify team about new PR
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    await sendNotificationEmail({
      email: adminEmail,
      name: 'Admin',
      title: 'New Pull Request',
      message: `
        <p>A new pull request has been opened in ${repository.full_name}:</p>
        <h3>${pullRequest.title}</h3>
        <p><strong>Author:</strong> ${sender.login}</p>
        <p><strong>Branch:</strong> ${pullRequest.head.ref} → ${pullRequest.base.ref}</p>
        <p><strong>Description:</strong></p>
        <blockquote>${pullRequest.body || 'No description provided'}</blockquote>
      `,
      actionUrl: pullRequest.html_url,
      actionText: 'Review PR',
    })
  }
}

async function handleReleasePublished(event: WebhookEvent): Promise<void> {
  const release = event.data.release
  const repository = event.data.repository
  
  console.log('GitHub release published:', release.tag_name)
  
  // Notify team about new release
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    await sendNotificationEmail({
      email: adminEmail,
      name: 'Admin',
      title: 'New Release Published',
      message: `
        <p>A new release has been published for ${repository.full_name}:</p>
        <h3>${release.name || release.tag_name}</h3>
        <p><strong>Tag:</strong> ${release.tag_name}</p>
        <p><strong>Pre-release:</strong> ${release.prerelease ? 'Yes' : 'No'}</p>
        <p><strong>Release Notes:</strong></p>
        <blockquote>${release.body || 'No release notes provided'}</blockquote>
      `,
      actionUrl: release.html_url,
      actionText: 'View Release',
    })
  }
}

async function handleWorkflowRunCompleted(event: WebhookEvent): Promise<void> {
  const workflowRun = event.data.workflow_run
  const repository = event.data.repository
  
  console.log('GitHub workflow completed:', workflowRun.name, workflowRun.conclusion)
  
  // Only notify on failure
  if (workflowRun.conclusion === 'failure') {
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      await sendNotificationEmail({
        email: adminEmail,
        name: 'Admin',
        title: 'Workflow Failed',
        message: `
          <p>A workflow has failed in ${repository.full_name}:</p>
          <h3>${workflowRun.name}</h3>
          <p><strong>Branch:</strong> ${workflowRun.head_branch}</p>
          <p><strong>Event:</strong> ${workflowRun.event}</p>
          <p><strong>Status:</strong> ${workflowRun.conclusion}</p>
        `,
        actionUrl: workflowRun.html_url,
        actionText: 'View Workflow',
      })
    }
  }
}

// Register GitHub webhook handlers
export function registerGitHubWebhooks(): void {
  webhookRegistry.register({
    source: 'github',
    eventTypes: ['repository.created'],
    handler: handleRepositoryCreated,
    verifySignature: verifyGitHubSignature,
  })

  webhookRegistry.register({
    source: 'github',
    eventTypes: ['push'],
    handler: handlePushEvent,
    verifySignature: verifyGitHubSignature,
  })

  webhookRegistry.register({
    source: 'github',
    eventTypes: ['issues.opened'],
    handler: handleIssueOpened,
    verifySignature: verifyGitHubSignature,
  })

  webhookRegistry.register({
    source: 'github',
    eventTypes: ['pull_request.opened'],
    handler: handlePullRequestOpened,
    verifySignature: verifyGitHubSignature,
  })

  webhookRegistry.register({
    source: 'github',
    eventTypes: ['release.published'],
    handler: handleReleasePublished,
    verifySignature: verifyGitHubSignature,
  })

  webhookRegistry.register({
    source: 'github',
    eventTypes: ['workflow_run.completed'],
    handler: handleWorkflowRunCompleted,
    verifySignature: verifyGitHubSignature,
  })

  console.log('GitHub webhook handlers registered')
}