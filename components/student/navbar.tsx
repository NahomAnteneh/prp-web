"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/ui/logout-button"
import NotificationDropdown from "./dashboard/notification-dropdown"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { useSession } from "next-auth/react"
import { SearchBar } from "@/components/SearchBar"
import { motion } from "framer-motion"
import { AnimatePresence } from "framer-motion"

export default function Navbar() {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string>("Student")
  const [unreadCount, setUnreadCount] = useState(3) // Mock data

  const userName = session?.user?.userId || "john_doe"

  useEffect(() => {
    async function fetchNavbarData() {
      try {
        if (!userName) {
          return
        }

        // Mock notification data
        setUnreadCount(3)
      } catch (error) {
        console.error("Error fetching navbar data:", error)
      }
    }

    setDisplayName(userName || "Student")

    if (userName) {
      fetchNavbarData()
    }
  }, [userName])

  const handleMarkAllAsRead = async () => {
    try {
      if (!userName) {
        return
      }

      // Mock marking as read
      setUnreadCount(0)
      console.log("Marked all notifications as read")
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full border-b bg-background shadow-sm"
    >
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo and brand */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center"
        >
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">PRP</span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center space-x-4"
        >
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
                  href="/explore"
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                >
                  Explore
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
        </motion.div>

        {/* Search Bar - Desktop */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="hidden md:block flex-1 max-w-md mx-4"
        >
          <SearchBar />
        </motion.div>

        {/* Right side menu items */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center space-x-4"
        >
          {/* Notifications Dropdown */}
          <NotificationDropdown unreadCount={unreadCount} userId={userName} onMarkAllAsRead={handleMarkAllAsRead} />

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            <Link
              href={userName ? `/${userName}` : "/"}
              className="flex items-center border rounded-full px-3 py-1 bg-accent/20 hover:bg-accent/30 transition-colors"
            >
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">{displayName}</span>
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
        </motion.div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden p-4 bg-background border-t md:hidden"
          >
            {/* Mobile Search */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <SearchBar mobile={true} />
            </motion.div>

            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col space-y-3"
            >
              {/* Show user info in mobile menu */}
              <Link
                href={userName ? `/${userName}` : "/"}
                className="flex items-center border rounded-full px-3 py-2 bg-accent/20 mb-2 hover:bg-accent/30 transition-colors"
              >
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">{displayName}</span>
              </Link>
              <Link
                href="/group"
                className="px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Group
              </Link>

              <Link
                href="/explore"
                className="px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explore
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
