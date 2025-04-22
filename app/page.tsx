import { isAuthenticated } from "@/lib/auth";
import { CTA } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import StudentDashboard from "@/components/dashboard/student-dashboard";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Project Repository Platform - BiT",
  description: "Streamlining Final-Year Projects at Bahir Dar Institute of Technology (BiT) with distributed project management and collaboration.",
};

export default async function Home() {
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    // Show the dashboard content directly on the root page for logged-in users
    // Check user role to determine the appropriate dashboard
    return <StudentDashboard />;
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