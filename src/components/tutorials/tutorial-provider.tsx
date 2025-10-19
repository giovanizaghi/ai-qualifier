'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'hover' | 'scroll' | 'wait';
    element?: string;
    duration?: number;
  };
  canSkip?: boolean;
  showNext?: boolean;
  showPrevious?: boolean;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: TutorialStep[];
  autoStart?: boolean;
  showOnlyOnce?: boolean;
  triggers?: {
    route?: string;
    element?: string;
    event?: string;
  }[];
}

interface TutorialOverlayProps {
  tutorial: Tutorial;
  currentStepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onClose: () => void;
}

function TutorialOverlay({
  tutorial,
  currentStepIndex,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  onClose
}: TutorialOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = tutorial.steps[currentStepIndex];
  const isLastStep = currentStepIndex === tutorial.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  useEffect(() => {
    if (currentStep.target) {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Calculate position for tutorial card
        const rect = element.getBoundingClientRect();
        const cardHeight = 200; // Approximate card height
        const cardWidth = 300; // Approximate card width
        
        let top = rect.bottom + 10;
        let left = rect.left;
        
        // Adjust position based on step position preference
        switch (currentStep.position) {
          case 'top':
            top = rect.top - cardHeight - 10;
            break;
          case 'bottom':
            top = rect.bottom + 10;
            break;
          case 'left':
            top = rect.top;
            left = rect.left - cardWidth - 10;
            break;
          case 'right':
            top = rect.top;
            left = rect.right + 10;
            break;
          case 'center':
            top = window.innerHeight / 2 - cardHeight / 2;
            left = window.innerWidth / 2 - cardWidth / 2;
            break;
        }
        
        // Ensure card stays within viewport
        top = Math.max(10, Math.min(top, window.innerHeight - cardHeight - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - cardWidth - 10));
        
        setOverlayPosition({ top, left });
      }
    } else {
      // Center the card if no target
      setTargetElement(null);
      setOverlayPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150
      });
    }
  }, [currentStep]);

  const handleAction = () => {
    if (currentStep.action) {
      const { type, element, duration } = currentStep.action;
      
      switch (type) {
        case 'click':
          if (element) {
            const targetEl = document.querySelector(element) as HTMLElement;
            targetEl?.click();
          }
          break;
        case 'wait':
          setTimeout(() => {
            if (!isLastStep) onNext();
            else onComplete();
          }, duration || 2000);
          return;
      }
    }
    
    if (!isLastStep) onNext();
    else onComplete();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Highlight for target element */}
      {targetElement && (
        <div
          className="fixed border-2 border-blue-500 rounded-lg shadow-lg z-50 pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
          }}
        />
      )}
      
      {/* Tutorial Card */}
      <Card
        ref={cardRef}
        className="fixed z-50 w-80 p-4 shadow-xl"
        style={{
          top: overlayPosition.top,
          left: overlayPosition.left,
        }}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{currentStep.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {currentStepIndex + 1} of {tutorial.steps.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tutorial.title}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="prose prose-sm">
            <p>{currentStep.content}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStep.showPrevious !== false && !isFirstStep && (
                <Button variant="outline" size="sm" onClick={onPrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              
              {currentStep.canSkip !== false && (
                <Button variant="ghost" size="sm" onClick={onSkip}>
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip
                </Button>
              )}
            </div>
            
            <Button onClick={handleAction}>
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
          
          {/* Progress indicator */}
          <div className="w-full bg-muted rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / tutorial.steps.length) * 100}%`
              }}
            />
          </div>
        </div>
      </Card>
    </>
  );
}

interface TutorialProviderProps {
  tutorials: Tutorial[];
  children: React.ReactNode;
}

export function TutorialProvider({ tutorials, children }: TutorialProviderProps) {
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load completed tutorials from localStorage
    const completed = localStorage.getItem('completed-tutorials');
    if (completed) {
      setCompletedTutorials(new Set(JSON.parse(completed)));
    }
  }, []);

  const startTutorial = (tutorialId: string) => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      setActiveTutorial(tutorial);
      setCurrentStepIndex(0);
    }
  };

  const handleNext = () => {
    if (activeTutorial && currentStepIndex < activeTutorial.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    if (activeTutorial) {
      const newCompleted = new Set(completedTutorials);
      newCompleted.add(activeTutorial.id);
      setCompletedTutorials(newCompleted);
      localStorage.setItem('completed-tutorials', JSON.stringify([...newCompleted]));
    }
    
    setActiveTutorial(null);
    setCurrentStepIndex(0);
  };

  const handleClose = () => {
    setActiveTutorial(null);
    setCurrentStepIndex(0);
  };

  return (
    <>
      {children}
      {activeTutorial && (
        <TutorialOverlay
          tutorial={activeTutorial}
          currentStepIndex={currentStepIndex}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          onComplete={handleComplete}
          onClose={handleClose}
        />
      )}
    </>
  );
}