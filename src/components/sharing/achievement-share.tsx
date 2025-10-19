'use client';

import { Trophy, Star, Target, Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { CopyToClipboard } from './copy-to-clipboard';
import { SocialShare } from './social-share';

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  iconUrl?: string;
  category: string;
  value?: number;
  qualificationId?: string;
  earnedAt: Date;
}

interface QualificationResult {
  id: string;
  qualificationTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  passed: boolean;
  certificateId?: string;
}

interface AchievementShareProps {
  achievement: Achievement;
  userDisplayName?: string;
  className?: string;
}

interface ResultShareProps {
  result: QualificationResult;
  userDisplayName?: string;
  className?: string;
}

interface ProgressShareProps {
  qualificationTitle: string;
  completionPercentage: number;
  studyTimeMinutes: number;
  userDisplayName?: string;
  className?: string;
}

const getAchievementIcon = (type: string, category: string) => {
  if (type.includes('PERFECT_SCORE')) {return Star;}
  if (type.includes('COMPLETION')) {return Trophy;}
  if (type.includes('STREAK')) {return Target;}
  return Trophy;
};

export function AchievementShare({ achievement, userDisplayName = 'Someone', className }: AchievementShareProps) {
  const Icon = getAchievementIcon(achievement.type, achievement.category);
  
  const shareData = {
    title: `🏆 Achievement Unlocked: ${achievement.title}`,
    text: `${userDisplayName} just earned the "${achievement.title}" achievement on AI Qualifier! ${achievement.description}`,
    url: `${window.location.origin}/achievements/${achievement.id}`
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <Card className={cn("p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Icon className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-800">{achievement.title}</h3>
            <p className="text-yellow-700">{achievement.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-yellow-600">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {achievement.category}
          </Badge>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Earned {formatDate(achievement.earnedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-yellow-200">
          <SocialShare
            data={shareData}
            trigger={
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                Share Achievement
              </Button>
            }
          />
          <CopyToClipboard text={shareData.url} variant="outline" />
        </div>
      </div>
    </Card>
  );
}

export function ResultShare({ result, userDisplayName = 'Someone', className }: ResultShareProps) {
  const shareData = {
    title: `🎯 ${result.passed ? 'Passed' : 'Completed'}: ${result.qualificationTitle}`,
    text: `${userDisplayName} just ${result.passed ? 'passed' : 'completed'} the "${result.qualificationTitle}" qualification on AI Qualifier! Score: ${Math.round(result.score)}% (${result.correctAnswers}/${result.totalQuestions} correct)`,
    url: `${window.location.origin}/qualifications/${result.id}`
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getScoreColor = (score: number, passed: boolean) => {
    if (!passed) {return 'from-gray-50 to-gray-100 border-gray-200';}
    if (score >= 90) {return 'from-green-50 to-emerald-50 border-green-200';}
    if (score >= 80) {return 'from-blue-50 to-blue-100 border-blue-200';}
    return 'from-yellow-50 to-orange-50 border-yellow-200';
  };

  const getScoreTextColor = (score: number, passed: boolean) => {
    if (!passed) {return 'text-gray-700';}
    if (score >= 90) {return 'text-green-700';}
    if (score >= 80) {return 'text-blue-700';}
    return 'text-yellow-700';
  };

  return (
    <Card className={cn(
      "p-6 bg-gradient-to-br",
      getScoreColor(result.score, result.passed),
      className
    )}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-lg font-bold", getScoreTextColor(result.score, result.passed))}>
              {result.qualificationTitle}
            </h3>
            <Badge variant={result.passed ? "default" : "secondary"}>
              {result.passed ? 'Passed' : 'Completed'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={cn("text-center", getScoreTextColor(result.score, result.passed))}>
              <div className="font-bold text-2xl">{Math.round(result.score)}%</div>
              <div className="text-xs opacity-75">Score</div>
            </div>
            <div className={cn("text-center", getScoreTextColor(result.score, result.passed))}>
              <div className="font-bold text-2xl">{result.correctAnswers}</div>
              <div className="text-xs opacity-75">Correct</div>
            </div>
            <div className={cn("text-center", getScoreTextColor(result.score, result.passed))}>
              <div className="font-bold text-2xl">{result.totalQuestions}</div>
              <div className="text-xs opacity-75">Total</div>
            </div>
          </div>
        </div>

        <div className={cn("text-sm", getScoreTextColor(result.score, result.passed))}>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Completed {formatDate(result.completedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-current/20">
          <SocialShare
            data={shareData}
            trigger={
              <Button size="sm" variant={result.passed ? "default" : "outline"}>
                Share Result
              </Button>
            }
          />
          <CopyToClipboard text={shareData.url} variant="outline" />
        </div>
      </div>
    </Card>
  );
}

export function ProgressShare({ 
  qualificationTitle, 
  completionPercentage, 
  studyTimeMinutes, 
  userDisplayName = 'Someone',
  className 
}: ProgressShareProps) {
  const shareData = {
    title: `📚 Learning Progress: ${qualificationTitle}`,
    text: `${userDisplayName} is making great progress on "${qualificationTitle}" - ${Math.round(completionPercentage)}% complete with ${Math.round(studyTimeMinutes / 60)} hours of study time on AI Qualifier!`,
    url: `${window.location.origin}/dashboard`
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) {return 'from-green-50 to-emerald-50 border-green-200';}
    if (percentage >= 50) {return 'from-blue-50 to-blue-100 border-blue-200';}
    if (percentage >= 25) {return 'from-yellow-50 to-orange-50 border-yellow-200';}
    return 'from-gray-50 to-gray-100 border-gray-200';
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 75) {return 'text-green-700';}
    if (percentage >= 50) {return 'text-blue-700';}
    if (percentage >= 25) {return 'text-yellow-700';}
    return 'text-gray-700';
  };

  return (
    <Card className={cn(
      "p-6 bg-gradient-to-br",
      getProgressColor(completionPercentage),
      className
    )}>
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className={cn("text-lg font-bold", getProgressTextColor(completionPercentage))}>
            Learning Progress
          </h3>
          <p className={cn("text-sm", getProgressTextColor(completionPercentage))}>
            {qualificationTitle}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={getProgressTextColor(completionPercentage)}>Progress</span>
            <span className={cn("font-medium", getProgressTextColor(completionPercentage))}>
              {Math.round(completionPercentage)}%
            </span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-current opacity-60"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className={cn("text-sm", getProgressTextColor(completionPercentage))}>
          <span>Study time: {Math.round(studyTimeMinutes / 60)} hours</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-current/20">
          <SocialShare
            data={shareData}
            trigger={
              <Button size="sm" variant="outline">
                Share Progress
              </Button>
            }
          />
          <CopyToClipboard text={shareData.url} variant="outline" />
        </div>
      </div>
    </Card>
  );
}