'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface TooltipContent {
  title?: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  showIcon?: boolean;
  persistent?: boolean; // Stay open until manually closed
}

interface TooltipProps {
  content: TooltipContent;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  trigger?: 'hover' | 'click';
  delay?: number;
}

export function Tooltip({
  content,
  children,
  className,
  disabled = false,
  trigger = 'hover',
  delay = 200
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const preferredPosition = content.position || 'top';
    
    let top = 0;
    let left = 0;

    switch (preferredPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport
    const padding = 8;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    setPosition({ top, left });
  };

  const showTooltip = () => {
    if (disabled) return;
    
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (content.persistent) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      
      // Recalculate on scroll/resize
      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isVisible]);

  const triggerProps = trigger === 'hover' 
    ? {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
      }
    : {
        onClick: toggleTooltip,
      };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("inline-block", className)}
        {...triggerProps}
      >
        {children}
      </div>

      {isVisible && (
        <>
          {/* Backdrop for click-outside detection */}
          {trigger === 'click' && (
            <div
              className="fixed inset-0 z-40"
              onClick={hideTooltip}
            />
          )}
          
          {/* Tooltip */}
          <Card
            ref={tooltipRef}
            className={cn(
              "fixed z-50 p-3 shadow-lg border",
              "animate-in fade-in-0 zoom-in-95 duration-200"
            )}
            style={{
              top: position.top,
              left: position.left,
              maxWidth: content.maxWidth || 300,
            }}
          >
            <div className="space-y-2">
              {(content.title || content.persistent) && (
                <div className="flex items-center justify-between">
                  {content.title && (
                    <h4 className="font-semibold text-sm">{content.title}</h4>
                  )}
                  {content.persistent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={hideTooltip}
                      className="h-4 w-4 p-0 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
              
              <div className="flex items-start gap-2">
                {content.showIcon && (
                  <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.content}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

// Helper component for question mark icon tooltips
interface HelpTooltipProps {
  content: string;
  title?: string;
  className?: string;
}

export function HelpTooltip({ content, title, className }: HelpTooltipProps) {
  return (
    <Tooltip
      content={{ content, title, showIcon: false }}
      trigger="hover"
      className={className}
    >
      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
    </Tooltip>
  );
}