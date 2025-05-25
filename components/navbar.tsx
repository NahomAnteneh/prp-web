"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Menu, GraduationCap } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import { signOut, useSession } from "next-auth/react"
import { SearchBar } from "@/components/SearchBar"

const FEATURES = [
  {
    title: "Project Repository",
    href: "/features#repository",
    description: "Store all project documents, source code, and resources in a centralized system.",
  },
  {
    title: "Version Control",
    href: "/features#version-control",
    description: "Track changes and maintain project history with our built-in version control system.",
  },
  {
    title: "Advisor Collaboration",
    href: "/features#collaboration",
    description: "Connect with advisors, get feedback, and collaborate effectively throughout your project.",
  },
  {
    title: "Role-Based Access",
    href: "/features#roles",
    description: "Specific access controls for Students, Advisors, Evaluators, and Administrators.",
  },
]

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(({ className, active, children, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
      active ? "text-blue-600 font-semibold" : "text-foreground/70 hover:text-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </a>
))
NavLink.displayName = "NavLink"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  // Use the session data
  const user = session?.user

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  // Helper function to check if a navigation item is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  // Helper function to get navigation menu trigger style with active state
  const getNavMenuStyle = (href: string) => {
    return cn(navigationMenuTriggerStyle(), isActive(href) && "bg-accent text-accent-foreground")
  }

  // Show loading indicator during session fetch
  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">PRP</span>
              <Badge variant="outline" className="ml-2 hidden sm:inline-flex">
                BiT
              </Badge>
            </Link>
          </div>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </Container>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">PRP</span>
            <Badge variant="outline" className="ml-2 hidden sm:inline-flex">
              BiT
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(isActive("/features") && "bg-accent text-accent-foreground")}>
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {FEATURES.map((feature) => (
                      <li key={feature.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={feature.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{feature.title}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {feature.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/about_us" className={getNavMenuStyle("/about_us")}>
                    About
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/student-guide" className={getNavMenuStyle("/student-guide")}>
                    Student Guide
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/faculty-resources" className={getNavMenuStyle("/faculty-resources")}>
                    Faculty
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden p-0 w-8 h-8">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <span className="font-bold">PRP</span>
                  <Badge variant="outline" className="ml-1">
                    BiT
                  </Badge>
                </div>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              {/* Mobile Search */}
              <SearchBar mobile />
              <div>
                <span
                  className={cn(
                    "flex py-2 text-base font-medium",
                    isActive("/features") ? "text-blue-600 font-semibold" : "text-foreground/70",
                  )}
                >
                  Features
                </span>
                <div className="ml-4 mt-1 space-y-3">
                  {FEATURES.map((feature) => (
                    <Link
                      key={feature.title}
                      href={feature.href}
                      className={cn(
                        "flex py-1 text-sm transition-colors hover:text-blue-600",
                        pathname.includes(feature.href.split("#")[1]) && "text-blue-600 font-semibold",
                      )}
                    >
                      {feature.title}
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/about_us"
                className={cn(
                  "flex py-2 text-base font-medium transition-colors hover:text-blue-600",
                  isActive("/about_us") && "text-blue-600 font-semibold bg-accent/50 rounded-md px-2",
                )}
              >
                About
              </Link>
              <Link
                href="/student-guide"
                className={cn(
                  "flex py-2 text-base font-medium transition-colors hover:text-blue-600",
                  isActive("/student-guide") && "text-blue-600 font-semibold bg-accent/50 rounded-md px-2",
                )}
              >
                Student Guide
              </Link>
              <Link
                href="/faculty-resources"
                className={cn(
                  "flex py-2 text-base font-medium transition-colors hover:text-blue-600",
                  isActive("/faculty-resources") && "text-blue-600 font-semibold bg-accent/50 rounded-md px-2",
                )}
              >
                Faculty Resources
              </Link>
            </nav>
            <div className="mt-6 space-y-4">
              {user ? (
                <>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button className="w-full" variant="default" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  )
}
