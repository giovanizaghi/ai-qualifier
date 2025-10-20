"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"



const profileSchema = z.object({
  name: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  linkedInUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal("")),
  timezone: z.string().optional(),
  preferredLanguage: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    firstName?: string | null
    lastName?: string | null
    bio?: string | null
    linkedInUrl?: string | null
    githubUrl?: string | null
    portfolioUrl?: string | null
    timezone?: string | null
    preferredLanguage?: string | null
    image?: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Helper function to split full name into first and last name
  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' }
    }
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ')
    return { firstName, lastName }
  }

  // Get firstName and lastName from either the separate fields or split the full name
  const getInitialNames = () => {
    if (user.firstName || user.lastName) {
      return {
        firstName: user.firstName || "",
        lastName: user.lastName || ""
      }
    } else if (user.name) {
      return splitFullName(user.name)
    }
    return { firstName: "", lastName: "" }
  }

  const initialNames = getInitialNames()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      firstName: initialNames.firstName,
      lastName: initialNames.lastName,
      bio: user.bio || "",
      linkedInUrl: user.linkedInUrl || "",
      githubUrl: user.githubUrl || "",
      portfolioUrl: user.portfolioUrl || "",
      timezone: user.timezone || "UTC",
      preferredLanguage: user.preferredLanguage || "en",
    },
  })

  // Watch firstName and lastName to auto-update display name
  const firstName = watch("firstName")
  const lastName = watch("lastName")

  // Update display name when first/last names change
  useEffect(() => {
    const displayName = `${firstName || ''} ${lastName || ''}`.trim()
    if (displayName && displayName !== watch("name")) {
      setValue("name", displayName)
    }
  }, [firstName, lastName, setValue, watch])

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedUser = await response.json()
      toast.success("Profile updated successfully!")
      
      // Optionally refresh the page or update local state
      window.location.reload()
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove all your data from our servers.")) {
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      toast.success("Account deleted successfully")
      // Redirect to home page or sign out
      window.location.href = '/'
    } catch (error) {
      console.error('Account deletion error:', error)
      toast.error("Failed to delete account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your basic profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="text-lg">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                Change Avatar
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Upload a new profile picture
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  {...register("firstName")}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  {...register("lastName")}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                type="text"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Email changes will require verification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                {...register("bio")}
                disabled={isLoading}
                className="resize-none"
                rows={3}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Maximum 500 characters
              </p>
            </div>

            <div className="h-[1px] w-full bg-border" />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Social Links</h4>
              
              <div className="space-y-2">
                <Label htmlFor="linkedInUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedInUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  {...register("linkedInUrl")}
                  disabled={isLoading}
                />
                {errors.linkedInUrl && (
                  <p className="text-sm text-destructive">{errors.linkedInUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub Profile</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username"
                  {...register("githubUrl")}
                  disabled={isLoading}
                />
                {errors.githubUrl && (
                  <p className="text-sm text-destructive">{errors.githubUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">Portfolio Website</Label>
                <Input
                  id="portfolioUrl"
                  type="url"
                  placeholder="https://your-portfolio.com"
                  {...register("portfolioUrl")}
                  disabled={isLoading}
                />
                {errors.portfolioUrl && (
                  <p className="text-sm text-destructive">{errors.portfolioUrl.message}</p>
                )}
              </div>
            </div>

            <div className="h-[1px] w-full bg-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={watch("timezone")} onValueChange={(value) => setValue("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Language</Label>
                <Select value={watch("preferredLanguage")} onValueChange={(value) => setValue("preferredLanguage", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !isDirty}
              className="w-full sm:w-auto"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>



      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">
                Last changed 3 months ago
              </p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>
            Overview of your AI Qualifier journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-lg font-semibold">3</h4>
              <p className="text-sm text-muted-foreground">Qualifications Completed</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">Intermediate</h4>
              <p className="text-sm text-muted-foreground">Current Level</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">1,250</h4>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">7 days</h4>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}