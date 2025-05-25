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
import { Menu, GraduationCap, Database, GitBranch, Users, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SearchBar } from "@/components/SearchBar"
import { useState } from "react"

const FEATURES = [
  {
    title: "Project Repository",
    description:
      "Store all project documents, source code, and resources in a centralized system with secure access controls.",
    icon: <Database className="h-5 w-5" />,
    details:
      "Our distributed repository system allows you to organize all your project files in one place. Upload documents, code files, images, and any other resources. The system automatically tracks file versions and provides secure access based on user roles.",
  },
  {
    title: "Version Control",
    description:
      "Track changes and maintain project history with our built-in version control system designed for academic projects.",
    icon: <GitBranch className="h-5 w-5" />,
    details:
      "Never lose your work again with our comprehensive version control system. Every change to your files is automatically tracked, allowing you to see what changed, when it changed, and who made the changes.",
  },
  {
    title: "Advisor Collaboration",
    description:
      "Connect with advisors, get feedback, and collaborate effectively throughout your project development.",
    icon: <Users className="h-5 w-5" />,
    details:
      "Streamline communication with your project advisors through integrated collaboration tools. Schedule meetings, share progress updates, receive structured feedback, and maintain a clear record of all interactions.",
  },
  {
    title: "Role-Based Access",
    description:
      "Specific access controls for Students, Advisors, Evaluators, and Administrators with appropriate permissions.",
    icon: <ShieldCheck className="h-5 w-5" />,
    details:
      "Security and privacy are paramount in academic projects. Our role-based access system ensures that each user only sees and can modify what they're supposed to according to their role.",
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

  const handleFeatureHover = (featureTitle: string | null) => {
    setHoveredFeature(featureTitle)
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
                  Features
                </NavigationMenuTrigger>
                <NavigationMenuContent className="z-[60] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-300 shadow-lg border bg-white">
                  <div className="w-[700px] p-6">
                    <div className="grid gap-4">
                      {FEATURES.map((feature) => (
                        <div
                          key={feature.title}
                          className="relative"
                          onMouseEnter={() => handleFeatureHover(feature.title)}
                          onMouseLeave={() => handleFeatureHover(null)}
                        >
                          <div
                            className={cn(
                              "flex items-start gap-4 rounded-lg p-4 transition-all duration-300 hover:bg-blue-50 cursor-pointer",
                              hoveredFeature === feature.title && "bg-blue-50 shadow-md",
                            )}
                          >
                            <div className="flex-shrink-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                {feature.icon}
                              </div>
                            </div>
                            <div className="flex-1 space-y-2">
                              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>

                              {/* Expanded Details on Hover */}
                              {hoveredFeature === feature.title && (
                                <div className="animate-in slide-in-from-top-2 duration-300 pt-2">
                                  <div className="rounded-md bg-blue-100 p-3 border-l-4 border-blue-600">
                                    <p className="text-sm text-blue-800 leading-relaxed">{feature.details}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 text-center">
                        Hover over each feature to learn more about its capabilities
                      </p>
                    </div>
                  </div>
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
          <SheetContent side="right" className="animate-in slide-in-from-right duration-300 z-[70]">
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
                    <div
                      key={feature.title}
                      className="space-y-2"
                      onMouseEnter={() => handleFeatureHover(feature.title)}
                      onMouseLeave={() => handleFeatureHover(null)}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-3 py-3 px-2 text-sm transition-all duration-300 hover:text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer",
                          hoveredFeature === feature.title && "text-blue-600 bg-blue-50",
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-shrink-0">{feature.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium">{feature.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{feature.description}</div>
                        </div>
                      </div>

                      {/* Mobile Expanded Details */}
                      {hoveredFeature === feature.title && (
                        <div className="ml-8 animate-in slide-in-from-top-2 duration-300">
                          <div className="rounded-md bg-blue-50 p-3 border-l-4 border-blue-600">
                            <p className="text-xs text-blue-800 leading-relaxed">{feature.details}</p>
                          </div>
                        </div>
                      )}
                    </div>
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
