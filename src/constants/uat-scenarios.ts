// UAT Scenarios for AI Qualifier Application
// These scenarios correspond to the test cases in UAT-Scenarios.md

export interface UATTask {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  expectedOutcome: string;
  estimatedTime: number; // in minutes
  acceptanceCriteria: string[];
}

export interface UATScenario {
  id: string;
  title: string;
  description: string;
  persona: string;
  businessGoal: string;
  userStory: string;
  estimatedDuration: number; // in minutes
  tasks: UATTask[];
  successMetrics: {
    completionRate: number;
    timeTarget: number;
    satisfactionTarget: number;
    errorRateTarget: number;
  };
}

export const UAT_SCENARIOS: UATScenario[] = [
  {
    id: 'new-user-onboarding',
    title: 'New User Onboarding',
    description: 'Complete registration and first-time user experience',
    persona: 'Alex Chen - New User (Beginner)',
    businessGoal: 'Seamless first-time user experience',
    userStory: 'As a new user, I want to easily register and understand how the platform works so that I can start my AI qualification journey.',
    estimatedDuration: 15,
    tasks: [
      {
        id: 'visit-homepage',
        title: 'Visit Homepage',
        description: 'Navigate to the AI Qualifier homepage without authentication',
        instructions: [
          'Open a new browser tab',
          'Navigate to the AI Qualifier homepage',
          'Observe the initial layout and call-to-action elements',
          'Note any first impressions or confusion points'
        ],
        expectedOutcome: 'User should see a clear, welcoming homepage with obvious next steps for getting started',
        estimatedTime: 2,
        acceptanceCriteria: [
          'Homepage loads within 3 seconds',
          'Primary CTA is clearly visible',
          'Value proposition is clear',
          'Navigation is intuitive'
        ]
      },
      {
        id: 'start-registration',
        title: 'Start Registration Process',
        description: 'Click the main CTA to begin registration',
        instructions: [
          'Locate the primary "Get Started" or "Sign Up" button',
          'Click the button to begin registration',
          'Observe the registration form presentation',
          'Note any initial barriers or friction points'
        ],
        expectedOutcome: 'Registration form should be simple, clear, and not overwhelming',
        estimatedTime: 2,
        acceptanceCriteria: [
          'Registration form loads quickly',
          'Required fields are clearly marked',
          'Form is mobile-friendly',
          'Social login options are available'
        ]
      },
      {
        id: 'complete-registration',
        title: 'Complete Registration Form',
        description: 'Fill out and submit the registration form',
        instructions: [
          'Fill in all required registration fields',
          'Use a test email address',
          'Create a secure password',
          'Accept terms and conditions',
          'Submit the registration form'
        ],
        expectedOutcome: 'Registration should complete successfully with clear next steps',
        estimatedTime: 3,
        acceptanceCriteria: [
          'Form validation works properly',
          'Error messages are helpful',
          'Success confirmation is clear',
          'Process takes under 2 minutes'
        ]
      },
      {
        id: 'email-verification',
        title: 'Verify Email Address',
        description: 'Complete email verification process',
        instructions: [
          'Check for verification email (simulate)',
          'Click verification link',
          'Confirm email verification success',
          'Return to platform'
        ],
        expectedOutcome: 'Email verification should be straightforward and quick',
        estimatedTime: 2,
        acceptanceCriteria: [
          'Verification email arrives quickly',
          'Link works on first click',
          'Success message is clear',
          'User is directed back to platform'
        ]
      },
      {
        id: 'profile-setup',
        title: 'Complete Profile Setup',
        description: 'Fill out initial profile information',
        instructions: [
          'Complete required profile fields',
          'Set preferences and interests',
          'Upload profile picture (optional)',
          'Save profile information'
        ],
        expectedOutcome: 'Profile setup should be intuitive with clear benefits explained',
        estimatedTime: 3,
        acceptanceCriteria: [
          'Profile fields are relevant',
          'Progress is clearly shown',
          'Benefits are explained',
          'Can skip optional fields'
        ]
      },
      {
        id: 'guided-tour',
        title: 'Take Guided Tour',
        description: 'Complete the platform orientation tour',
        instructions: [
          'Start the guided tour',
          'Follow all tour steps',
          'Interact with highlighted features',
          'Complete tour successfully'
        ],
        expectedOutcome: 'Tour should provide clear understanding of platform features',
        estimatedTime: 5,
        acceptanceCriteria: [
          'Tour is engaging and informative',
          'Can skip or exit tour easily',
          'Key features are highlighted',
          'Tour completes without issues'
        ]
      }
    ],
    successMetrics: {
      completionRate: 0.90,
      timeTarget: 15,
      satisfactionTarget: 4.5,
      errorRateTarget: 0.02
    }
  },
  {
    id: 'qualification-assessment',
    title: 'Qualification Assessment Journey',
    description: 'Take a complete AI assessment and receive certification',
    persona: 'Sarah Johnson - Intermediate User',
    businessGoal: 'Effective skill assessment and certification',
    userStory: 'As an intermediate user, I want to take comprehensive AI assessments that accurately reflect my skills and provide meaningful certifications.',
    estimatedDuration: 25,
    tasks: [
      {
        id: 'login-dashboard',
        title: 'Login to Dashboard',
        description: 'Access the user dashboard',
        instructions: [
          'Navigate to login page',
          'Enter credentials',
          'Access main dashboard',
          'Verify dashboard loads correctly'
        ],
        expectedOutcome: 'Login should be quick and dashboard should load with relevant information',
        estimatedTime: 2,
        acceptanceCriteria: [
          'Login works on first attempt',
          'Dashboard loads within 3 seconds',
          'Personal information is displayed',
          'Available actions are clear'
        ]
      },
      {
        id: 'browse-qualifications',
        title: 'Browse Available Qualifications',
        description: 'Explore and select a qualification to pursue',
        instructions: [
          'Navigate to qualifications section',
          'Browse available categories',
          'Filter by difficulty/topic',
          'Select "Machine Learning Fundamentals"'
        ],
        expectedOutcome: 'Qualification browsing should be intuitive with clear information',
        estimatedTime: 3,
        acceptanceCriteria: [
          'Qualifications are well-organized',
          'Filtering works effectively',
          'Details are comprehensive',
          'Prerequisites are clear'
        ]
      },
      {
        id: 'assessment-details',
        title: 'Review Assessment Details',
        description: 'Understand assessment requirements and format',
        instructions: [
          'Read assessment overview',
          'Review time limits and format',
          'Check prerequisites',
          'Understand scoring criteria'
        ],
        expectedOutcome: 'Assessment details should be comprehensive and clear',
        estimatedTime: 3,
        acceptanceCriteria: [
          'All details are clearly presented',
          'Time requirements are realistic',
          'Format is well-explained',
          'Scoring is transparent'
        ]
      },
      {
        id: 'start-assessment',
        title: 'Start Timed Assessment',
        description: 'Begin the actual qualification assessment',
        instructions: [
          'Click "Start Assessment" button',
          'Confirm readiness',
          'Begin answering questions',
          'Monitor timer and progress'
        ],
        expectedOutcome: 'Assessment should start smoothly with clear interface',
        estimatedTime: 12,
        acceptanceCriteria: [
          'Assessment starts immediately',
          'Timer is clearly visible',
          'Questions are well-formatted',
          'Progress is tracked'
        ]
      },
      {
        id: 'complete-assessment',
        title: 'Complete and Submit Assessment',
        description: 'Finish all questions and submit assessment',
        instructions: [
          'Answer all required questions',
          'Review flagged questions',
          'Submit assessment',
          'Confirm submission'
        ],
        expectedOutcome: 'Assessment completion should be smooth with confirmation',
        estimatedTime: 3,
        acceptanceCriteria: [
          'Can review before submitting',
          'Submission works properly',
          'Confirmation is immediate',
          'No data loss occurs'
        ]
      },
      {
        id: 'view-results',
        title: 'Review Detailed Results',
        description: 'Access and understand assessment results',
        instructions: [
          'Navigate to results page',
          'Review overall score',
          'Check category breakdown',
          'Understand recommendations'
        ],
        expectedOutcome: 'Results should be detailed and actionable',
        estimatedTime: 2,
        acceptanceCriteria: [
          'Results are immediately available',
          'Breakdown is detailed',
          'Recommendations are helpful',
          'Pass/fail is clear'
        ]
      }
    ],
    successMetrics: {
      completionRate: 0.85,
      timeTarget: 25,
      satisfactionTarget: 4.3,
      errorRateTarget: 0.05
    }
  },
  {
    id: 'mobile-experience',
    title: 'Mobile Experience Validation',
    description: 'Complete assessment experience on mobile device',
    persona: 'Sarah Johnson (on mobile)',
    businessGoal: 'Seamless mobile assessment experience',
    userStory: 'As a busy professional, I want to take assessments on my mobile device during commutes and breaks.',
    estimatedDuration: 20,
    tasks: [
      {
        id: 'mobile-access',
        title: 'Access Platform on Mobile',
        description: 'Navigate to platform using mobile browser',
        instructions: [
          'Open mobile browser',
          'Navigate to platform URL',
          'Test responsive design',
          'Verify all elements are accessible'
        ],
        expectedOutcome: 'Mobile interface should be fully functional and user-friendly',
        estimatedTime: 2,
        acceptanceCriteria: [
          'Page loads quickly on mobile',
          'Layout is responsive',
          'Touch targets are adequate',
          'Text is readable'
        ]
      },
      {
        id: 'mobile-login',
        title: 'Login on Mobile Device',
        description: 'Complete login process using mobile interface',
        instructions: [
          'Navigate to login page',
          'Enter credentials using mobile keyboard',
          'Submit login form',
          'Verify successful authentication'
        ],
        expectedOutcome: 'Login should work seamlessly on mobile',
        estimatedTime: 2,
        acceptanceCriteria: [
          'Mobile keyboard works properly',
          'Form validation is clear',
          'Login completes successfully',
          'Dashboard loads correctly'
        ]
      },
      {
        id: 'mobile-assessment',
        title: 'Start Assessment on Mobile',
        description: 'Begin taking an assessment using mobile interface',
        instructions: [
          'Navigate to assessments',
          'Select an assessment',
          'Start the assessment',
          'Answer several questions'
        ],
        expectedOutcome: 'Assessment should be fully functional on mobile',
        estimatedTime: 10,
        acceptanceCriteria: [
          'Touch interactions work smoothly',
          'Questions display properly',
          'Navigation is intuitive',
          'Timer functions correctly'
        ]
      },
      {
        id: 'mobile-interruption',
        title: 'Handle Mobile Interruption',
        description: 'Test assessment persistence during interruptions',
        instructions: [
          'Simulate phone call or notification',
          'Leave assessment temporarily',
          'Return to assessment',
          'Verify progress is maintained'
        ],
        expectedOutcome: 'Assessment should recover gracefully from interruptions',
        estimatedTime: 3,
        acceptanceCriteria: [
          'Progress is automatically saved',
          'Timer adjusts appropriately',
          'No data is lost',
          'User can continue seamlessly'
        ]
      },
      {
        id: 'mobile-completion',
        title: 'Complete Assessment on Mobile',
        description: 'Finish and submit assessment using mobile device',
        instructions: [
          'Complete remaining questions',
          'Review answers if possible',
          'Submit assessment',
          'View results on mobile'
        ],
        expectedOutcome: 'Assessment completion should work perfectly on mobile',
        estimatedTime: 3,
        acceptanceCriteria: [
          'Submission works reliably',
          'Results display properly',
          'Touch interactions are responsive',
          'Performance is acceptable'
        ]
      }
    ],
    successMetrics: {
      completionRate: 0.90,
      timeTarget: 20,
      satisfactionTarget: 4.2,
      errorRateTarget: 0.03
    }
  },
  {
    id: 'admin-dashboard',
    title: 'Administrator Dashboard Usage',
    description: 'Manage users and generate reports using admin tools',
    persona: 'Emma Wilson - Administrator',
    businessGoal: 'Efficient organizational management',
    userStory: 'As an administrator, I want comprehensive tools to manage users, track progress, and generate reports for my organization.',
    estimatedDuration: 30,
    tasks: [
      {
        id: 'admin-access',
        title: 'Access Admin Dashboard',
        description: 'Login and access administrative interface',
        instructions: [
          'Login with administrator credentials',
          'Navigate to admin dashboard',
          'Verify admin permissions',
          'Explore available admin tools'
        ],
        expectedOutcome: 'Admin dashboard should provide comprehensive management tools',
        estimatedTime: 3,
        acceptanceCriteria: [
          'Admin access works properly',
          'Dashboard is well-organized',
          'Permissions are correct',
          'Tools are clearly labeled'
        ]
      },
      {
        id: 'user-management',
        title: 'Manage User Accounts',
        description: 'Perform user management operations',
        instructions: [
          'View user list',
          'Search for specific users',
          'Edit user details',
          'Manage user permissions'
        ],
        expectedOutcome: 'User management should be efficient and intuitive',
        estimatedTime: 8,
        acceptanceCriteria: [
          'User search works quickly',
          'Bulk operations are available',
          'Changes save properly',
          'Audit trail is maintained'
        ]
      },
      {
        id: 'bulk-operations',
        title: 'Perform Bulk Operations',
        description: 'Import users and assign qualifications in bulk',
        instructions: [
          'Import user list via CSV',
          'Assign qualifications to user groups',
          'Configure bulk settings',
          'Verify bulk operations success'
        ],
        expectedOutcome: 'Bulk operations should handle large datasets efficiently',
        estimatedTime: 10,
        acceptanceCriteria: [
          'CSV import works reliably',
          'Large datasets are handled',
          'Progress is shown clearly',
          'Error handling is robust'
        ]
      },
      {
        id: 'generate-reports',
        title: 'Generate Comprehensive Reports',
        description: 'Create and export detailed analytics reports',
        instructions: [
          'Navigate to reporting section',
          'Select report parameters',
          'Generate comprehensive reports',
          'Export data in multiple formats'
        ],
        expectedOutcome: 'Reporting should provide detailed insights and export options',
        estimatedTime: 6,
        acceptanceCriteria: [
          'Reports generate quickly',
          'Data is accurate and detailed',
          'Multiple export formats work',
          'Scheduling options available'
        ]
      },
      {
        id: 'monitor-activity',
        title: 'Monitor Real-time Activity',
        description: 'Track ongoing user activity and system performance',
        instructions: [
          'View real-time activity dashboard',
          'Monitor ongoing assessments',
          'Check system performance metrics',
          'Review security logs'
        ],
        expectedOutcome: 'Real-time monitoring should provide actionable insights',
        estimatedTime: 3,
        acceptanceCriteria: [
          'Real-time data is accurate',
          'Performance metrics are helpful',
          'Security monitoring works',
          'Alerts function properly'
        ]
      }
    ],
    successMetrics: {
      completionRate: 0.95,
      timeTarget: 30,
      satisfactionTarget: 4.6,
      errorRateTarget: 0.01
    }
  }
];

// Helper functions for working with UAT scenarios
export const getScenarioById = (id: string): UATScenario | undefined => {
  return UAT_SCENARIOS.find(scenario => scenario.id === id);
};

export const getScenariosByPersona = (persona: string): UATScenario[] => {
  return UAT_SCENARIOS.filter(scenario => 
    scenario.persona.toLowerCase().includes(persona.toLowerCase())
  );
};

export const getTotalEstimatedTime = (scenarioId: string): number => {
  const scenario = getScenarioById(scenarioId);
  return scenario ? scenario.estimatedDuration : 0;
};

export const getTasksByScenario = (scenarioId: string): UATTask[] => {
  const scenario = getScenarioById(scenarioId);
  return scenario ? scenario.tasks : [];
};