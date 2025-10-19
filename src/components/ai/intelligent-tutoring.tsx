'use client';

import { Lightbulb, Brain, CheckCircle, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';


interface TutorHint {
  type: 'hint' | 'explanation' | 'example' | 'step-by-step';
  content: string;
  difficulty: 'basic' | 'detailed' | 'comprehensive';
  followUpQuestions?: string[];
}

interface IntelligentTutoringProps {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  userContext: {
    timeSpent: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    topics: string[];
    previousAttempts?: string[];
    knownWeaknesses?: string[];
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };
  onHintRequest?: (hint: TutorHint) => void;
  onExplanationRequest?: (explanation: TutorHint) => void;
}

export function IntelligentTutoring({ 
  question,
  userAnswer,
  correctAnswer,
  isCorrect,
  userContext,
  onHintRequest,
  onExplanationRequest
}: IntelligentTutoringProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHint, setCurrentHint] = useState<TutorHint | null>(null);
  const [hintLevel, setHintLevel] = useState<'subtle' | 'moderate' | 'explicit'>('moderate');
  const [showExplanation, setShowExplanation] = useState(false);

  // Auto-generate explanation if answer is incorrect
  useEffect(() => {
    if (!isCorrect && userAnswer && !showExplanation) {
      generateExplanation();
    }
  }, [isCorrect, userAnswer]);

  const generateHint = async (level: 'subtle' | 'moderate' | 'explicit' = hintLevel) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/tutoring?action=generate-hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userContext,
          hintLevel: level
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate hint');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentHint(result.data);
        onHintRequest?.(result.data);
        toast.success('Hint generated!');
      } else {
        throw new Error(result.error || 'Failed to generate hint');
      }
    } catch (error) {
      console.error('Error generating hint:', error);
      toast.error('Failed to generate hint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateExplanation = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/tutoring?action=generate-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          correctAnswer,
          userAnswer,
          isCorrect,
          context: {
            difficultyLevel: userContext.difficultyLevel,
            topics: userContext.topics,
            learningObjectives: [`Understanding ${userContext.topics[0] || 'the concept'}`],
            commonMisconceptions: userContext.knownWeaknesses
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate explanation');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setCurrentHint(result.data);
        setShowExplanation(true);
        onExplanationRequest?.(result.data);
        toast.success('Explanation generated!');
      } else {
        throw new Error(result.error || 'Failed to generate explanation');
      }
    } catch (error) {
      console.error('Error generating explanation:', error);
      toast.error('Failed to generate explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceIndicator = () => {
    const timeThreshold = userContext.difficultyLevel === 'beginner' ? 180 : 
                         userContext.difficultyLevel === 'intermediate' ? 120 : 90;
    
    if (isCorrect) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        message: userContext.timeSpent <= timeThreshold ? 'Excellent!' : 'Correct!'
      };
    } else {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        message: 'Needs improvement'
      };
    }
  };

  const performance = getPerformanceIndicator();
  const timeEfficiency = Math.max(0, 100 - (userContext.timeSpent / 300) * 100); // 5 min = 0%

  return (
    <div className="space-y-4">
      {/* Performance Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <performance.icon className={`h-4 w-4 ${performance.color}`} />
            Performance Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Answer Status</span>
            <Badge variant={isCorrect ? 'default' : 'destructive'}>
              {performance.message}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time Efficiency
              </span>
              <span className="text-sm font-medium">{Math.round(timeEfficiency)}%</span>
            </div>
            <Progress value={timeEfficiency} className="h-2" />
          </div>

          <div className="flex gap-2">
            <Badge variant="outline">{userContext.difficultyLevel}</Badge>
            {userContext.learningStyle && (
              <Badge variant="secondary">{userContext.learningStyle}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Tutoring Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Tutoring Assistant
          </CardTitle>
          <CardDescription>
            Get personalized hints and explanations based on your performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hint Generation */}
          {!isCorrect && !showExplanation && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Need a hint?
              </h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => generateHint('subtle')}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  Subtle Hint
                </Button>
                <Button
                  onClick={() => generateHint('moderate')}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  Moderate Hint
                </Button>
                <Button
                  onClick={() => generateHint('explicit')}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  Detailed Hint
                </Button>
              </div>
            </div>
          )}

          {/* Explanation Button */}
          <div className="space-y-3">
            <Button
              onClick={generateExplanation}
              disabled={isLoading}
              size="sm"
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Get Detailed Explanation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Hint/Explanation Display */}
      {currentHint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {currentHint.type === 'hint' ? (
                <Lightbulb className="h-4 w-4 text-yellow-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-blue-500" />
              )}
              {currentHint.type === 'hint' ? 'AI Hint' : 'AI Explanation'}
              <Badge variant="outline" className="ml-auto">
                {currentHint.difficulty}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed">{currentHint.content}</p>
            </div>
            
            {/* Follow-up Questions */}
            {currentHint.followUpQuestions && currentHint.followUpQuestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground">
                  Think about these questions:
                </h5>
                <ul className="space-y-1">
                  {currentHint.followUpQuestions.map((question, index) => (
                    <li key={index} className="text-xs text-muted-foreground">
                      • {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning Context */}
      {userContext.knownWeaknesses && userContext.knownWeaknesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {userContext.knownWeaknesses.map((weakness, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {weakness}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}