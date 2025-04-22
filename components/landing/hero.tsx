"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowRight, Users, Database, MessageSquare, ListChecks } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24 bg-white">
      {/* Remove decorative background and use plain white */}
      
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 px-3 py-1 text-sm font-medium" variant="outline">
              <span className="text-blue-600 font-semibold mr-1">BiT</span> • Final Year Projects
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Project Repository Platform for{" "}
              <span className="text-blue-600">BiT</span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-gray-600">
              A comprehensive solution for managing final-year projects at Bahir Dar Institute of Technology.
              Distributed repository, collaboration tools, and streamlined workflows for students, advisors, and evaluators.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
              <Button size="lg" asChild>
                <Link href="/register" className="flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login" className="flex items-center gap-2">
                  Login
                </Link>
              </Button>
            </div>

            {/* Feature highlights with symmetrical layout */}
            <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-4 text-center">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-white/60 shadow-sm border hover:border-blue-600/30 hover:shadow-md transition-all">
                    <Users className="h-6 w-6 text-blue-600 mb-2" />
                    <h3 className="font-medium">Easy Collaboration</h3>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold">Seamless Team Collaboration</h4>
                    <p className="text-sm text-muted-foreground">
                      Work together effortlessly with real-time collaboration tools and role-based access controls.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-white/60 shadow-sm border hover:border-blue-600/30 hover:shadow-md transition-all">
                    <ArrowRight className="h-6 w-6 text-blue-600 mb-2" />
                    <h3 className="font-medium">Version Control</h3>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold">Vec Version Control System</h4>
                    <p className="text-sm text-muted-foreground">
                      Track changes, manage versions, and collaborate without conflicts using our integrated Vec system.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-white/60 shadow-sm border hover:border-blue-600/30 hover:shadow-md transition-all">
                    <MessageSquare className="h-6 w-6 text-blue-600 mb-2" />
                    <h3 className="font-medium">Communication</h3>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold">Integrated Communication</h4>
                    <p className="text-sm text-muted-foreground">
                      Built-in chat, commenting, and feedback tools to streamline communication between students and advisors.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-white/60 shadow-sm border hover:border-blue-600/30 hover:shadow-md transition-all">
                    <ListChecks className="h-6 w-6 text-blue-600 mb-2" />
                    <h3 className="font-medium">Task Management</h3>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-semibold">Task Tracking & Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Organize tasks, set deadlines, and track project progress with comprehensive task management tools.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </motion.div>

          {/* Project Collaboration Illustration */}
          <motion.div
            className="mt-16 sm:mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* <div className="relative mx-auto overflow-hidden rounded-lg bg-gray-50 shadow-xl">
              <div className="flex h-[300px] md:h-[400px] items-center justify-center">
                <div className="text-center p-6">
                  <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Student-Advisor Collaboration</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Connect students with advisors and evaluators in a structured environment designed 
                    to facilitate feedback, collaboration, and successful project completion.
                  </p>
                </div>
              </div>
            </div> */}
          </motion.div>
        </div>
      </Container>
    </section>
  );
} 