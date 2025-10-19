'use client';

import { useState } from 'react';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyToClipboardProps {
  text: string;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showFeedback?: boolean;
  feedbackDuration?: number;
}

export function CopyToClipboard({
  text,
  children,
  className,
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  showFeedback = true,
  feedbackDuration = 2000
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (showFeedback) {
        setCopied(true);
        setTimeout(() => setCopied(false), feedbackDuration);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        if (showFeedback) {
          setCopied(true);
          setTimeout(() => setCopied(false), feedbackDuration);
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      
      document.body.removeChild(textArea);
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        "transition-colors",
        copied && "text-green-600",
        className
      )}
    >
      {showIcon && <Icon className="h-4 w-4" />}
      {children || (
        <span className={showIcon ? "ml-2" : ""}>
          {copied ? 'Copied!' : 'Copy'}
        </span>
      )}
    </Button>
  );
}