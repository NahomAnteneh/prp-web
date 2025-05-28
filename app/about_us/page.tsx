"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { motion, useAnimation, useInView } from "framer-motion"
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  FileText,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Search,
  Users,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar";
import {Footer} from "@/components/footer";

// Loading component integrated directly in the page
const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            delay: delay * 0.1,
          },
        },
      }}
    >
      <Card className="h-full border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">{icon}</div>
          <h3 className="text-xl font-semibold text-blue-800 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface SectionTitleProps {
  title: string
  subtitle: string
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle }) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <motion.div
      ref={ref}
      className="text-center mb-16"
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
          },
        },
      }}
    >
      <h2 className="text-3xl font-bold text-blue-800 sm:text-4xl mb-4">{title}</h2>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
    </motion.div>
  )
}

export default function AboutPage() {
  // Add loading state
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Show loading component while page is loading
  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-white">
      
    <Navbar />
  
      {/* Hero Section */}
<section className="relative flex items-center justify-center min-h-screen bg-blue-600 px-4 sm:px-6 lg:px-8 overflow-hidden">
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-90"></div>
    <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-10"></div>
  </div>

  <div className="relative text-center max-w-3xl">
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
    >
      BiT Project Repository Platform
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="mt-6 text-xl text-blue-50"
    >
      A comprehensive platform for Bahir Dar University Institute of Technology students to store, manage, and collaborate on final year projects.
    </motion.p>
  </div>
</section>


      {/* About the Platform Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionTitle
          title="About the Platform"
          subtitle="A dedicated repository system for Bahir Dar University Institute of Technology"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h3 className="text-2xl font-bold text-blue-700 mb-6">Empowering BiT Students</h3>
            <p className="text-lg text-gray-700 mb-4">
              The Project Repository Platform is specifically designed for Bahir Dar University Institute of Technology
              (BiT) to streamline the management of final-year projects for GC (Graduating Class) students.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Our platform provides a centralized system where students can store their project files, collaborate with
              team members, receive guidance from advisors, and undergo evaluation by faculty members.
            </p>
            <p className="text-lg text-gray-700">
              By digitizing the entire project lifecycle, we aim to enhance the quality of final-year projects and
              provide a more efficient experience for all stakeholders involved.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative h-[400px] rounded-lg overflow-hidden shadow-lg"
          >
            <Image
              src="/image/empower.jpg"
              alt="BiT Students Working"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Key Features"
            subtitle="Comprehensive tools designed specifically for BiT final-year projects"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="w-6 h-6 text-blue-600" />}
              title="Project Repository"
              description="Secure storage for all project files with version control, ensuring no work is ever lost and allowing easy tracking of changes."
              delay={1}
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-blue-600" />}
              title="Team Collaboration"
              description="Tools for students to form groups, assign tasks, and work together effectively on their final-year projects."
              delay={2}
            />
            <FeatureCard
              icon={<GraduationCap className="w-6 h-6 text-blue-600" />}
              title="Advisor Guidance"
              description="Structured workflow for advisors to monitor progress, provide feedback, and approve project milestones."
              delay={3}
            />
            <FeatureCard
              icon={<CheckCircle className="w-6 h-6 text-blue-600" />}
              title="Evaluation System"
              description="Comprehensive tools for evaluators to assess projects based on established criteria and provide structured feedback."
              delay={4}
            />
            <FeatureCard
              icon={<LayoutDashboard className="w-6 h-6 text-blue-600" />}
              title="Progress Tracking"
              description="Visual dashboards showing project status, upcoming deadlines, and completion metrics for all stakeholders."
              delay={5}
            />
            <FeatureCard
              icon={<Search className="w-6 h-6 text-blue-600" />}
              title="Project Archive"
              description="Searchable database of past projects, allowing students to learn from previous work and build upon existing knowledge."
              delay={6}
            />
          </div>
        </div>
      </section>

      {/* Repository Feature Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionTitle title="Project Repository" subtitle="Secure, organized storage for all your project files" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="order-2 md:order-1"
          >
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/image/download.jpg"
                alt="Project Repository Interface"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="order-1 md:order-2"
          >
            <h3 className="text-2xl font-bold text-blue-700 mb-6">Store and Manage Your Projects</h3>
            <p className="text-lg text-gray-700 mb-4">
              Our platform provides a centralized repository where BiT students can securely store all their final-year
              project files, from code to documentation.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-gray-700">
                  <span className="font-semibold text-blue-700">Vec Version Control:</span> Our custom-built version
                  control system tracks all changes, allowing you to revert to previous versions if needed.
                </span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-gray-700">
                  <span className="font-semibold text-blue-700">Organized Structure:</span> Hierarchical folder
                  organization keeps your project files neatly arranged and easily accessible.
                </span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-gray-700">
                  <span className="font-semibold text-blue-700">Access Control:</span> Granular permissions ensure only
                  authorized team members, advisors, and evaluators can access your files.
                </span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Advising Feature Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Advising Progress Tracking"
            subtitle="Streamlined communication between students and advisors"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h3 className="text-2xl font-bold text-blue-700 mb-6">Effective Advisor Guidance</h3>
              <p className="text-lg text-gray-700 mb-4">
                Our platform facilitates seamless interaction between BiT students and their project advisors, ensuring
                timely feedback and guidance throughout the project lifecycle.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <span className="font-semibold text-blue-700">Structured Feedback:</span> Advisors can provide
                    detailed comments directly on code and documents, with a clear history of all feedback.
                  </span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <span className="font-semibold text-blue-700">Milestone Tracking:</span> Set and monitor project
                    milestones with automated notifications for upcoming deadlines.
                  </span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">
                    <span className="font-semibold text-blue-700">Progress Visualization:</span> Visual dashboards show
                    project status and completion metrics for both students and advisors.
                  </span>
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/image/advising.jpg"
                  alt="Advising Interface"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Evaluation Feature Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionTitle title="Project Evaluation" subtitle="Comprehensive assessment tools for BiT faculty" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="order-2 md:order-1"
          >
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/image/evaluation.jpg"
                alt="Evaluation Interface"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="order-1 md:order-2"
          >
            <h3 className="text-2xl font-bold text-blue-700 mb-6">Fair and Transparent Evaluation</h3>
            <p className="text-lg text-gray-700 mb-4">
              Our platform provides BiT evaluators with tools to assess final-year projects fairly and transparently,
              based on established criteria.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-gray-700">
                  <span className="font-semibold text-blue-700">Structured Evaluation Forms:</span> Customized
                  assessment forms aligned with BiT project evaluation criteria.
                </span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-gray-700">
                  <span className="font-semibold text-blue-700">Code Review Tools:</span> Evaluators can review code
                  with syntax highlighting and inline commenting capabilities.
                </span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-gray-700">
                  <span className="font-semibold text-blue-700">Project History Access:</span> View the complete
                  development history to assess student progress and contributions.
                </span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Built with Modern Technology"
            subtitle="Leveraging the latest tools for a robust platform"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GitBranch className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">Next.js</h3>
              <p className="text-gray-600">Modern React framework with TypeScript for a responsive user interface</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">Go (Golang)</h3>
              <p className="text-gray-600">Efficient and reliable backend services for optimal performance</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">PostgreSQL</h3>
              <p className="text-gray-600">Robust database management for secure and reliable data storage</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GitBranch className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">Vec</h3>
              <p className="text-gray-600">Custom-built version control system designed for BiT students</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionTitle
          title="Developed by BiT Students"
          subtitle="A project by Computer Science students at Bahir Dar University"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 text-center"
          >
            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 overflow-hidden">
              <Image
                src="/placeholder.svg?height=96&width=96"
                alt="Nahom Anteneh"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold text-blue-700">Nahom Anteneh</h3>
            <p className="text-gray-600 mb-2">ID: 1404607</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 text-center"
          >
            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 overflow-hidden">
              <Image
                src="/image/nigest_image.jpg"
                alt="Nigist W/Micael"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold text-blue-700">Nigist W/Micael</h3>
            <p className="text-gray-600 mb-2">ID: 1308041</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-100px" }}
            className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 text-center"
          >
            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 overflow-hidden">
              <Image
                src="/placeholder.svg?height=96&width=96"
                alt="Bezawit Marew"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold text-blue-700">Bezawit Marew</h3>
            <p className="text-gray-600 mb-2">ID: 1404199</p>
          </motion.div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Under the guidance of <span className="font-semibold text-blue-700">Asnakew L.</span>, Faculty of Computing
          </p>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="bg-blue-600 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to Transform Your Project Experience?</h2>
            <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
              Join the Bahir Dar University community in revolutionizing how academic projects are managed and
              collaborated on.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Get Started <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="ml-4 bg-transparent border-white text-white hover:bg-blue-700"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
        
      </section> */}
      <Footer/>
    </div>
  )
}
