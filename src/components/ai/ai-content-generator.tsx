'use client';

import { Loader2, Sparkles, Brain, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AIGeneratedQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  topics: string[];
  estimatedTime: number;
  points: number;
}

interface AIContentGeneratorProps {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  onQuestionsGenerated?: (questions: AIGeneratedQuestion[]) => void;
  onContentGenerated?: (content: string) => void;
}

export function AIContentGenerator({ 
  topic, 
  difficulty, 
  onQuestionsGenerated, 
  onContentGenerated 
}: AIContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<string>('');

  const generateQuestions = async (count: number = 5) => {
    if (!topic) {
      toast.error("Please select a topic before generating questions.");
      return;
    }

    setIsGenerating(true);
    setGenerationType('questions');
    
    try {
      const response = await fetch('/api/ai/content?action=generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          difficulty,
          count,
          questionTypes: ['multiple-choice', 'true-false', 'short-answer']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        onQuestionsGenerated?.(result.data);
        toast.success(`Generated ${result.data.length} questions for ${topic}`);
      } else {
        throw new Error(result.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationType('');
    }
  };

  const generateLearningContent = async (contentType: 'explanation' | 'tutorial' | 'summary' | 'example') => {
    if (!topic) {
      toast.error("Please select a topic before generating content.");
      return;
    }

    setIsGenerating(true);
    setGenerationType('content');
    
    try {
      const response = await fetch('/api/ai/content?action=generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          difficulty: difficulty === 'expert' ? 'advanced' : difficulty,
          contentType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const result = await response.json();
      
      if (result.success && result.data?.content) {
        onContentGenerated?.(result.data.content);
        toast.success(`Generated ${contentType} for ${topic}`);
      } else {
        throw new Error(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error("Failed to generate learning content. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationType('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          AI Content Generator
        </CardTitle>
        <CardDescription>
          Generate AI-powered questions and learning content for {topic || 'selected topic'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Context */}
        <div className="flex gap-2">
          <Badge variant="secondary">{topic || 'No topic'}</Badge>
          <Badge variant="outline">{difficulty}</Badge>
        </div>

        {/* Question Generation */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Generate Questions
          </h4>
          <div className="flex gap-2">
            <Button
              onClick={() => generateQuestions(3)}
              disabled={isGenerating || !topic}
              size="sm"
              variant="outline"
            >
              {isGenerating && generationType === 'questions' && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              3 Questions
            </Button>
            <Button
              onClick={() => generateQuestions(5)}
              disabled={isGenerating || !topic}
              size="sm"
              variant="outline"
            >
              {isGenerating && generationType === 'questions' && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              5 Questions
            </Button>
            <Button
              onClick={() => generateQuestions(10)}
              disabled={isGenerating || !topic}
              size="sm"
              variant="outline"
            >
              {isGenerating && generationType === 'questions' && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              10 Questions
            </Button>
          </div>
        </div>

        {/* Content Generation */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Generate Learning Content
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => generateLearningContent('explanation')}
              disabled={isGenerating || !topic}
              size="sm"
              variant="outline"
            >
              {isGenerating && generationType === 'content' && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Explanation
            </Button>
            <Button
              onClick={() => generateLearningContent('tutorial')}
              disabled={isGenerating || !topic}
              size="sm"
              variant="outline"
            >
              Tutorial
            </Button>
            <Button
              onClick={() => generateLearningContent('summary')}
              disabled={isGenerating || !topic}
              size="sm"
              variant="outline"
            >
              Summary
            </Button>
            <Button
              onClick={() => generateLearningContent('example')}
              disabled={isGenerating || !topic}
              size="sm"
              variant="outline"
            >
              Examples
            </Button>
          </div>
        </div>

        {/* Status */}
        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating {generationType}... This may take a moment.
          </div>
        )}
      </CardContent>
    </Card>
  );
}