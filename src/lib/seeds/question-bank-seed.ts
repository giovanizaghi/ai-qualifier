/**
 * Question Bank Seeding Script
 * Creates comprehensive sample questions across different categories and difficulty levels
 * to demonstrate the question management system
 */

import { prisma } from '../prisma'

const questionSamples = [
  // AI Fundamentals - Beginner
  {
    title: "What is Artificial Intelligence?",
    content: "Which of the following best describes Artificial Intelligence?",
    type: "MULTIPLE_CHOICE",
    category: "AI Fundamentals",
    difficulty: "BEGINNER",
    tags: ["fundamentals", "definition", "basics"],
    options: {
      choices: [
        { id: "a", text: "A computer program that can think like humans", isCorrect: false },
        { id: "b", text: "A system that can perform tasks that typically require human intelligence", isCorrect: true },
        { id: "c", text: "A robot that looks like a human", isCorrect: false },
        { id: "d", text: "A type of computer hardware", isCorrect: false }
      ],
      randomizeOrder: true,
      showLetters: true
    },
    correctAnswers: ["b"],
    explanation: "AI is defined as a system that can perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and translation between languages.",
    points: 1,
    timeEstimate: 30
  },
  
  // Machine Learning - Intermediate
  {
    title: "Supervised vs Unsupervised Learning",
    content: "What is the main difference between supervised and unsupervised learning?",
    type: "MULTIPLE_CHOICE",
    category: "Machine Learning",
    difficulty: "INTERMEDIATE",
    tags: ["supervised", "unsupervised", "learning-types"],
    options: {
      choices: [
        { id: "a", text: "Supervised learning uses labeled data, unsupervised learning uses unlabeled data", isCorrect: true },
        { id: "b", text: "Supervised learning is faster than unsupervised learning", isCorrect: false },
        { id: "c", text: "Supervised learning only works with numerical data", isCorrect: false },
        { id: "d", text: "Unsupervised learning requires more computational power", isCorrect: false }
      ],
      randomizeOrder: true,
      showLetters: true
    },
    correctAnswers: ["a"],
    explanation: "The key distinction is that supervised learning algorithms learn from labeled training data (input-output pairs), while unsupervised learning algorithms find patterns in data without labeled examples.",
    points: 2,
    timeEstimate: 45
  },

  // Neural Networks - Advanced
  {
    title: "Backpropagation Algorithm",
    content: "Which of the following statements about the backpropagation algorithm are correct? (Select all that apply)",
    type: "MULTIPLE_SELECT",
    category: "Neural Networks",
    difficulty: "ADVANCED",
    tags: ["backpropagation", "neural-networks", "training"],
    options: {
      choices: [
        { id: "a", text: "It calculates gradients using the chain rule", isCorrect: true },
        { id: "b", text: "It propagates errors backward through the network", isCorrect: true },
        { id: "c", text: "It only works with sigmoid activation functions", isCorrect: false },
        { id: "d", text: "It updates weights to minimize the loss function", isCorrect: true },
        { id: "e", text: "It requires the loss function to be differentiable", isCorrect: true }
      ],
      randomizeOrder: true,
      minSelections: 2,
      maxSelections: 5,
      partialCredit: true
    },
    correctAnswers: ["a", "b", "d", "e"],
    explanation: "Backpropagation uses the chain rule to calculate gradients, propagates errors backward, updates weights to minimize loss, and requires differentiable loss functions. It works with various activation functions, not just sigmoid.",
    points: 3,
    timeEstimate: 90
  },

  // Deep Learning - Expert
  {
    title: "Transformer Architecture Implementation",
    content: "Implement a simplified attention mechanism function in Python. The function should take query, key, and value matrices and return the attention output.\n\nRequirements:\n- Use dot-product attention\n- Apply softmax normalization\n- Scale by sqrt(d_k) where d_k is the dimension of keys\n- Handle batch dimensions",
    type: "CODING_CHALLENGE",
    category: "Deep Learning",
    difficulty: "EXPERT",
    tags: ["transformers", "attention", "implementation", "python"],
    options: {
      language: "python",
      starterCode: `import numpy as np\n\ndef attention(query, key, value):\n    \"\"\"\n    Compute scaled dot-product attention.\n    \n    Args:\n        query: Query matrix of shape (batch_size, seq_len, d_k)\n        key: Key matrix of shape (batch_size, seq_len, d_k)\n        value: Value matrix of shape (batch_size, seq_len, d_v)\n    \n    Returns:\n        Attention output of shape (batch_size, seq_len, d_v)\n    \"\"\"\n    # Your implementation here\n    pass`,
      solution: `import numpy as np\n\ndef attention(query, key, value):\n    \"\"\"\n    Compute scaled dot-product attention.\n    \n    Args:\n        query: Query matrix of shape (batch_size, seq_len, d_k)\n        key: Key matrix of shape (batch_size, seq_len, d_k)\n        value: Value matrix of shape (batch_size, seq_len, d_v)\n    \n    Returns:\n        Attention output of shape (batch_size, seq_len, d_v)\n    \"\"\"\n    d_k = query.shape[-1]\n    \n    # Compute attention scores\n    scores = np.matmul(query, key.transpose(0, 2, 1)) / np.sqrt(d_k)\n    \n    # Apply softmax\n    attention_weights = np.exp(scores) / np.sum(np.exp(scores), axis=-1, keepdims=True)\n    \n    # Apply attention weights to values\n    output = np.matmul(attention_weights, value)\n    \n    return output`,
      testCases: [
        {
          input: "query = np.random.randn(2, 4, 8)\nkey = np.random.randn(2, 4, 8)\nvalue = np.random.randn(2, 4, 16)\nresult = attention(query, key, value)",
          expectedOutput: "result.shape == (2, 4, 16)",
          isHidden: false,
          points: 2
        },
        {
          input: "query = np.ones((1, 3, 4))\nkey = np.ones((1, 3, 4))\nvalue = np.array([[[1, 2], [3, 4], [5, 6]]])\nresult = attention(query, key, value)",
          expectedOutput: "np.allclose(result, np.array([[[3, 4], [3, 4], [3, 4]]]))",
          isHidden: true,
          points: 3
        }
      ],
      timeLimit: 900,
      memoryLimit: 128,
      executionEnvironment: "sandbox"
    },
    correctAnswers: ["solution"],
    explanation: "The attention mechanism computes a weighted sum of values, where weights are determined by the compatibility between queries and keys. The scaling factor sqrt(d_k) prevents the dot products from becoming too large.",
    points: 5,
    timeEstimate: 900
  },

  // Data Science - Beginner
  {
    title: "Data Types in Python",
    content: "Which Python data type would be most appropriate for storing a collection of unique user IDs?",
    type: "MULTIPLE_CHOICE",
    category: "Data Science Fundamentals",
    difficulty: "BEGINNER",
    tags: ["python", "data-types", "collections"],
    options: {
      choices: [
        { id: "a", text: "list", isCorrect: false },
        { id: "b", text: "tuple", isCorrect: false },
        { id: "c", text: "set", isCorrect: true },
        { id: "d", text: "dict", isCorrect: false }
      ],
      randomizeOrder: true,
      showLetters: true
    },
    correctAnswers: ["c"],
    explanation: "A set is the most appropriate data type for storing unique values because it automatically prevents duplicates and provides O(1) average-case lookup time.",
    points: 1,
    timeEstimate: 30
  },

  // Statistics - Intermediate
  {
    title: "Central Limit Theorem",
    content: "Fill in the blanks: According to the Central Limit Theorem, as the sample size increases, the distribution of sample {blank1} approaches a {blank2} distribution, regardless of the shape of the {blank3} population distribution.",
    type: "FILL_IN_BLANK",
    category: "Statistics",
    difficulty: "INTERMEDIATE",
    tags: ["central-limit-theorem", "sampling", "statistics"],
    options: {
      blanks: [
        {
          id: "blank1",
          position: 0,
          acceptedAnswers: ["means", "mean", "averages", "average"],
          caseSensitive: false,
          exactMatch: false
        },
        {
          id: "blank2",
          position: 1,
          acceptedAnswers: ["normal", "gaussian"],
          caseSensitive: false,
          exactMatch: false
        },
        {
          id: "blank3",
          position: 2,
          acceptedAnswers: ["original", "underlying"],
          caseSensitive: false,
          exactMatch: false
        }
      ],
      template: "According to the Central Limit Theorem, as the sample size increases, the distribution of sample {blank1} approaches a {blank2} distribution, regardless of the shape of the {blank3} population distribution.",
      showBlanksInOrder: true
    },
    correctAnswers: ["means", "normal", "original"],
    explanation: "The Central Limit Theorem states that sample means from any population will be approximately normally distributed when the sample size is sufficiently large, typically n ≥ 30.",
    points: 2,
    timeEstimate: 60
  },

  // Ethics in AI - Advanced
  {
    title: "Algorithmic Bias Scenarios",
    content: "Analyze the following scenario and explain the potential sources of bias and how they might be mitigated:\n\nA hiring algorithm trained on historical company data consistently ranks male candidates higher than equally qualified female candidates for technical positions. The company's historical hiring data shows that 80% of technical hires over the past 10 years were male.\n\nDiscuss:\n1. What type of bias is present?\n2. How did this bias likely originate?\n3. What steps could be taken to mitigate this bias?\n4. What are the ethical implications of continuing to use this algorithm?",
    type: "ESSAY",
    category: "AI Ethics",
    difficulty: "ADVANCED",
    tags: ["bias", "ethics", "fairness", "hiring"],
    options: {
      wordLimit: {
        min: 300,
        max: 800
      },
      timeLimit: 1800,
      rubric: {
        criteria: [
          {
            name: "Bias Identification",
            description: "Correctly identifies the type and nature of bias",
            maxPoints: 25,
            levels: [
              { score: 25, description: "Clearly identifies historical/systemic bias and its manifestation" },
              { score: 20, description: "Identifies bias but with minor gaps in understanding" },
              { score: 15, description: "Basic identification of bias" },
              { score: 5, description: "Minimal or incorrect bias identification" }
            ]
          },
          {
            name: "Root Cause Analysis",
            description: "Explains how the bias originated",
            maxPoints: 25,
            levels: [
              { score: 25, description: "Comprehensive understanding of historical data bias propagation" },
              { score: 20, description: "Good explanation with minor omissions" },
              { score: 15, description: "Basic understanding of bias origins" },
              { score: 5, description: "Poor or incorrect explanation" }
            ]
          },
          {
            name: "Mitigation Strategies",
            description: "Proposes effective bias mitigation approaches",
            maxPoints: 25,
            levels: [
              { score: 25, description: "Multiple practical, well-reasoned mitigation strategies" },
              { score: 20, description: "Several good strategies with minor limitations" },
              { score: 15, description: "Basic mitigation ideas" },
              { score: 5, description: "Few or impractical suggestions" }
            ]
          },
          {
            name: "Ethical Analysis",
            description: "Discusses ethical implications thoughtfully",
            maxPoints: 25,
            levels: [
              { score: 25, description: "Sophisticated ethical analysis considering multiple perspectives" },
              { score: 20, description: "Good ethical reasoning with some depth" },
              { score: 15, description: "Basic ethical considerations" },
              { score: 5, description: "Minimal ethical analysis" }
            ]
          }
        ]
      },
      keyPoints: [
        "Historical bias in training data",
        "Systemic discrimination perpetuation",
        "Data preprocessing and augmentation",
        "Fairness constraints in algorithms",
        "Regular bias auditing",
        "Diverse hiring practices",
        "Legal and ethical compliance"
      ]
    },
    correctAnswers: ["essay"],
    explanation: "This scenario demonstrates how historical bias in training data can perpetuate discrimination. Effective mitigation requires addressing data bias, implementing fairness constraints, and regular auditing of algorithmic decisions.",
    points: 4,
    timeEstimate: 1800
  },

  // True/False Questions
  {
    title: "Overfitting Definition",
    content: "True or False: Overfitting occurs when a machine learning model performs well on training data but poorly on new, unseen data.",
    type: "TRUE_FALSE",
    category: "Machine Learning",
    difficulty: "BEGINNER",
    tags: ["overfitting", "generalization", "model-performance"],
    options: {
      correctAnswer: true,
      explanation: "This is the classic definition of overfitting - the model memorizes the training data but fails to generalize to new examples."
    },
    correctAnswers: ["true"],
    explanation: "Overfitting is indeed characterized by high performance on training data but poor performance on validation/test data, indicating the model has not learned to generalize.",
    points: 1,
    timeEstimate: 20
  }
]

async function seedQuestions() {
  try {
    console.log('🌱 Starting question bank seeding...')

    // First, check if we have any qualifications to attach questions to
    const qualifications = await prisma.qualification.findMany({
      select: { id: true, title: true, category: true }
    })

    if (qualifications.length === 0) {
      console.log('❌ No qualifications found. Please seed qualifications first.')
      return
    }

    console.log(`📚 Found ${qualifications.length} qualifications`)

    // Map categories to qualifications
    const categoryMapping: Record<string, string> = {}
    
    // Try to match question categories with qualification categories
    for (const qual of qualifications) {
      const qualCategory = qual.category.toString()
      
      if (qualCategory.includes('ARTIFICIAL_INTELLIGENCE') || qualCategory.includes('MACHINE_LEARNING')) {
        categoryMapping['AI Fundamentals'] = qual.id
        categoryMapping['Machine Learning'] = qual.id
        categoryMapping['Neural Networks'] = qual.id
        categoryMapping['Deep Learning'] = qual.id
        categoryMapping['AI Ethics'] = qual.id
      }
      
      if (qualCategory.includes('DATA_SCIENCE')) {
        categoryMapping['Data Science Fundamentals'] = qual.id
        categoryMapping['Statistics'] = qual.id
      }
    }

    // If no specific matches, use the first qualification for all questions
    if (Object.keys(categoryMapping).length === 0) {
      const defaultQualId = qualifications[0].id
      questionSamples.forEach(q => {
        categoryMapping[q.category] = defaultQualId
      })
    }

    let createdCount = 0
    let skippedCount = 0

    for (const questionSample of questionSamples) {
      const qualificationId = categoryMapping[questionSample.category]
      
      if (!qualificationId) {
        console.log(`⚠️  No qualification found for category: ${questionSample.category}`)
        skippedCount++
        continue
      }

      // Check if question already exists
      const existingQuestion = await prisma.question.findFirst({
        where: {
          title: questionSample.title,
          qualificationId
        }
      })

      if (existingQuestion) {
        console.log(`⏭️  Question already exists: ${questionSample.title}`)
        skippedCount++
        continue
      }

      try {
        const question = await prisma.question.create({
          data: {
            qualificationId,
            title: questionSample.title,
            content: questionSample.content,
            explanation: questionSample.explanation,
            type: questionSample.type as any,
            category: questionSample.category,
            difficulty: questionSample.difficulty as any,
            tags: questionSample.tags,
            options: questionSample.options,
            correctAnswers: questionSample.correctAnswers,
            points: questionSample.points,
            timeEstimate: questionSample.timeEstimate,
            isActive: true
          }
        })
        
        console.log(`✅ Created question: ${question.title}`)
        createdCount++

        // Add some sample analytics data to demonstrate the system
        if (Math.random() > 0.5) {
          const usageCount = Math.floor(Math.random() * 50) + 5
          const correctCount = Math.floor(usageCount * (0.3 + Math.random() * 0.5)) // 30-80% success rate
          const avgTime = questionSample.timeEstimate ? questionSample.timeEstimate * (0.8 + Math.random() * 0.4) : null

          await prisma.question.update({
            where: { id: question.id },
            data: {
              timesUsed: usageCount,
              timesCorrect: correctCount,
              averageTime: avgTime
            }
          })
        }

      } catch (error) {
        console.error(`❌ Error creating question "${questionSample.title}":`, error)
        skippedCount++
      }
    }

    console.log(`\n🎉 Question seeding completed!`)
    console.log(`✅ Created: ${createdCount} questions`)
    console.log(`⏭️  Skipped: ${skippedCount} questions`)
    
    // Display summary by category
    const questionCounts = await prisma.question.groupBy({
      by: ['category', 'difficulty'],
      _count: { id: true }
    })

    console.log(`\n📊 Question Distribution:`)
    questionCounts.forEach((group: any) => {
      console.log(`   ${group.category} (${group.difficulty}): ${group._count.id} questions`)
    })

  } catch (error) {
    console.error('❌ Error seeding questions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
if (require.main === module) {
  seedQuestions()
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

export { seedQuestions }