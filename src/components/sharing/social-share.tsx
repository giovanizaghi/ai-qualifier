'use client';

import { Share2, Link, Twitter, Facebook, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CopyToClipboard } from './copy-to-clipboard';
import { cn } from '@/lib/utils';

interface ShareData {
  title: string;
  text: string;
  url: string;
}

interface SocialShareProps {
  data: ShareData;
  className?: string;
  trigger?: React.ReactNode;
  platforms?: ('twitter' | 'facebook' | 'linkedin' | 'email' | 'copy')[];
  showNativeShare?: boolean;
}

const generateShareUrls = (data: ShareData) => {
  const encodedUrl = encodeURIComponent(data.url);
  const encodedTitle = encodeURIComponent(data.title);
  const encodedText = encodeURIComponent(data.text);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`
  };
};

const platformConfig = {
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'hover:bg-blue-50 hover:text-blue-600'
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'hover:bg-blue-50 hover:text-blue-700'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'hover:bg-blue-50 hover:text-blue-800'
  },
  email: {
    name: 'Email',
    icon: Mail,
    color: 'hover:bg-gray-50 hover:text-gray-700'
  }
};

export function SocialShare({
  data,
  className,
  trigger,
  platforms = ['twitter', 'facebook', 'linkedin', 'email', 'copy'],
  showNativeShare = true
}: SocialShareProps) {
  const shareUrls = generateShareUrls(data);
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url
        });
      } catch (error) {
        console.error('Native share failed:', error);
      }
    }
  };

  const handlePlatformShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={className}>
            <Share2 className="h-4 w-4" />
            <span className="ml-2">Share</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this qualification</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Native Share (if supported) */}
          {showNativeShare && supportsNativeShare && (
            <Button
              onClick={handleNativeShare}
              className="w-full justify-start gap-3"
              variant="outline"
            >
              <Share2 className="h-5 w-5" />
              Share via device
            </Button>
          )}

          {/* Social Platforms */}
          <div className="space-y-2">
            {platforms.filter(p => p !== 'copy' && p in platformConfig).map((platform) => {
              const config = platformConfig[platform as keyof typeof platformConfig];
              const Icon = config.icon;
              
              return (
                <Button
                  key={platform}
                  onClick={() => handlePlatformShare(platform as keyof typeof shareUrls)}
                  className={cn(
                    "w-full justify-start gap-3",
                    config.color
                  )}
                  variant="outline"
                >
                  <Icon className="h-5 w-5" />
                  Share on {config.name}
                </Button>
              );
            })}
          </div>

          {/* Copy Link */}
          {platforms.includes('copy') && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Or copy link</div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3 py-2 text-sm bg-muted rounded-md truncate">
                  {data.url}
                </div>
                <CopyToClipboard text={data.url}>
                  <Link className="h-4 w-4" />
                </CopyToClipboard>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}