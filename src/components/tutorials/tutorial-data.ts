'use client';

import { Tutorial } from './tutorial-provider';

// Pre-defined tutorials for the AI Qualifier platform
export const defaultTutorials: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of navigating the AI Qualifier platform',
    category: 'basics',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to AI Qualifier',
        content: 'Welcome! This tutorial will guide you through the essential features of the AI Qualifier platform. Let\'s start by exploring the main navigation.',
        position: 'center',
        canSkip: true
      },
      {
        id: 'navigation',
        title: 'Main Navigation',
        content: 'This is the main navigation bar. Use it to access different sections like Dashboard, Qualifications, and your Profile.',
        target: 'nav, header nav, [role="navigation"]',
        position: 'bottom'
      },
      {
        id: 'dashboard',
        title: 'Your Dashboard',
        content: 'The dashboard shows your progress, recent assessments, and personalized recommendations. This is your home base!',
        target: '[href="/dashboard"], [data-testid="dashboard-link"]',
        position: 'bottom'
      },
      {
        id: 'qualifications',
        title: 'Browse Qualifications',
        content: 'Here you can explore all available qualifications. Use filters to find qualifications that match your interests and skill level.',
        target: '[href*="qualification"], [data-testid="qualifications-link"]',
        position: 'bottom'
      },
      {
        id: 'profile',
        title: 'Your Profile',
        content: 'Access your profile to view achievements, bookmarked qualifications, and account settings.',
        target: '[href="/profile"], [data-testid="profile-link"], [aria-label*="profile"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'taking-assessment',
    title: 'Taking Your First Assessment',
    description: 'Learn how to start and complete qualification assessments',
    category: 'assessments',
    steps: [
      {
        id: 'find-qualification',
        title: 'Find a Qualification',
        content: 'Start by browsing or searching for a qualification that interests you. Look for the difficulty level that matches your current skills.',
        target: '[data-testid="qualification-card"], .qualification-card',
        position: 'top'
      },
      {
        id: 'qualification-details',
        title: 'Review Details',
        content: 'Read the qualification description, check the estimated duration, and review the learning objectives before starting.',
        target: '[data-testid="qualification-details"]',
        position: 'top'
      },
      {
        id: 'start-assessment',
        title: 'Start Assessment',
        content: 'Click "Start Assessment" when you\'re ready. Make sure you have enough time to complete it without interruption.',
        target: '[data-testid="start-assessment"], button:contains("Start Assessment")',
        position: 'top'
      },
      {
        id: 'question-interface',
        title: 'Question Interface',
        content: 'Each question shows your progress, remaining time, and navigation options. Read questions carefully before answering.',
        target: '[data-testid="question-card"], .question-container',
        position: 'top'
      },
      {
        id: 'bookmark-feature',
        title: 'Bookmark for Later',
        content: 'Found an interesting qualification? Use the bookmark button to save it to your profile for easy access later.',
        target: '[data-testid="bookmark-button"], .bookmark-button',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard Features',
    description: 'Explore your personalized dashboard and its features',
    category: 'dashboard',
    steps: [
      {
        id: 'progress-overview',
        title: 'Progress Overview',
        content: 'Your dashboard shows an overview of your learning progress across different qualification categories.',
        target: '[data-testid="progress-overview"], .progress-widget',
        position: 'bottom'
      },
      {
        id: 'recent-assessments',
        title: 'Recent Assessments',
        content: 'View your recently completed assessments, scores, and continue any assessments in progress.',
        target: '[data-testid="recent-assessments"], .assessment-history',
        position: 'top'
      },
      {
        id: 'recommendations',
        title: 'Personalized Recommendations',
        content: 'Based on your performance and interests, we recommend qualifications that will help advance your skills.',
        target: '[data-testid="recommendations"], .recommendations-widget',
        position: 'top'
      },
      {
        id: 'achievements',
        title: 'Achievements & Badges',
        content: 'Track your achievements and badges earned from completing qualifications and reaching milestones.',
        target: '[data-testid="achievements"], .achievements-widget',
        position: 'top'
      }
    ]
  },
  {
    id: 'search-and-filter',
    title: 'Search & Filter Features',
    description: 'Master the search and filtering system to find perfect qualifications',
    category: 'search',
    steps: [
      {
        id: 'search-bar',
        title: 'Search Bar',
        content: 'Use the search bar to find qualifications by name, description, or keywords. Try searching for topics you\'re interested in!',
        target: '[data-testid="search-input"], input[placeholder*="search"]',
        position: 'bottom'
      },
      {
        id: 'category-filter',
        title: 'Category Filters',
        content: 'Filter qualifications by category (AI, Machine Learning, etc.) to focus on specific technology areas.',
        target: '[data-testid="category-filter"], .category-filter',
        position: 'bottom'
      },
      {
        id: 'difficulty-filter',
        title: 'Difficulty Levels',
        content: 'Choose the difficulty level that matches your current skills: Beginner, Intermediate, Advanced, or Expert.',
        target: '[data-testid="difficulty-filter"], .difficulty-filter',
        position: 'bottom'
      },
      {
        id: 'duration-filter',
        title: 'Duration Filter',
        content: 'Filter by assessment duration to find qualifications that fit your available time.',
        target: '[data-testid="duration-filter"], .duration-filter',
        position: 'bottom'
      },
      {
        id: 'view-modes',
        title: 'View Modes',
        content: 'Switch between grid and list view to see qualifications in your preferred layout.',
        target: '[data-testid="view-toggle"], .view-mode-toggle',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'profile-management',
    title: 'Profile & Settings',
    description: 'Manage your profile, view bookmarks, and customize settings',
    category: 'profile',
    steps: [
      {
        id: 'profile-overview',
        title: 'Profile Overview',
        content: 'Your profile shows your qualifications, achievements, and progress summary. This is what others see when you share your profile.',
        target: '[data-testid="profile-overview"], .profile-header',
        position: 'bottom'
      },
      {
        id: 'bookmarks-section',
        title: 'Bookmarked Qualifications',
        content: 'View and manage qualifications you\'ve bookmarked. This makes it easy to return to qualifications you\'re interested in.',
        target: '[data-testid="bookmarks-section"], .bookmarks-list',
        position: 'top'
      },
      {
        id: 'settings-access',
        title: 'Account Settings',
        content: 'Update your personal information, notification preferences, and other account settings here.',
        target: '[data-testid="settings-link"], [href*="settings"]',
        position: 'bottom'
      },
      {
        id: 'share-profile',
        title: 'Share Your Achievements',
        content: 'Use the share button to showcase your qualifications and achievements on social media or professional networks.',
        target: '[data-testid="share-profile"], .share-button',
        position: 'bottom'
      }
    ]
  }
];

// Tutorial configurations for specific routes/contexts
export const tutorialConfigs = {
  '/': 'getting-started',
  '/dashboard': 'dashboard-overview',
  '/qualifications': 'search-and-filter',
  '/profile': 'profile-management',
  '/assessments': 'taking-assessment'
};

// Helper to get tutorial for current route
export function getTutorialForRoute(pathname: string): string | null {
  return tutorialConfigs[pathname as keyof typeof tutorialConfigs] || null;
}