import { isAuthenticated, getCurrentUser } from "@/lib/auth";
import { CTA } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import StudentDashboard from "@/components/student/dashboard/student-dashboard";
import { Footer } from "@/components/footer";
import { Role } from "@prisma/client";
import AdvisorDashboardTabs from "@/components/advisor/dashboard/AdvisorDashboardTabs";
import EvaluatorDashboard from "@/components/evaluator/dashboard/EvaluatorDashboard";

export const metadata: Metadata = {
  title: "Project Repository Platform - BiT",
  description: "Streamlining Final-Year Projects at Bahir Dar Institute of Technology (BiT) with distributed project management and collaboration.",
};

export default async function Home() {
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    // Get the current user to check their role
    const user = await getCurrentUser();
    const userRole = user?.role || '';
    
    // Render appropriate dashboard based on user role
    switch (userRole) {
      case Role.STUDENT:
        return <StudentDashboard />;
      case Role.ADVISOR:
        return <AdvisorDashboardTabs />;
      case Role.EVALUATOR:
        return <EvaluatorDashboard />;
      default:
        // Fallback to student dashboard or show an error
        return <div className="p-8">Unknown user role: {userRole}</div>;
    }
  } else {
    // Show landing page for non-logged-in users
    return (
      <>
        <Navbar />
        <Hero />
        <Features />
        <CTA />
        <Footer />
      </>
    );
  }
} 