"use client"

import React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/container"
import { Separator } from "@/components/ui/separator"
import { Navbar } from "@/components/navbar"
import {
  BookOpen,
  Users,
  Shield,
  GitBranch,
  MessageSquare,
  CheckCircle,
  HelpCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"

// Custom hook for intersection observer
function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: "-50px 0px -50px 0px",
        ...options,
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return [ref, isIntersecting] as const
}

// Animation wrapper component
function AnimatedSection({
  children,
  className = "",
  animationType = "fadeUp",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  animationType?: "fadeUp" | "fadeLeft" | "fadeRight" | "fadeDown" | "scale" | "rotate"
  delay?: number
}) {
  const [ref, isIntersecting] = useIntersectionObserver()
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (isIntersecting && !hasAnimated) {
      setTimeout(() => setHasAnimated(true), delay)
    }
  }, [isIntersecting, hasAnimated, delay])

  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-1000 ease-out"

    if (!hasAnimated) {
      switch (animationType) {
        case "fadeUp":
          return `${baseClasses} translate-y-8 opacity-0 scale-95`
        case "fadeLeft":
          return `${baseClasses} -translate-x-8 opacity-0 scale-95`
        case "fadeRight":
          return `${baseClasses} translate-x-8 opacity-0 scale-95`
        case "fadeDown":
          return `${baseClasses} -translate-y-8 opacity-0 scale-95`
        case "scale":
          return `${baseClasses} scale-75 opacity-0`
        case "rotate":
          return `${baseClasses} rotate-12 scale-90 opacity-0`
        default:
          return `${baseClasses} translate-y-8 opacity-0 scale-95`
      }
    }

    return `${baseClasses} translate-y-0 translate-x-0 opacity-100 scale-100 rotate-0`
  }

  return (
    <div ref={ref} className={`${getAnimationClasses()} ${className}`}>
      {children}
    </div>
  )
}

// Staggered animation for multiple items
function StaggeredItems({
  children,
  staggerDelay = 100,
  animationType = "fadeUp",
}: {
  children: React.ReactNode[]
  staggerDelay?: number
  animationType?: "fadeUp" | "fadeLeft" | "fadeRight" | "fadeDown" | "scale" | "rotate"
}) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <AnimatedSection animationType={animationType} delay={index * staggerDelay} key={index}>
          {child}
        </AnimatedSection>
      ))}
    </>
  )
}

export default function StudentGuidePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Initial page load animation
    setIsLoaded(true)
  }, [])

  return (
    <div className="flex flex-col min-h-dvh bg-blue-50 overflow-hidden">
      {/* Navigation with slide-down animation */}
      <div
        className={`transform transition-all duration-700 ease-out ${
          isLoaded ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <Navbar />
      </div>

      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-4xl mx-auto px-4">
          {/* Hero Section - Initial load animation */}
          <AnimatedSection animationType="scale" className="w-full py-12 md:py-16 bg-blue-600 rounded-lg mb-6">
            <div className="space-y-6 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <AnimatedSection animationType="rotate" delay={300}>
                    <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">Student Guide</Badge>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={500}>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tighter text-white text-center">
                      BiT Project Repository Platform Guide
                    </h1>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={700}>
                    <p className="max-w-[700px] text-blue-100 text-base md:text-lg text-center">
                      Welcome, BiT Students! Discover how to streamline your final-year project with our intuitive
                      platform, designed to empower collaboration, organization, and success.
                    </p>
                  </AnimatedSection>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Getting Started Section */}
          <AnimatedSection animationType="fadeLeft" className="w-full py-12 md:py-16 bg-white rounded-lg mb-6">
            <div className="space-y-8 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <AnimatedSection animationType="rotate" delay={200}>
                    <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">Getting Started</Badge>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={400}>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                      Begin Your Journey
                    </h2>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={600}>
                    <p className="max-w-[700px] text-gray-600 text-base md:text-lg text-center">
                      Set up your account and explore your personalized dashboard to manage your final-year project
                      effectively.
                    </p>
                  </AnimatedSection>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <StaggeredItems staggerDelay={200} animationType="scale">
                  <div className="rounded-lg border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-500 text-center transform hover:scale-105 hover:-translate-y-2">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600 transition-transform duration-300 hover:scale-110 hover:rotate-12" />
                      <h3 className="text-lg font-bold text-gray-900">Account Setup</h3>
                    </div>
                    <p className="text-gray-600 text-center text-sm">
                      Kickstart your journey by clicking Register Now on the homepage. Use your BiT credentials to
                      create an account and unlock your personalized dashboard, your command center for project
                      management.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-500 text-center transform hover:scale-105 hover:-translate-y-2">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <Users className="h-5 w-5 text-blue-600 transition-transform duration-300 hover:scale-110 hover:rotate-12" />
                      <h3 className="text-lg font-bold text-gray-900">Dashboard Overview</h3>
                    </div>
                    <p className="text-gray-600 text-center text-sm">
                      The dashboard is your one-stop hub for all project activities. Monitor tasks, access resources,
                      communicate with your team, and track progress—all in one intuitive interface tailored for BiT
                      students.
                    </p>
                  </div>
                </StaggeredItems>
              </div>
            </div>
          </AnimatedSection>

          {/* Key Features Section */}
          <AnimatedSection animationType="fadeRight" className="w-full py-12 md:py-16 bg-blue-50 rounded-lg mb-6">
            <div className="space-y-8 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <AnimatedSection animationType="rotate" delay={200}>
                    <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">Key Features</Badge>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={400}>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                      Features for Students
                    </h2>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={600}>
                    <p className="max-w-[700px] text-gray-600 text-base md:text-lg text-center">
                      Comprehensive tools and features designed specifically to support your academic project success.
                    </p>
                  </AnimatedSection>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StaggeredItems staggerDelay={150} animationType="scale">
                  {[
                    {
                      icon: Shield,
                      title: "Distributed Repository",
                      description:
                        "Securely store project documents, code, and resources in a centralized system, accessible to your team and advisors based on their roles.",
                    },
                    {
                      icon: GitBranch,
                      title: "Version Control",
                      description:
                        "Effortlessly track changes to your files, compare versions, and revert to earlier drafts to maintain a polished project history.",
                    },
                    {
                      icon: MessageSquare,
                      title: "Collaboration Tools",
                      description:
                        "Work seamlessly with teammates and advisors using integrated chat and real-time document editing, eliminating the need for external apps.",
                    },
                    {
                      icon: CheckCircle,
                      title: "Task Management",
                      description:
                        "Stay organized with task assignments, deadlines, and progress trackers to ensure your project stays on schedule.",
                    },
                    {
                      icon: FileText,
                      title: "Project Guidance",
                      description:
                        "Leverage BiT-specific templates and guidelines to craft proposals, reports, and presentations that meet academic standards.",
                    },
                    {
                      icon: Shield,
                      title: "Academic Integrity Tools",
                      description:
                        "Use built-in plagiarism detection and citation tools to ensure your work is original and properly referenced.",
                    },
                  ].map((feature) => {
                    const IconComponent = feature.icon
                    return (
                      <div
                        key={feature.title}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-500 text-center transform hover:scale-110 hover:-translate-y-3 hover:rotate-1 group"
                      >
                        <div className="flex items-center gap-2 mb-2 justify-center">
                          <IconComponent className="h-4 w-4 text-blue-600 transition-all duration-300 group-hover:scale-125 group-hover:text-blue-700 group-hover:rotate-12" />
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-600 text-center group-hover:text-gray-700 transition-colors duration-300">
                          {feature.description}
                        </p>
                      </div>
                    )
                  })}
                </StaggeredItems>
              </div>
            </div>
          </AnimatedSection>

          {/* FAQ Section */}
          <AnimatedSection animationType="fadeUp" className="w-full py-12 md:py-16 bg-white rounded-lg mb-6">
            <div className="space-y-8 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <AnimatedSection animationType="rotate" delay={200}>
                    <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">FAQ</Badge>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={400}>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                      Frequently Asked Questions
                    </h2>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={600}>
                    <p className="max-w-[700px] text-gray-600 text-base md:text-lg text-center">
                      Common questions and answers to help you get the most out of the platform.
                    </p>
                  </AnimatedSection>
                </div>
              </div>

              <div className="space-y-4">
                <StaggeredItems staggerDelay={200} animationType="fadeLeft">
                  {[
                    {
                      question: "How do I share my project with my advisor?",
                      answer:
                        'Easily share your project by selecting the "Share" option in your repository, granting access based on role permissions.',
                    },
                    {
                      question: "What if I face technical issues?",
                      answer:
                        "Reach out to our support team via the Help section or email [support@bitplatform.edu] for prompt assistance.",
                    },
                    {
                      question: "Can I work offline?",
                      answer:
                        "Download project files for offline access; note that most features, like collaboration and submissions, require an internet connection.",
                    },
                  ].map((faq) => (
                    <div
                      key={faq.question}
                      className="rounded-lg border border-gray-200 bg-white p-6 text-center transform transition-all duration-500 hover:shadow-lg hover:scale-105 hover:-translate-y-2 hover:border-blue-300 group"
                    >
                      <div className="flex items-center gap-2 mb-2 justify-center">
                        <HelpCircle className="h-4 w-4 text-blue-600 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 group-hover:text-blue-700" />
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                          {faq.question}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 text-center group-hover:text-gray-700 transition-colors duration-300">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </StaggeredItems>
              </div>
            </div>
          </AnimatedSection>

          {/* Support Section */}
          <AnimatedSection animationType="fadeLeft" className="w-full py-12 md:py-16 bg-blue-50 rounded-lg mb-6">
            <div className="space-y-8 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <AnimatedSection animationType="rotate" delay={200}>
                    <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">Support</Badge>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={400}>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                      Support and Resources
                    </h2>
                  </AnimatedSection>

                  <AnimatedSection animationType="fadeUp" delay={600}>
                    <p className="max-w-[700px] text-gray-600 text-base md:text-lg text-center">
                      Get help when you need it with our comprehensive support system and community resources.
                    </p>
                  </AnimatedSection>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StaggeredItems staggerDelay={200} animationType="scale">
                  {[
                    {
                      icon: MessageSquare,
                      title: "Live Chat",
                      description:
                        "Connect instantly with our support team for real-time help with any platform questions.",
                    },
                    {
                      icon: FileText,
                      title: "Help Center",
                      description:
                        "Explore a wealth of FAQs, troubleshooting guides, and video tutorials in our comprehensive Help Center.",
                    },
                    {
                      icon: Users,
                      title: "BiT Community Forum",
                      description:
                        "Join the BiT student community to share tips, ask questions, and collaborate with peers.",
                    },
                  ].map((support) => {
                    const IconComponent = support.icon
                    return (
                      <div
                        key={support.title}
                        className="rounded-lg border border-gray-200 bg-white p-6 text-center transform transition-all duration-500 hover:shadow-lg hover:scale-110 hover:-translate-y-3 hover:rotate-1 group"
                      >
                        <div className="flex items-center gap-2 mb-2 justify-center">
                          <IconComponent className="h-4 w-4 text-blue-600 transition-all duration-300 group-hover:scale-125 group-hover:text-blue-700 group-hover:rotate-12" />
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                            {support.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 text-center group-hover:text-gray-700 transition-colors duration-300">
                          {support.description}
                        </p>
                      </div>
                    )
                  })}
                </StaggeredItems>
              </div>
            </div>
          </AnimatedSection>

          {/* CTA Section */}
          <AnimatedSection animationType="scale" className="w-full py-12 md:py-16 bg-gray-100 rounded-lg">
            <div className="space-y-6 px-6 md:px-8 text-center">
              <div className="space-y-3">
                <AnimatedSection animationType="fadeUp" delay={200}>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                    Get Started
                  </h2>
                </AnimatedSection>

                <AnimatedSection animationType="fadeUp" delay={400}>
                  <p className="max-w-[500px] mx-auto text-gray-600 text-base text-center">
                    Ready to streamline your final-year project? Join thousands of BiT students already using our
                    platform.
                  </p>
                </AnimatedSection>
              </div>

              <AnimatedSection animationType="scale" delay={600}>
                <div className="flex flex-col gap-3 sm:flex-row justify-center">
                  <Button
                    size="lg"
                    className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:-translate-y-1 transform"
                    asChild
                  >
                    <Link href="/register">Register Now</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1 transform"
                    asChild
                  >
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </AnimatedSection>
            </div>
          </AnimatedSection>
        </div>
      </main>

      {/* Footer */}
      <AnimatedSection animationType="fadeUp" className="bg-slate-50 py-12 border-t">
        <Container>
          <div className="grid gap-8 md:grid-cols-4">
            {/* Logo and description */}
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="inline-flex items-center space-x-2 group">
                <GraduationCap className="h-5 w-5 text-blue-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span className="text-lg font-bold group-hover:text-blue-600 transition-colors duration-300">PRP</span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                A comprehensive platform for managing final-year projects at Bahir Dar Institute of Technology (BiT).
              </p>
              <div className="mt-4 flex flex-col space-y-2">
                <a
                  href="mailto:contact@bit.edu.et"
                  className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 flex items-center gap-2 hover:translate-x-1"
                >
                  <Mail className="h-4 w-4" />
                  <span>contact@bit.edu.et</span>
                </a>
                <a
                  href="tel:+251582266595"
                  className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 flex items-center gap-2 hover:translate-x-1"
                >
                  <Phone className="h-4 w-4" />
                  <span>+251 58 226 6595</span>
                </a>
                <div className="text-sm text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>
                    Bahir Dar Institute of Technology
                    <br />
                    Bahir Dar, Ethiopia
                  </span>
                </div>
              </div>
            </div>

            {/* Links - symmetrically arranged in columns */}
            <div className="col-span-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Platform</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/features"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/student-guide"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Student Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faculty-resources"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Faculty Resources
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help-center"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tutorials"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Tutorials
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/accessibility"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Accessibility
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Bahir Dar Institute of Technology. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link
                href="/privacy"
                className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1 transition-all duration-300 hover:scale-105"
              >
                <FileText className="h-3 w-3" />
                <span>Privacy Policy</span>
              </Link>
              <Link
                href="/terms"
                className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1 transition-all duration-300 hover:scale-105"
              >
                <FileText className="h-3 w-3" />
                <span>Terms of Service</span>
              </Link>
              <a
                href="https://bit.edu.et"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1 transition-all duration-300 hover:scale-105"
              >
                <GraduationCap className="h-3 w-3" />
                <span>BiT Website</span>
              </a>
            </div>
          </div>
        </Container>
      </AnimatedSection>
    </div>
  )
}
