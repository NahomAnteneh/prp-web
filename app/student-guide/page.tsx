"use client"

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

export default function StudentGuidePage() {
  return (
    <div className="flex flex-col min-h-dvh bg-blue-50">
      {/* Navigation */}
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-4xl mx-auto px-4">
          {/* Hero Section */}
          <section className="w-full py-12 md:py-16 bg-blue-600 rounded-lg mb-6">
            <div className="space-y-6 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">Student Guide</Badge>
                  <h1 className="text-2xl md:text-4xl font-bold tracking-tighter text-white text-center">
                    BiT Project Repository Platform Guide
                  </h1>
                  <p className="max-w-[700px] text-blue-100 text-base md:text-lg text-center">
                    Welcome, BiT Students! Discover how to streamline your final-year project with our intuitive
                    platform, designed to empower collaboration, organization, and success.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Getting Started Section */}
          <section className="w-full py-12 md:py-16 bg-white rounded-lg mb-6">
            <div className="space-y-8 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">Getting Started</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                    Begin Your Journey
                  </h2>
                  <p className="max-w-[700px] text-gray-600 text-base md:text-lg text-center">
                    Set up your account and explore your personalized dashboard to manage your final-year project
                    effectively.
                  </p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Account Setup</h3>
                  </div>
                  <p className="text-gray-600 text-center text-sm">
                    Kickstart your journey by clicking Register Now on the homepage. Use your BiT credentials to create
                    an account and unlock your personalized dashboard, your command center for project management.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Dashboard Overview</h3>
                  </div>
                  <p className="text-gray-600 text-center text-sm">
                    The dashboard is your one-stop hub for all project activities. Monitor tasks, access resources,
                    communicate with your team, and track progress—all in one intuitive interface tailored for BiT
                    students.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Features Section */}
          <section className="w-full py-12 md:py-16 bg-blue-50 rounded-lg mb-6">
            <div className="space-y-8 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">Key Features</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                    Features for Students
                  </h2>
                  <p className="max-w-[700px] text-gray-600 text-base md:text-lg text-center">
                    Comprehensive tools and features designed specifically to support your academic project success.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Distributed Repository</h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Securely store project documents, code, and resources in a centralized system, accessible to your
                    team and advisors based on their roles.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <GitBranch className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Version Control</h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Effortlessly track changes to your files, compare versions, and revert to earlier drafts to maintain
                    a polished project history.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Collaboration Tools</h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Work seamlessly with teammates and advisors using integrated chat and real-time document editing,
                    eliminating the need for external apps.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Task Management</h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Stay organized with task assignments, deadlines, and progress trackers to ensure your project stays
                    on schedule.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Project Guidance</h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Leverage BiT-specific templates and guidelines to craft proposals, reports, and presentations that
                    meet academic standards.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Academic Integrity Tools</h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Use built-in plagiarism detection and citation tools to ensure your work is original and properly
                    referenced.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="w-full py-12 md:py-16 bg-white rounded-lg mb-6">
            <div className="space-y-8 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">FAQ</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                    Frequently Asked Questions
                  </h2>
                  <p className="max-w-[700px] text-gray-600 text-base md:text-lg text-center">
                    Common questions and answers to help you get the most out of the platform.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900">How do I share my project with my advisor?</h3>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Easily share your project by selecting the "Share" option in your repository, granting access based
                    on role permissions.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900">What if I face technical issues?</h3>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Reach out to our support team via the Help section or email [support@bitplatform.edu] for prompt
                    assistance.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900">Can I work offline?</h3>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Download project files for offline access; note that most features, like collaboration and
                    submissions, require an internet connection.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section className="w-full py-12 md:py-16 bg-blue-50 rounded-lg mb-6">
            <div className="space-y-8 px-6 md:px-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <Badge className="mb-4 text-sm px-3 py-1 bg-blue-100 text-blue-800">Support</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                    Support and Resources
                  </h2>
                  <p className="max-w-[700px] text-gray-600 text-base md:text-lg text-center">
                    Get help when you need it with our comprehensive support system and community resources.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900">Live Chat</h3>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Connect instantly with our support team for real-time help with any platform questions.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900">Help Center</h3>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Explore a wealth of FAQs, troubleshooting guides, and video tutorials in our comprehensive Help
                    Center.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900">BiT Community Forum</h3>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Join the BiT student community to share tips, ask questions, and collaborate with peers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="w-full py-12 md:py-16 bg-gray-100 rounded-lg">
            <div className="space-y-6 px-6 md:px-8 text-center">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-gray-900 text-center">
                  Get Started
                </h2>
                <p className="max-w-[500px] mx-auto text-gray-600 text-base text-center">
                  Ready to streamline your final-year project? Join thousands of BiT students already using our
                  platform.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row justify-center">
                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700" asChild>
                  <Link href="/register">Register Now</Link>
                </Button>
                <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-slate-50 py-12 border-t">
        <Container>
          <div className="grid gap-8 md:grid-cols-4">
            {/* Logo and description */}
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="inline-flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-bold">PRP</span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                A comprehensive platform for managing final-year projects at Bahir Dar Institute of Technology (BiT).
              </p>
              <div className="mt-4 flex flex-col space-y-2">
                <a
                  href="mailto:contact@bit.edu.et"
                  className="text-sm text-muted-foreground hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>contact@bit.edu.et</span>
                </a>
                <a
                  href="tel:+251582266595"
                  className="text-sm text-muted-foreground hover:text-blue-600 transition-colors flex items-center gap-2"
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
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
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
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Student Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faculty-resources"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Faculty Resources
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help-center"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tutorials"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
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
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/accessibility"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Accessibility
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
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
                className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                <span>Privacy Policy</span>
              </Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Terms of Service</span>
              </Link>
              <a
                href="https://bit.edu.et"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1"
              >
                <GraduationCap className="h-3 w-3" />
                <span>BiT Website</span>
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
