import { 
  LearningPath, 
  LearningStep, 
  LearningPathWithProgress, 
  LearningPathProgress,
  LearningPathCategory,
  DifficultyLevel,
  LearningStepType,
  ResourceType,
  ProgressStatus,
  StepStatus
} from '@/types/learning-paths'

// Mock Learning Steps
const createMockSteps = (pathId: string, count: number): LearningStep[] => {
  const stepTypes = Object.values(LearningStepType)
  const difficulties = Object.values(DifficultyLevel)
  
  return Array.from({ length: count }, (_, index) => ({
    id: `step-${pathId}-${index + 1}`,
    pathId,
    order: index + 1,
    title: `Step ${index + 1}: ${getStepTitle(index, count)}`,
    description: getStepDescription(index, count),
    type: stepTypes[index % stepTypes.length],
    content: {
      type: 'text' as const,
      contentUrl: `https://example.com/content/${pathId}/step-${index + 1}`,
      metadata: {}
    },
    estimatedTime: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
    difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
    isOptional: Math.random() > 0.8, // 20% chance of being optional
    prerequisites: index > 0 ? [`step-${pathId}-${index}`] : [],
    unlocks: index < count - 1 ? [`step-${pathId}-${index + 2}`] : [],
    resources: [
      {
        id: `resource-${pathId}-${index + 1}-1`,
        title: `Reading Material ${index + 1}`,
        type: ResourceType.ARTICLE,
        url: `https://example.com/resources/${pathId}/article-${index + 1}`,
        isRequired: true,
        estimatedTime: 10
      },
      {
        id: `resource-${pathId}-${index + 1}-2`,
        title: `Supplementary Video`,
        type: ResourceType.VIDEO,
        url: `https://example.com/resources/${pathId}/video-${index + 1}`,
        isRequired: false,
        estimatedTime: 15
      }
    ],
    hasAssessment: Math.random() > 0.7, // 30% chance of having assessment
    assessmentId: Math.random() > 0.7 ? `assessment-${pathId}-${index + 1}` : undefined,
    passingCriteria: Math.random() > 0.7 ? { minScore: 70, maxAttempts: 3 } : undefined,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }))
}

const getStepTitle = (index: number, total: number): string => {
  const titles = [
    'Introduction and Fundamentals',
    'Core Concepts and Theory',
    'Practical Applications',
    'Hands-on Practice',
    'Advanced Techniques',
    'Real-world Projects',
    'Best Practices',
    'Testing and Validation',
    'Performance Optimization',
    'Final Assessment',
    'Capstone Project',
    'Next Steps and Resources'
  ]
  
  if (index === 0) return 'Introduction and Setup'
  if (index === total - 1) return 'Final Project and Assessment'
  
  return titles[index % titles.length] || `Advanced Topic ${index}`
}

const getStepDescription = (index: number, total: number): string => {
  const descriptions = [
    'Get started with the fundamentals and set up your learning environment.',
    'Dive deep into the core concepts that form the foundation of this topic.',
    'Learn how to apply theoretical knowledge to practical scenarios.',
    'Practice your skills with guided exercises and examples.',
    'Explore advanced techniques and best practices used by professionals.',
    'Work on real-world projects to solidify your understanding.',
    'Learn industry best practices and common patterns.',
    'Understand how to test and validate your implementations.',
    'Optimize performance and handle edge cases effectively.',
    'Complete a comprehensive assessment to test your knowledge.',
    'Apply everything you\'ve learned in a capstone project.',
    'Explore next steps and additional resources for continued learning.'
  ]
  
  return descriptions[index % descriptions.length] || `Learn advanced concepts in step ${index + 1}.`
}

// Mock Learning Paths
export const mockLearningPaths: LearningPath[] = [
  {
    id: 'path-1',
    title: 'Machine Learning Fundamentals',
    description: 'A comprehensive introduction to machine learning concepts, algorithms, and practical applications. Perfect for beginners looking to understand the core principles of ML.',
    shortDescription: 'Learn the fundamentals of machine learning from scratch.',
    category: LearningPathCategory.MACHINE_LEARNING,
    difficulty: DifficultyLevel.BEGINNER,
    estimatedDuration: 480, // 8 hours
    totalSteps: 8,
    prerequisites: ['Basic mathematics', 'Python programming'],
    tags: ['Machine Learning', 'Python', 'Beginner Friendly', 'Theory', 'Hands-on'],
    learningObjectives: [
      'Understand fundamental ML concepts and terminology',
      'Learn different types of machine learning algorithms',
      'Implement basic ML models using Python',
      'Evaluate model performance and interpret results'
    ],
    outcomes: [
      'Build and evaluate supervised learning models',
      'Understand when to use different ML algorithms',
      'Prepare data for machine learning tasks',
      'Interpret model results and make data-driven decisions'
    ],
    isActive: true,
    isPublished: true,
    steps: createMockSteps('path-1', 8),
    qualificationIds: ['qual-ml-basics'],
    instructorId: 'instructor-1',
    enrollmentCount: 1247,
    completionRate: 0.73,
    averageRating: 4.6,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-10-01')
  },
  {
    id: 'path-2',
    title: 'Full-Stack Web Development',
    description: 'Master modern web development with React, Node.js, and databases. Build complete web applications from frontend to backend.',
    shortDescription: 'Build complete web applications with modern technologies.',
    category: LearningPathCategory.WEB_DEVELOPMENT,
    difficulty: DifficultyLevel.INTERMEDIATE,
    estimatedDuration: 1200, // 20 hours
    totalSteps: 12,
    prerequisites: ['HTML/CSS basics', 'JavaScript fundamentals'],
    tags: ['React', 'Node.js', 'Full-Stack', 'Project-Based', 'Interactive'],
    learningObjectives: [
      'Build responsive user interfaces with React',
      'Create RESTful APIs with Node.js and Express',
      'Design and implement database schemas',
      'Deploy applications to production environments'
    ],
    outcomes: [
      'Develop complete full-stack web applications',
      'Understand frontend-backend communication',
      'Implement user authentication and authorization',
      'Deploy and maintain web applications'
    ],
    isActive: true,
    isPublished: true,
    steps: createMockSteps('path-2', 12),
    qualificationIds: ['qual-web-dev'],
    instructorId: 'instructor-2',
    enrollmentCount: 892,
    completionRate: 0.68,
    averageRating: 4.8,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-09-15')
  },
  {
    id: 'path-3',
    title: 'Cloud Computing with AWS',
    description: 'Learn cloud computing fundamentals and AWS services. Gain hands-on experience with EC2, S3, Lambda, and more.',
    shortDescription: 'Master AWS cloud services and architecture.',
    category: LearningPathCategory.CLOUD_COMPUTING,
    difficulty: DifficultyLevel.INTERMEDIATE,
    estimatedDuration: 720, // 12 hours
    totalSteps: 10,
    prerequisites: ['Basic networking', 'Linux command line'],
    tags: ['AWS', 'Cloud Computing', 'Infrastructure', 'Certification Prep'],
    learningObjectives: [
      'Understand cloud computing concepts and benefits',
      'Deploy and manage AWS services',
      'Design scalable and secure cloud architectures',
      'Implement cost optimization strategies'
    ],
    outcomes: [
      'Deploy applications on AWS infrastructure',
      'Configure auto-scaling and load balancing',
      'Implement security best practices',
      'Prepare for AWS certification exams'
    ],
    isActive: true,
    isPublished: true,
    steps: createMockSteps('path-3', 10),
    qualificationIds: ['qual-aws-basics'],
    instructorId: 'instructor-3',
    enrollmentCount: 634,
    completionRate: 0.71,
    averageRating: 4.5,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-10-05')
  },
  {
    id: 'path-4',
    title: 'Data Science with Python',
    description: 'Comprehensive data science curriculum covering statistics, data analysis, visualization, and machine learning with Python.',
    shortDescription: 'Complete data science journey with Python.',
    category: LearningPathCategory.DATA_SCIENCE,
    difficulty: DifficultyLevel.ADVANCED,
    estimatedDuration: 960, // 16 hours
    totalSteps: 14,
    prerequisites: ['Python programming', 'Statistics basics', 'Linear algebra'],
    tags: ['Data Science', 'Python', 'Statistics', 'Machine Learning', 'Advanced'],
    learningObjectives: [
      'Master data manipulation with pandas and numpy',
      'Create compelling data visualizations',
      'Apply statistical analysis techniques',
      'Build and deploy machine learning models'
    ],
    outcomes: [
      'Conduct comprehensive data analysis projects',
      'Build predictive models for business problems',
      'Communicate insights through data visualization',
      'Deploy data science solutions to production'
    ],
    isActive: true,
    isPublished: true,
    steps: createMockSteps('path-4', 14),
    qualificationIds: ['qual-data-science'],
    instructorId: 'instructor-4',
    enrollmentCount: 423,
    completionRate: 0.62,
    averageRating: 4.7,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-09-28')
  },
  {
    id: 'path-5',
    title: 'Cybersecurity Fundamentals',
    description: 'Essential cybersecurity concepts, threat analysis, and defensive strategies. Perfect for beginners entering the security field.',
    shortDescription: 'Learn essential cybersecurity concepts and practices.',
    category: LearningPathCategory.CYBERSECURITY,
    difficulty: DifficultyLevel.BEGINNER,
    estimatedDuration: 540, // 9 hours
    totalSteps: 9,
    prerequisites: ['Basic networking', 'Computer fundamentals'],
    tags: ['Cybersecurity', 'Security', 'Beginner Friendly', 'Theory', 'Career Change'],
    learningObjectives: [
      'Understand common security threats and vulnerabilities',
      'Learn network security fundamentals',
      'Implement basic security measures',
      'Develop incident response procedures'
    ],
    outcomes: [
      'Identify and assess security risks',
      'Implement security controls and measures',
      'Respond to security incidents effectively',
      'Prepare for entry-level security roles'
    ],
    isActive: true,
    isPublished: true,
    steps: createMockSteps('path-5', 9),
    qualificationIds: ['qual-cybersec-basics'],
    instructorId: 'instructor-5',
    enrollmentCount: 756,
    completionRate: 0.79,
    averageRating: 4.4,
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-10-10')
  },
  {
    id: 'path-6',
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile applications using React Native. Learn to create native iOS and Android apps with JavaScript.',
    shortDescription: 'Create mobile apps for iOS and Android.',
    category: LearningPathCategory.MOBILE_DEVELOPMENT,
    difficulty: DifficultyLevel.INTERMEDIATE,
    estimatedDuration: 840, // 14 hours
    totalSteps: 11,
    prerequisites: ['JavaScript', 'React basics'],
    tags: ['React Native', 'Mobile Development', 'Cross-platform', 'Project-Based'],
    learningObjectives: [
      'Build native mobile app components',
      'Handle navigation and state management',
      'Integrate with device APIs and services',
      'Deploy apps to app stores'
    ],
    outcomes: [
      'Develop complete mobile applications',
      'Publish apps to iOS and Android stores',
      'Implement push notifications and offline storage',
      'Optimize app performance and user experience'
    ],
    isActive: true,
    isPublished: true,
    steps: createMockSteps('path-6', 11),
    qualificationIds: ['qual-mobile-dev'],
    instructorId: 'instructor-6',
    enrollmentCount: 512,
    completionRate: 0.66,
    averageRating: 4.3,
    createdAt: new Date('2024-05-12'),
    updatedAt: new Date('2024-09-20')
  }
]

// Mock Progress Data
export const mockProgressData: Record<string, LearningPathProgress> = {
  'path-1': {
    id: 'progress-1',
    userId: 'user-1',
    pathId: 'path-1',
    status: ProgressStatus.IN_PROGRESS,
    completionPercentage: 62.5,
    currentStepId: 'step-path-1-5',
    currentStepOrder: 5,
    totalTimeSpent: 180, // 3 hours
    lastActivityAt: new Date('2024-10-15'),
    enrolledAt: new Date('2024-10-01'),
    completedSteps: ['step-path-1-1', 'step-path-1-2', 'step-path-1-3', 'step-path-1-4'],
    stepProgress: {
      'step-path-1-1': {
        stepId: 'step-path-1-1',
        status: StepStatus.COMPLETED,
        startedAt: new Date('2024-10-01'),
        completedAt: new Date('2024-10-01'),
        timeSpent: 45,
        attempts: 1,
        bestScore: 85
      },
      'step-path-1-2': {
        stepId: 'step-path-1-2',
        status: StepStatus.COMPLETED,
        startedAt: new Date('2024-10-02'),
        completedAt: new Date('2024-10-03'),
        timeSpent: 60,
        attempts: 1,
        bestScore: 92
      },
      'step-path-1-3': {
        stepId: 'step-path-1-3',
        status: StepStatus.COMPLETED,
        startedAt: new Date('2024-10-04'),
        completedAt: new Date('2024-10-05'),
        timeSpent: 40,
        attempts: 2,
        bestScore: 78,
        lastScore: 78
      },
      'step-path-1-4': {
        stepId: 'step-path-1-4',
        status: StepStatus.COMPLETED,
        startedAt: new Date('2024-10-06'),
        completedAt: new Date('2024-10-08'),
        timeSpent: 75,
        attempts: 1,
        bestScore: 90
      },
      'step-path-1-5': {
        stepId: 'step-path-1-5',
        status: StepStatus.IN_PROGRESS,
        startedAt: new Date('2024-10-10'),
        timeSpent: 25,
        attempts: 1
      }
    },
    averageScore: 86.25,
    strengths: ['Machine Learning Theory', 'Data Preprocessing', 'Algorithm Implementation'],
    areasForImprovement: ['Model Evaluation', 'Feature Engineering'],
    personalizedRecommendations: [
      'Focus on model evaluation techniques in the next step',
      'Practice feature engineering with real datasets',
      'Review statistical concepts for better understanding'
    ],
    adaptiveAdjustments: [],
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-10-15')
  },
  'path-2': {
    id: 'progress-2',
    userId: 'user-1',
    pathId: 'path-2',
    status: ProgressStatus.COMPLETED,
    completionPercentage: 100,
    currentStepId: 'step-path-2-12',
    currentStepOrder: 12,
    totalTimeSpent: 980, // 16.3 hours
    lastActivityAt: new Date('2024-09-30'),
    enrolledAt: new Date('2024-08-15'),
    completedAt: new Date('2024-09-30'),
    completedSteps: Array.from({ length: 12 }, (_, i) => `step-path-2-${i + 1}`),
    stepProgress: Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [
        `step-path-2-${i + 1}`,
        {
          stepId: `step-path-2-${i + 1}`,
          status: StepStatus.COMPLETED,
          startedAt: new Date('2024-08-15'),
          completedAt: new Date('2024-09-30'),
          timeSpent: Math.floor(Math.random() * 120) + 30,
          attempts: Math.floor(Math.random() * 2) + 1,
          bestScore: Math.floor(Math.random() * 20) + 80
        }
      ])
    ),
    averageScore: 89.3,
    strengths: ['React Development', 'API Integration', 'Database Design', 'Full-Stack Architecture'],
    areasForImprovement: ['Performance Optimization'],
    personalizedRecommendations: [
      'Consider advanced React patterns course',
      'Explore microservices architecture',
      'Learn advanced database optimization'
    ],
    adaptiveAdjustments: [],
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-09-30')
  }
}

// Helper function to get learning paths with progress
export const getMockLearningPathsWithProgress = (userId?: string): LearningPathWithProgress[] => {
  return mockLearningPaths.map(path => ({
    ...path,
    userProgress: userId ? mockProgressData[path.id] : undefined,
    _count: {
      enrollments: path.enrollmentCount,
      completions: Math.floor(path.enrollmentCount * path.completionRate),
      steps: path.totalSteps
    }
  }))
}

// Helper function to get a single learning path with progress
export const getMockLearningPath = (pathId: string, userId?: string): LearningPathWithProgress | null => {
  const path = mockLearningPaths.find(p => p.id === pathId)
  if (!path) return null
  
  return {
    ...path,
    userProgress: userId ? mockProgressData[pathId] : undefined,
    _count: {
      enrollments: path.enrollmentCount,
      completions: Math.floor(path.enrollmentCount * path.completionRate),
      steps: path.totalSteps
    }
  }
}

// Helper function to simulate filtering
export const filterMockLearningPaths = (
  paths: LearningPathWithProgress[],
  filters: {
    search?: string
    category?: LearningPathCategory
    difficulty?: DifficultyLevel
    status?: 'all' | 'not-started' | 'in-progress' | 'completed'
    tags?: string[]
  }
): LearningPathWithProgress[] => {
  return paths.filter(path => {
    // Search filter
    if (filters.search?.trim()) {
      const searchTerm = filters.search.toLowerCase()
      if (
        !path.title.toLowerCase().includes(searchTerm) &&
        !path.description.toLowerCase().includes(searchTerm) &&
        !path.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      ) {
        return false
      }
    }

    // Category filter
    if (filters.category && path.category !== filters.category) {
      return false
    }

    // Difficulty filter
    if (filters.difficulty && path.difficulty !== filters.difficulty) {
      return false
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const userProgress = path.userProgress
      switch (filters.status) {
        case 'not-started':
          if (userProgress && userProgress.status !== ProgressStatus.NOT_STARTED) return false
          break
        case 'in-progress':
          if (!userProgress || userProgress.status !== ProgressStatus.IN_PROGRESS) return false
          break
        case 'completed':
          if (!userProgress || userProgress.status !== ProgressStatus.COMPLETED) return false
          break
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some(tag => path.tags.includes(tag))) {
        return false
      }
    }

    return true
  })
}