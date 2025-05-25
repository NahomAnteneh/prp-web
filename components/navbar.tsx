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
import { Menu, GraduationCap, ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SearchBar } from "@/components/SearchBar"
import { useState } from "react"

const FEATURES = [
  {
    title: "Project Repository",
    href: "/features#repository",
    description: "Store all project documents, source code, and resources in a centralized system.",
    icon: "📁",
  },
  {
    title: "Version Control",
    href: "/features#version-control",
    description: "Track changes and maintain project history with our built-in version control system.",
    icon: "🔄",
  },
  {
    title: "Advisor Collaboration",
    href: "/features#collaboration",
    description: "Connect with advisors, get feedback, and collaborate effectively throughout your project.",
    icon: "👥",
  },
  {
    title: "Role-Based Access",
    href: "/features#roles",
    description: "Specific access controls for Students, Advisors, Evaluators, and Administrators.",
    icon: "🔐",
  },
]

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  // Mock user state - replace with your actual auth logic
  const user = null // Set to user object when logged in
  const isLoading = false

  const handleLogout = () => {
    // Implement your logout logic here
    console.log("Logout clicked")
  }

  if (isLoading) {
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105">
            <GraduationCap className="h-6 w-6 text-blue-600 transition-all duration-300 group-hover:rotate-12 group-hover:text-blue-700" />
            <span className="text-xl font-bold transition-all duration-300 group-hover:text-blue-600">PRP</span>
            <Badge
              variant="outline"
              className="ml-2 hidden sm:inline-flex transition-all duration-300 group-hover:bg-blue-50 group-hover:border-blue-300"
            >
              BiT
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="group transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-600">
                  <span>Features</span>
                  <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-300">
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {FEATURES.map((feature) => (
                      <li key={feature.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={feature.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md hover:scale-105 focus:bg-blue-50 focus:text-blue-600 transform",
                              hoveredFeature === feature.title && "bg-blue-50 text-blue-600 shadow-md scale-105",
                            )}
                            onMouseEnter={() => setHoveredFeature(feature.title)}
                            onMouseLeave={() => setHoveredFeature(null)}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium leading-none">
                              <span className="text-lg transition-transform duration-300 hover:scale-125">
                                {feature.icon}
                              </span>
                              {feature.title}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground transition-colors duration-300">
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
                  <Link
                    href="/about"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 relative overflow-hidden",
                      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500 before:to-blue-600 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-10",
                    )}
                  >
                    <span className="relative z-10">About</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/student-guide"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 relative overflow-hidden",
                      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500 before:to-blue-600 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-10",
                      pathname === "/student-guide" && "text-blue-600 font-semibold bg-blue-50 shadow-sm",
                    )}
                  >
                    <span className="relative z-10">Student Guide</span>
                    {pathname === "/student-guide" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-pulse"></div>
                    )}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <a
                    href="https://www.bdu.edu.et/"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 relative overflow-hidden",
                      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500 before:to-blue-600 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-10",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="relative z-10">Faculty</span>
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Search Bar */}
        <div className="transition-all duration-300 hover:scale-105">
          <SearchBar />
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="transition-all duration-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 hover:scale-105 hover:shadow-md"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="transition-all duration-300 hover:bg-red-50 hover:text-red-600 hover:scale-105"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="transition-all duration-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 hover:scale-105 hover:shadow-md"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-lg transform"
              >
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-0 w-8 h-8 transition-all duration-300 hover:bg-blue-50 hover:scale-110"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className={cn("h-5 w-5 transition-all duration-300", isMenuOpen && "rotate-90 text-blue-600")} />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="animate-in slide-in-from-right duration-300">
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center space-x-2 group">
                  <GraduationCap className="h-5 w-5 text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
                  <span className="font-bold">PRP</span>
                  <Badge variant="outline" className="ml-1 transition-all duration-300 group-hover:bg-blue-50">
                    BiT
                  </Badge>
                </div>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              {/* Mobile Search */}
              <div className="transition-all duration-300 hover:scale-105">
                <SearchBar mobile />
              </div>

              <div className="space-y-2">
                <span className="flex py-2 text-base font-medium text-foreground/70">Features</span>
                <div className="ml-4 mt-1 space-y-3">
                  {FEATURES.map((feature, index) => (
                    <Link
                      key={feature.title}
                      href={feature.href}
                      className={cn(
                        "flex items-center gap-2 py-2 text-sm transition-all duration-300 hover:text-blue-600 hover:translate-x-2 hover:scale-105",
                        pathname.includes(feature.href.split("#")[1]) && "text-blue-600 translate-x-1",
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-base transition-transform duration-300 hover:scale-125">
                        {feature.icon}
                      </span>
                      {feature.title}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/about"
                className={cn(
                  "flex py-2 text-base font-medium transition-all duration-300 hover:text-blue-600 hover:translate-x-2 hover:scale-105",
                  pathname.startsWith("/about") && "text-blue-600 translate-x-1",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>

              <Link
                href="/student-guide"
                className={cn(
                  "flex py-2 text-base font-medium transition-all duration-300 hover:text-blue-600 hover:translate-x-2 hover:scale-105",
                  pathname.startsWith("/student-guide") && "text-blue-600 translate-x-1 font-semibold",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Student Guide
                {pathname.startsWith("/student-guide") && (
                  <div className="ml-2 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                )}
              </Link>

              <Link
                href="/faculty-resources"
                className={cn(
                  "flex py-2 text-base font-medium transition-all duration-300 hover:text-blue-600 hover:translate-x-2 hover:scale-105",
                  pathname.startsWith("/faculty-resources") && "text-blue-600 translate-x-1",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Faculty Resources
              </Link>
            </nav>

            <div className="mt-6 space-y-4">
              {user ? (
                <>
                  <Button
                    className="w-full transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-105"
                    variant="outline"
                    asChild
                  >
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    className="w-full transition-all duration-300 hover:bg-red-50 hover:text-red-600 hover:scale-105"
                    variant="default"
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:scale-105"
                    variant="outline"
                    asChild
                  >
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button
                    className="w-full transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-lg"
                    asChild
                  >
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      Register
                    </Link>
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
