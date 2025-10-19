import { PrismaClient, QuestionType, DifficultyLevel } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample qualifications
  const aiQualification = await prisma.qualification.create({
    data: {
      title: 'Artificial Intelligence Fundamentals',
      description: 'A comprehensive assessment covering the fundamentals of artificial intelligence, including machine learning concepts, neural networks, and AI applications.',
      slug: 'ai-fundamentals',
      shortDescription: 'Learn the core concepts of AI and machine learning',
      category: 'ARTIFICIAL_INTELLIGENCE',
      difficulty: 'BEGINNER',
      estimatedDuration: 90,
      prerequisites: [],
      tags: ['AI', 'Machine Learning', 'Neural Networks', 'Data Science'],
      passingScore: 70,
      totalQuestions: 50,
      timeLimit: 120,
      allowRetakes: true,
      retakeCooldown: 24,
      learningObjectives: [
        'Understand the fundamentals of artificial intelligence',
        'Recognize different types of machine learning algorithms',
        'Identify common AI applications and use cases',
        'Understand the basics of neural networks',
        'Recognize ethical considerations in AI development'
      ],
      syllabus: {
        modules: [
          {
            title: 'Introduction to AI',
            topics: ['What is AI?', 'History of AI', 'Types of AI', 'AI vs ML vs DL']
          },
          {
            title: 'Machine Learning Basics',
            topics: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Model Evaluation']
          },
          {
            title: 'Neural Networks',
            topics: ['Perceptrons', 'Deep Learning', 'Activation Functions', 'Backpropagation']
          },
          {
            title: 'AI Applications',
            topics: ['Computer Vision', 'Natural Language Processing', 'Robotics', 'Autonomous Systems']
          },
          {
            title: 'Ethics and Future of AI',
            topics: ['AI Ethics', 'Bias in AI', 'Future Trends', 'Impact on Society']
          }
        ]
      },
      isActive: true,
      isPublished: true,
      version: '1.0'
    }
  })

  const webDevQualification = await prisma.qualification.create({
    data: {
      title: 'Full-Stack Web Development',
      description: 'Master modern web development with React, Node.js, databases, and deployment strategies.',
      slug: 'fullstack-web-dev',
      shortDescription: 'Complete full-stack development skills assessment',
      category: 'WEB_DEVELOPMENT',
      difficulty: 'INTERMEDIATE',
      estimatedDuration: 120,
      prerequisites: ['HTML', 'CSS', 'JavaScript'],
      tags: ['React', 'Node.js', 'JavaScript', 'Database', 'API'],
      passingScore: 75,
      totalQuestions: 60,
      timeLimit: 150,
      allowRetakes: true,
      retakeCooldown: 48,
      learningObjectives: [
        'Build modern frontend applications with React',
        'Develop RESTful APIs with Node.js',
        'Design and implement database schemas',
        'Deploy applications to cloud platforms',
        'Implement authentication and authorization'
      ],
      syllabus: {
        modules: [
          {
            title: 'Frontend Development',
            topics: ['React Components', 'State Management', 'Hooks', 'Routing']
          },
          {
            title: 'Backend Development',
            topics: ['Node.js', 'Express.js', 'API Design', 'Middleware']
          },
          {
            title: 'Database Management',
            topics: ['SQL vs NoSQL', 'Schema Design', 'Queries', 'Migrations']
          },
          {
            title: 'Deployment & DevOps',
            topics: ['CI/CD', 'Docker', 'Cloud Platforms', 'Monitoring']
          }
        ]
      },
      isActive: true,
      isPublished: true,
      version: '1.0'
    }
  })

  // Create sample assessments
  const aiAssessment = await prisma.assessment.create({
    data: {
      qualificationId: aiQualification.id,
      title: 'AI Fundamentals Assessment',
      description: 'Test your knowledge of artificial intelligence fundamentals',
      questionCount: 50,
      timeLimit: 120,
      randomizeQuestions: true,
      randomizeAnswers: true,
      showResults: true,
      questionCategories: {
        'Introduction to AI': 10,
        'Machine Learning Basics': 15,
        'Neural Networks': 10,
        'AI Applications': 10,
        'Ethics and Future of AI': 5
      },
      difficultyMix: {
        'BEGINNER': 30,
        'INTERMEDIATE': 15,
        'ADVANCED': 5
      },
      isActive: true
    }
  })

  const webDevAssessment = await prisma.assessment.create({
    data: {
      qualificationId: webDevQualification.id,
      title: 'Full-Stack Development Assessment',
      description: 'Comprehensive evaluation of full-stack development skills',
      questionCount: 60,
      timeLimit: 150,
      randomizeQuestions: true,
      randomizeAnswers: true,
      showResults: true,
      questionCategories: {
        'Frontend Development': 20,
        'Backend Development': 20,
        'Database Management': 10,
        'Deployment & DevOps': 10
      },
      difficultyMix: {
        'BEGINNER': 20,
        'INTERMEDIATE': 30,
        'ADVANCED': 10
      },
      isActive: true
    }
  })

  // Create sample questions for AI qualification
  const aiQuestions = [
    {
      title: 'What is Machine Learning?',
      content: 'Which of the following best describes machine learning?',
      explanation: 'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed for every task.',
      type: QuestionType.MULTIPLE_CHOICE,
      category: 'Machine Learning Basics',
      difficulty: DifficultyLevel.BEGINNER,
      tags: ['ML', 'Definition'],
      options: {
        choices: [
          'A type of computer programming language',
          'A subset of AI that learns from data without explicit programming',
          'A hardware component for faster computing',
          'A database management system'
        ]
      },
      correctAnswers: ['A subset of AI that learns from data without explicit programming'],
      points: 1,
      timeEstimate: 30
    },
    {
      title: 'Types of Machine Learning',
      content: 'Which of the following are main types of machine learning? (Select all that apply)',
      explanation: 'The three main types of machine learning are supervised learning (with labeled data), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through rewards and penalties).',
      type: QuestionType.MULTIPLE_SELECT,
      category: 'Machine Learning Basics',
      difficulty: DifficultyLevel.BEGINNER,
      tags: ['ML', 'Types'],
      options: {
        choices: [
          'Supervised Learning',
          'Unsupervised Learning',
          'Reinforcement Learning',
          'Quantum Learning',
          'Biological Learning'
        ]
      },
      correctAnswers: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'],
      points: 2,
      timeEstimate: 45
    },
    {
      title: 'Neural Network Activation',
      content: 'What is the purpose of activation functions in neural networks?',
      explanation: 'Activation functions introduce non-linearity into neural networks, allowing them to learn complex patterns and relationships that linear functions cannot capture.',
      type: QuestionType.MULTIPLE_CHOICE,
      category: 'Neural Networks',
      difficulty: DifficultyLevel.INTERMEDIATE,
      tags: ['Neural Networks', 'Activation Functions'],
      options: {
        choices: [
          'To speed up training',
          'To introduce non-linearity and enable learning of complex patterns',
          'To reduce memory usage',
          'To prevent overfitting'
        ]
      },
      correctAnswers: ['To introduce non-linearity and enable learning of complex patterns'],
      points: 1,
      timeEstimate: 40
    }
  ]

  // Create sample questions for web development qualification
  const webDevQuestions = [
    {
      title: 'React Hooks',
      content: 'What is the correct way to use the useState hook in React?',
      explanation: 'useState is a hook that lets you add state to functional components. It returns an array with the current state value and a function to update it.',
      type: QuestionType.MULTIPLE_CHOICE,
      category: 'Frontend Development',
      difficulty: DifficultyLevel.INTERMEDIATE,
      tags: ['React', 'Hooks', 'State'],
      options: {
        choices: [
          'const [count, setCount] = useState(0)',
          'const count = useState(0)',
          'const setCount = useState(0)',
          'useState(count, setCount) = 0'
        ]
      },
      correctAnswers: ['const [count, setCount] = useState(0)'],
      points: 1,
      timeEstimate: 35
    },
    {
      title: 'RESTful API Design',
      content: 'Which HTTP methods are commonly used in RESTful APIs? (Select all that apply)',
      explanation: 'REST APIs typically use GET (retrieve), POST (create), PUT (update), PATCH (partial update), and DELETE (remove) methods to perform CRUD operations.',
      type: QuestionType.MULTIPLE_SELECT,
      category: 'Backend Development',
      difficulty: DifficultyLevel.BEGINNER,
      tags: ['REST', 'HTTP', 'API'],
      options: {
        choices: [
          'GET',
          'POST',
          'PUT',
          'DELETE',
          'PATCH',
          'SEND',
          'RECEIVE'
        ]
      },
      correctAnswers: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      points: 2,
      timeEstimate: 40
    }
  ]

  // Insert AI questions
  for (const questionData of aiQuestions) {
    await prisma.question.create({
      data: {
        ...questionData,
        qualificationId: aiQualification.id
      }
    })
  }

  // Insert Web Dev questions
  for (const questionData of webDevQuestions) {
    await prisma.question.create({
      data: {
        ...questionData,
        qualificationId: webDevQualification.id
      }
    })
  }

  console.log('✅ Database seeding completed successfully!')
  console.log(`Created ${aiQuestions.length + webDevQuestions.length} sample questions`)
  console.log('📊 Summary:')
  console.log(`- Qualifications: 2`)
  console.log(`- Assessments: 2`)
  console.log(`- Questions: ${aiQuestions.length + webDevQuestions.length}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })