"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, BookOpen, ArrowUpRight, GraduationCap, ClipboardCheck } from "lucide-react";

export function CTA() {
  return (
    <section className="py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-50">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl" />
      </div>
      
      <Container className="relative z-10">
        <motion.div 
          className="text-center mx-auto max-w-2xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Elevate Your Final-Year Project Experience
          </h2>
          <p className="text-xl text-gray-600">
            Join the BiT community already using the platform to streamline their academic projects
          </p>
        </motion.div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Main CTA Card */}
          <motion.div
            className="md:col-span-2 lg:col-span-1 relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-8 shadow-xl border border-white/10"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            {/* Background pattern */}
            <div className="absolute top-0 left-0 h-full w-full opacity-15">
              <svg
                className="h-full w-full"
                viewBox="0 0 80 80"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <g fill="#FFF" fillOpacity="1">
                  <path d="M20 25h10v-5H20v5zm-5-10h10v-5H15v5zM20 10h10V5H20v5zM15 20h10v-5H15v5zm5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5z" />
                </g>
              </svg>
            </div>
            
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-white/20 backdrop-blur-sm mx-auto border border-white/30 shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mb-4 text-center">
                Get started today
              </h2>
              <p className="text-center text-lg leading-8 text-white/90 mb-8">
                Experience a streamlined project management system designed specifically for BiT students and faculty.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-700 font-medium hover:bg-blue-50 hover:text-blue-800 hover:scale-105 transition-all w-full shadow-md"
                  asChild
                >
                  <Link href="/register" className="flex items-center justify-center gap-2">
                    <span className="font-medium">Register Now</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="rounded-xl border border-white/10 p-8 shadow-xl bg-gradient-to-br from-sky-500 to-cyan-400 relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-300/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl"></div>
            
            <div className="absolute top-0 left-0 h-full w-full opacity-15">
              <svg
                className="h-full w-full"
                viewBox="0 0 80 80"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <g fill="#FFF" fillOpacity="1">
                  <path d="M20 25h10v-5H20v5zm-5-10h10v-5H15v5zM20 10h10V5H20v5zM15 20h10v-5H15v5zm5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5z" />
                </g>
              </svg>
            </div>
            
            <div className="flex flex-col h-full relative z-10">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30 shadow-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Student Guide</h3>
              <p className="text-white/90 mb-6 flex-grow">
                Comprehensive guides and tutorials to help you make the most of the platform for your final-year project.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-sky-600 transition-all" 
                asChild
              >
                <Link href="/student-guide" className="flex items-center gap-1">
                  <span>View Student Guide</span>
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            className="rounded-xl border border-white/10 p-8 shadow-xl bg-gradient-to-br from-blue-500 to-violet-400 relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-400/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-300/20 rounded-full blur-3xl"></div>
            
            <div className="absolute top-0 left-0 h-full w-full opacity-15">
              <svg
                className="h-full w-full"
                viewBox="0 0 80 80"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <g fill="#FFF" fillOpacity="1">
                  <path d="M20 25h10v-5H20v5zm-5-10h10v-5H15v5zM20 10h10V5H20v5zM15 20h10v-5H15v5zm5 5h10v-5H20v5zm5 5h10v-5H25v5zm-5 5h10v-5H20v5z" />
                </g>
              </svg>
            </div>
            
            <div className="flex flex-col h-full relative z-10">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30 shadow-lg">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Faculty Resources</h3>
              <p className="text-white/90 mb-6 flex-grow">
                Tools and guides for faculty members to facilitate project advising, evaluation, and student feedback.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-violet-600 transition-all" 
                asChild
              >
                <Link href="https://r.search.yahoo.com/_ylt=Awrhbr4ddS9oJQIA0IhXNyoA;_ylu=Y29sbwNiZjEEcG9zAzEEdnRpZAMEc2VjA3Ny/RV=2/RE=1749150237/RO=10/RU=https%3a%2f%2fwww.bdu.edu.et%2f/RK=2/RS=cFVw_U1132Qp3TQLiiDldA0tuOM-"
      className="flex items-center gap-1">
                 
                  <span>Faculty Portal</span>
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
} 