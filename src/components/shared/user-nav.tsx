"use client"

import { LogOut, Settings, User as UserIcon } from "lucide-react"
import { User } from "next-auth"
import { signOut } from "next-auth/react"


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cache, clearBrowserCaches } from "@/lib/cache"

interface UserNavProps {
  user: User
}

export function UserNav({ user }: UserNavProps) {
  const getInitials = (name?: string | null) => {
    if (!name) {return "U"}
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSignOut = async () => {
    try {
      // Clear server-side user-specific cache
      const clearedCount = cache.clearUserCache(user.id || '');
      console.log(`[UserNav] Cleared ${clearedCount} server cache entries for user ${user.id}`);
      
      // Clear browser-level caches
      clearBrowserCaches();
      
      // Sign out
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error('[UserNav] Error during sign out:', error);
      // Still attempt to sign out even if cache clearing fails
      await signOut({ callbackUrl: "/" });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || undefined} alt={user.name || "User avatar"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
