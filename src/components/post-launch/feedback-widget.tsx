"use client"

import { 
  MessageSquare, 
  Star, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  Bug,
  Lightbulb,
  Heart,
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react"
import { useState } from 'react'
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"


interface FeedbackFormData {
  type: 'bug' | 'feature' | 'improvement' | 'general' | 'content'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  rating?: number
  email?: string
  category?: string
  context?: {
    page: string
    userAgent: string
    timestamp: string
  }
}

interface PostLaunchFeedbackProps {
  className?: string
  contextPage?: string
  onSubmit?: (feedback: FeedbackFormData) => void
}

export function PostLaunchFeedback({ className, contextPage, onSubmit }: PostLaunchFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'quick' | 'detailed'>('quick')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'general',
    priority: 'medium',
    title: '',
    description: '',
    rating: undefined,
    email: '',
    category: '',
    context: {
      page: contextPage || window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
  })

  const handleQuickFeedback = async (type: 'positive' | 'negative' | 'bug') => {
    const feedbackData: FeedbackFormData = {
      type: type === 'bug' ? 'bug' : 'general',
      priority: type === 'bug' ? 'high' : 'medium',
      title: type === 'positive' ? 'Positive feedback' : 
             type === 'negative' ? 'Negative feedback' : 'Bug report',
      description: type === 'positive' ? 'User provided positive feedback' : 
                   type === 'negative' ? 'User provided negative feedback' : 'User reported a bug',
      rating: type === 'positive' ? 5 : type === 'negative' ? 2 : undefined,
      context: formData.context
    }

    await submitFeedback(feedbackData)
  }

  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    await submitFeedback(formData)
  }

  const submitFeedback = async (data: FeedbackFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setSubmitted(true)
      toast.success("Thank you for your feedback! We'll review it shortly.")
      
      if (onSubmit) {
        onSubmit(data)
      }

      // Reset form after successful submission
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setFormData({
          type: 'general',
          priority: 'medium',
          title: '',
          description: '',
          rating: undefined,
          email: '',
          category: '',
          context: formData.context
        })
      }, 2000)

    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />
      case 'feature': return <Lightbulb className="h-4 w-4" />
      case 'improvement': return <ThumbsUp className="h-4 w-4" />
      case 'content': return <MessageSquare className="h-4 w-4" />
      default: return <Heart className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-200"
          size="sm"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Card className="w-80 shadow-lg">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Thank You!</h3>
            <p className="text-sm text-muted-foreground">
              Your feedback has been submitted and will help us improve the platform.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className="w-96 shadow-lg max-h-[80vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Share Your Feedback</CardTitle>
              <CardDescription>
                Help us improve your experience
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {feedbackType === 'quick' ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Quick Feedback
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFeedback('positive')}
                    disabled={isSubmitting}
                    className="flex flex-col h-16 text-xs"
                  >
                    <ThumbsUp className="h-4 w-4 mb-1 text-green-600" />
                    Love it!
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFeedback('negative')}
                    disabled={isSubmitting}
                    className="flex flex-col h-16 text-xs"
                  >
                    <ThumbsDown className="h-4 w-4 mb-1 text-red-600" />
                    Not great
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFeedback('bug')}
                    disabled={isSubmitting}
                    className="flex flex-col h-16 text-xs"
                  >
                    <Bug className="h-4 w-4 mb-1 text-orange-600" />
                    Found a bug
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setFeedbackType('detailed')}
                  className="p-0 h-auto text-sm"
                >
                  Provide detailed feedback →
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleDetailedSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type" className="text-sm font-medium">
                  Feedback Type
                </Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4" />
                        Bug Report
                      </div>
                    </SelectItem>
                    <SelectItem value="feature">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Feature Request
                      </div>
                    </SelectItem>
                    <SelectItem value="improvement">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Improvement
                      </div>
                    </SelectItem>
                    <SelectItem value="content">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Content Feedback
                      </div>
                    </SelectItem>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        General Feedback
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary of your feedback"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide details about your feedback..."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              {formData.type === 'general' && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Overall Rating
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                        className="p-1"
                      >
                        <Star 
                          className={`h-5 w-5 ${
                            formData.rating && star <= formData.rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email (optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll only use this to follow up if needed
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFeedbackType('quick')}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}