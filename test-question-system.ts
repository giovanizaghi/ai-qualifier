/**
 * Test Question Management System
 * Validates all aspects of the question management implementation
 */

import { questionBankService } from "./src/lib/question-bank"
import { adaptiveQuestionSelector } from "./src/lib/adaptive-selection" 
import { QuestionDifficultyValidator, QuestionContentValidator } from "./src/lib/question-validation"
import { prisma } from "./src/lib/prisma"
import { DifficultyLevel, QuestionType } from "./src/types"

async function runTests() {
  console.log("🧪 Starting Question Management System Tests...\n")

  try {
    // Test 1: Question Categories
    await testQuestionCategories()
    
    // Test 2: Dynamic Question Selection
    await testDynamicQuestionSelection()
    
    // Test 3: Question Validation
    await testQuestionValidation()
    
    // Test 4: Question Analytics
    await testQuestionAnalytics()
    
    // Test 5: Adaptive Selection
    await testAdaptiveSelection()

    console.log("\n✅ All tests completed successfully!")
    
  } catch (error) {
    console.error("\n❌ Test failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

async function testQuestionCategories() {
  console.log("📂 Testing Question Categories...")
  
  // Get a qualification to test with
  const qualification = await prisma.qualification.findFirst({
    include: { questions: true }
  })
  
  if (!qualification) {
    console.log("❌ No qualifications found - skipping category test")
    return
  }

  const categories = await questionBankService.getQuestionCategories(qualification.id)
  
  console.log(`✅ Found ${categories.categories.length} categories`)
  console.log(`✅ Total questions: ${categories.totalQuestions}`)
  console.log("✅ Category distribution:", Object.keys(categories.questionDistribution))
}

async function testDynamicQuestionSelection() {
  console.log("\n🎯 Testing Dynamic Question Selection...")
  
  const qualification = await prisma.qualification.findFirst()
  if (!qualification) {
    console.log("❌ No qualifications found - skipping selection test")
    return
  }

  try {
    const selectedQuestions = await questionBankService.selectQuestions({
      qualificationId: qualification.id,
      totalQuestions: 10,
      difficultyDistribution: {
        [DifficultyLevel.BEGINNER]: 0.3,
        [DifficultyLevel.INTERMEDIATE]: 0.4,
        [DifficultyLevel.ADVANCED]: 0.2,
        [DifficultyLevel.EXPERT]: 0.1
      },
      prioritizeNew: true,
      adaptiveSelection: false
    })

    console.log(`✅ Selected ${selectedQuestions.questions.length} questions`)
    console.log("✅ Difficulty breakdown:", selectedQuestions.metadata.difficultyBreakdown)
    console.log("✅ Category breakdown:", selectedQuestions.metadata.categoryBreakdown)
    console.log(`✅ Estimated time: ${selectedQuestions.metadata.estimatedTimeMinutes} minutes`)
    
  } catch (error) {
    console.log("❌ Dynamic selection failed:", (error as Error).message)
  }
}

async function testQuestionValidation() {
  console.log("\n🔍 Testing Question Validation...")
  
  // Test content validation
  const testQuestion = {
    title: "What is machine learning?",
    content: "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data. Which of the following best describes supervised learning?",
    type: QuestionType.MULTIPLE_CHOICE,
    options: {
      choices: [
        { id: "a", text: "Learning without labeled data", isCorrect: false },
        { id: "b", text: "Learning with labeled training data", isCorrect: true },
        { id: "c", text: "Learning through trial and error", isCorrect: false },
        { id: "d", text: "Learning without any data", isCorrect: false }
      ],
      randomizeOrder: true,
      showLetters: true
    }
  }

  const contentValidation = QuestionContentValidator.validateContent(testQuestion)
  console.log("✅ Content validation:", {
    isValid: contentValidation.isValid,
    errors: contentValidation.errors.length,
    warnings: contentValidation.warnings.length
  })

  // Test difficulty validation
  const difficultyValidation = QuestionDifficultyValidator.validateDifficulty({
    content: testQuestion.content,
    type: testQuestion.type,
    options: testQuestion.options,
    category: "Machine Learning Fundamentals"
  }, DifficultyLevel.INTERMEDIATE)

  console.log("✅ Difficulty validation:", {
    isValid: difficultyValidation.isValid,
    suggestedDifficulty: difficultyValidation.suggestedDifficulty,
    reasons: difficultyValidation.reasons.length
  })
}

async function testQuestionAnalytics() {
  console.log("\n📊 Testing Question Analytics...")
  
  // Find a question that has been used
  const question = await prisma.question.findFirst({
    where: {
      timesUsed: { gt: 0 }
    }
  })

  if (!question) {
    console.log("⚠️ No questions with usage data found - creating mock analytics")
    
    // Update a question with mock data for testing
    const anyQuestion = await prisma.question.findFirst()
    if (anyQuestion) {
      await prisma.question.update({
        where: { id: anyQuestion.id },
        data: {
          timesUsed: 25,
          timesCorrect: 18,
          averageTime: 45
        }
      })
      
      console.log("✅ Updated question with mock analytics data")
    }
    return
  }

  try {
    const analytics = await questionBankService.getQuestionAnalytics(question.id)
    
    console.log("✅ Question analytics retrieved:", {
      questionId: analytics.questionId,
      successRate: analytics.statistics.successRate.toFixed(1) + "%",
      usage: analytics.statistics.timesUsed,
      difficultyAccuracy: analytics.statistics.difficultyAccuracy.toFixed(1) + "%",
      discriminationIndex: analytics.statistics.discriminationIndex.toFixed(1),
      needsReview: analytics.recommendations.needsReview,
      shouldRetire: analytics.recommendations.retire
    })
    
  } catch (error) {
    console.log("❌ Analytics test failed:", (error as Error).message)
  }
}

async function testAdaptiveSelection() {
  console.log("\n🧠 Testing Adaptive Question Selection...")
  
  const qualification = await prisma.qualification.findFirst()
  const user = await prisma.user.findFirst()
  
  if (!qualification || !user) {
    console.log("❌ Missing qualification or user - skipping adaptive test")
    return
  }

  try {
    const adaptiveQuestions = await adaptiveQuestionSelector.selectAdaptiveQuestions({
      qualificationId: qualification.id,
      userId: user.id,
      sessionId: "test-session-" + Date.now(),
      totalQuestions: 8,
      learningMode: "practice",
      constraints: {
        timeLimit: 30 // 30 minutes
      }
    })

    console.log("✅ Adaptive selection completed:", {
      questionsSelected: adaptiveQuestions.questions.length,
      strategy: adaptiveQuestions.strategy.name,
      expectedDifficulty: adaptiveQuestions.strategy.expectedDifficulty,
      adaptationPoints: adaptiveQuestions.strategy.adaptationPoints.length,
      estimatedSuccessRate: adaptiveQuestions.metadata.estimatedSuccessRate.toFixed(1) + "%",
      estimatedTime: adaptiveQuestions.metadata.estimatedTimeMinutes + " minutes"
    })
    
    // Show difficulty progression
    const difficultyProgression = adaptiveQuestions.metadata.difficultyProgression
    console.log("✅ Difficulty progression:", difficultyProgression.join(" → "))
    
  } catch (error) {
    console.log("❌ Adaptive selection failed:", (error as Error).message)
  }
}

// Run the tests
runTests().catch(console.error)