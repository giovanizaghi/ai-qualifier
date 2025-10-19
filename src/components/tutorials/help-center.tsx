'use client';

import { useState } from 'react';
import { Book, Play, CheckCircle, Clock, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tutorial } from './tutorial-provider';
import { cn } from '@/lib/utils';

interface HelpCenterProps {
  tutorials: Tutorial[];
  onStartTutorial: (tutorialId: string) => void;
  completedTutorials?: Set<string>;
  className?: string;
}

interface TutorialCardProps {
  tutorial: Tutorial;
  isCompleted?: boolean;
  onStart: (tutorialId: string) => void;
}

function TutorialCard({ tutorial, isCompleted = false, onStart }: TutorialCardProps) {
  const estimatedTime = tutorial.steps.length * 30; // 30 seconds per step estimate
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{tutorial.title}</h3>
              {isCompleted && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {tutorial.description}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {tutorial.category}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>~{Math.ceil(estimatedTime / 60)} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{tutorial.steps.length} steps</span>
          </div>
        </div>
        
        <Button
          onClick={() => onStart(tutorial.id)}
          className="w-full gap-2"
          variant={isCompleted ? "outline" : "default"}
        >
          <Play className="h-4 w-4" />
          {isCompleted ? 'Replay Tutorial' : 'Start Tutorial'}
        </Button>
      </div>
    </Card>
  );
}

export function HelpCenter({ 
  tutorials, 
  onStartTutorial, 
  completedTutorials = new Set(),
  className 
}: HelpCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = ['all', ...Array.from(new Set(tutorials.map(t => t.category)))];
  
  const filteredTutorials = tutorials.filter(tutorial => 
    selectedCategory === 'all' || tutorial.category === selectedCategory
  );

  const completedCount = tutorials.filter(t => completedTutorials.has(t.id)).length;
  const progressPercentage = (completedCount / tutorials.length) * 100;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Book className="h-6 w-6" />
              Help Center
            </h2>
            <p className="text-muted-foreground">
              Learn how to use the AI Qualifier platform with interactive tutorials
            </p>
          </div>
          
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">{completedCount}/{tutorials.length}</span>
            </div>
            <div className="w-32 bg-muted rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category === 'all' ? 'All Tutorials' : category}
          </Button>
        ))}
      </div>

      {/* Tutorial Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTutorials.map((tutorial) => (
          <TutorialCard
            key={tutorial.id}
            tutorial={tutorial}
            isCompleted={completedTutorials.has(tutorial.id)}
            onStart={onStartTutorial}
          />
        ))}
      </div>

      {/* Quick Help Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Book className="h-4 w-4" />
            Quick Help & FAQs
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Help & Frequently Asked Questions</DialogTitle>
            <DialogDescription>
              Find answers to common questions about using the AI Qualifier platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Getting Started</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">How do I take a qualification assessment?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Navigate to the qualifications page, browse or search for a qualification, 
                    and click "Start Assessment" to begin.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Can I retake assessments?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Most qualifications allow retakes. Check the qualification details to see 
                    the retake policy and any cooldown periods.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">How is my score calculated?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scores are calculated based on correct answers, with some qualifications 
                    considering factors like time taken and question difficulty.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Account & Progress</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">How do I track my progress?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visit your dashboard to see qualification progress, completed assessments, 
                    and personalized recommendations.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">What are bookmarks?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bookmark qualifications you're interested in to easily find them later 
                    in your profile.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">How do I share my achievements?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the share button on qualification results or your profile to share 
                    achievements on social media or copy shareable links.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Technical Support</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">What browsers are supported?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    We support all modern browsers including Chrome, Firefox, Safari, and Edge.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">My assessment got disconnected</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your progress is automatically saved. Simply return to the assessment 
                    to continue where you left off.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Need more help?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact our support team through the feedback form or email us at 
                    support@aiqualifier.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}