"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/ui/logout-button"
import NotificationDropdown from "./notification-dropdown"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export interface NavbarProps {
  unreadNotifications: number
  userName?: string
}

export default function Navbar({ unreadNotifications = 0, userName }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string>("Student")
  const [unreadCount, setUnreadCount] = useState(unreadNotifications)
  
  // Set display name with fallback to "Student" if userName is undefined or empty
  useEffect(() => {
    console.log("Navbar received userName:", userName)
    setDisplayName(userName && userName.trim() !== "" ? userName : "Student")
  }, [userName])

  // Update unread count when prop changes
  useEffect(() => {
    setUnreadCount(unreadNotifications)
  }, [unreadNotifications])

  const handleMarkAllAsRead = () => {
    setUnreadCount(0)
    // In a real app, this would call an API endpoint to mark notifications as read
    console.log("Marked all notifications as read")
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo and brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">PRP</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/group"
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                >
                  Group
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/projects"
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                >
                  Projects
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/tasks"
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                >
                  Tasks
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <NavigationMenuLink 
                      href="/resources/repository-guide"
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">Repository Guide</div>
                      <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        Learn how to use the Vec repository system
                      </p>
                    </NavigationMenuLink>
                    <NavigationMenuLink 
                      href="/resources/project-guidelines"
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">Project Guidelines</div>
                      <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        Essential information for project development
                      </p>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side menu items */}
        <div className="flex items-center space-x-4">
          {/* Settings */}
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            className="relative"
            aria-label="Settings"
          >
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          {/* Notifications Dropdown */}
          <NotificationDropdown 
            unreadCount={unreadCount} 
            onMarkAllAsRead={handleMarkAllAsRead} 
          />

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            <Link 
              href={`/${userName}`}
              className="flex items-center border rounded-full px-3 py-1 bg-accent/20 hover:bg-accent/30 transition-colors"
            >
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">
                {displayName}
              </span>
            </Link>
            <LogoutButton className="ml-2" />
          </div>
          
          {/* Mobile menu toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="p-4 bg-background border-t md:hidden">
          <div className="flex flex-col space-y-3">
            {/* Show user info in mobile menu */}
            <Link 
              href={`/${userName}`}
              className="flex items-center border rounded-full px-3 py-2 bg-accent/20 mb-2 hover:bg-accent/30 transition-colors"
            >
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">
                {displayName}
              </span>
            </Link>
            <Link 
              href="/dashboard" 
              className="px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Group
            </Link>
            <Link 
              href="/projects" 
              className="px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Projects
            </Link>
            <Link 
              href="/tasks" 
              className="px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tasks
            </Link>
            <Link 
              href="/resources" 
              className="px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Resources
            </Link>
            <Link 
              href="/settings" 
              className="px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Settings
            </Link>
            <div className="pt-2 border-t">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 