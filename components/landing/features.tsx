"use client";

import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  GitBranch, 
  GitMerge, 
  Users, 
  MessageSquare,
  ListChecks,
  ShieldCheck,
  PenTool,
  Compass,
  Database,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600/10 text-blue-600">
            {icon}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Features() {
  const features = [
    {
      icon: <Database className="h-6 w-6" />,
      title: "Distributed Repository",
      description:
        "Store all project documents, source code, and resources in a distributed system, accessible to all project stakeholders as per their roles.",
    },
    {
      icon: <GitBranch className="h-6 w-6" />,
      title: "Vec Version Control",
      description:
        "Built-in version control system specially designed for academic projects, allowing students to track changes and maintain project history.",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Communication Tools",
      description:
        "Integrated chat and commenting features that enable direct communication between students and advisors, reducing the need for external communication channels.",
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: "Task Management",
      description:
        "Comprehensive task tracking with deadlines, assignments, and progress monitoring to keep projects on schedule and meet academic requirements.",
    },
    {
      icon: <PenTool className="h-6 w-6" />,
      title: "Structured Feedback",
      description:
        "Formalized feedback mechanism allowing advisors and evaluators to provide clear, documented guidance on project components.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Role-Based Access",
      description:
        "Specific access controls for Students, Advisors, Evaluators, and Administrators, ensuring appropriate access to project resources and features.",
    },
    {
      icon: <GitMerge className="h-6 w-6" />,
      title: "Collaborative Editing",
      description:
        "Work together on documents and code asynchronously, with automatic conflict resolution to prevent overwritten work.",
    },
    {
      icon: <Compass className="h-6 w-6" />,
      title: "Project Guidance",
      description:
        "Built-in templates and guidelines for final-year projects at BiT, helping students follow department standards and requirements.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Academic Integrity",
      description:
        "Plagiarism detection and citation tools to ensure academic honesty and proper attribution in all project submissions.",
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge className="mb-4" variant="secondary">Platform Benefits</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Addressing the Challenges of Manual Project Management
          </h2>
          <p className="text-lg text-gray-600">
            Our platform replaces fragmented communication and version control challenges with 
            streamlined workflows, enhanced collaboration, and comprehensive project tracking.
          </p>
        </div>

        <div className="mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>

        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex items-center justify-center">
              <Separator className="w-12 sm:w-24" />
              <span className="mx-6 text-gray-600 font-medium text-lg px-4">Learn More</span>
              <Separator className="w-12 sm:w-24" />
            </div>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="group"
              asChild
            >
              <Link href="/about_us" className="flex items-center gap-2">
                About the Platform
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
} 