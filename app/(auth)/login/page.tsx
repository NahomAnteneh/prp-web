"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { CheckCircle2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isAuthenticated, isLoading, authError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({
    identifier: "",
    password: "",
    general: "",
  });

  // If callbackUrl exists in query string, use it for redirect after login
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // Check for registration success message
    const registered = searchParams.get("registered");
    if (registered === "true") {
      setShowSuccessMessage(true);
      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Set error message if error exists in query string
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "An error occurred during sign in";
      if (error === "CredentialsSignin") {
        errorMessage = "Invalid credentials. Please try again.";
      }
      setFormErrors(prev => ({ ...prev, general: errorMessage }));
    }

    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && user) {
      // Redirect based on user role
      const userRole = user.role;
      let targetPath = "/"; // Default dashboard
      
      // Check user role to determine the appropriate dashboard
      if (userRole === "ADVISOR") {
        targetPath = "/advisor-dashboard";  
      } else if (userRole === "EVALUATOR") {
        targetPath = "/evaluator-dashboard";
      } else if (userRole === "ADMINISTRATOR") {
        targetPath = "/admin-dashboard";
      }
      
      router.push(targetPath);
    }
  }, [searchParams, router, isAuthenticated, user]);

  // Update form errors when auth error changes
  useEffect(() => {
    if (authError) {
      setFormErrors(prev => ({ ...prev, general: authError }));
    }
  }, [authError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing again
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
    // Also clear general error
    if (formErrors.general) {
      setFormErrors(prev => ({ ...prev, general: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      identifier: "",
      password: "",
      general: "",
    };

    // Identifier validation (email or username)
    if (!formData.identifier) {
      errors.identifier = "Email or username is required";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Use our custom login function from useAuth
      const result = await login(formData.identifier, formData.password, callbackUrl);
      
      if (!result.success) {
        setFormErrors(prev => ({
          ...prev,
          general: result.error || "Invalid credentials. Please try again."
        }));
      }
      // No need to redirect here as the useAuth hook handles it
    } catch (error) {
      console.error("Login error:", error);
      setFormErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : "Invalid credentials. Please try again."
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading indicator during session check
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 p-8 md:p-12 xl:p-16 flex flex-col justify-center relative">
        <div className="absolute top-8 left-8 md:top-12 md:left-12 xl:top-16 xl:left-16">
          <Link href="/" className="inline-flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">PRP</span>
            <Badge variant="outline" className="ml-2 hidden sm:inline-flex">BiT</Badge>
          </Link>
        </div>
        
        <motion.div 
          className="max-w-md mx-auto w-full mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-3 text-gray-600">
              Sign in to your PRP account to manage your projects and continue your work at BiT.
            </p>
          </div>

          {showSuccessMessage && (
            <motion.div 
              className="mb-6 p-4 bg-green-50 rounded-lg flex items-center gap-3 text-green-800 shadow-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p>Account created successfully! Please sign in.</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {formErrors.general && (
              <div className="p-4 bg-red-50 rounded-lg text-red-600 text-sm shadow-sm">
                {formErrors.general}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-gray-700">Email or Username</Label>
              <Input 
                id="identifier"
                name="identifier"
                type="text"
                placeholder="example@example.com or username"
                value={formData.identifier}
                onChange={handleChange}
                disabled={submitting}
                className={`border-0 bg-gray-50 shadow-sm ${formErrors.identifier ? "ring-2 ring-red-500" : ""}`}
              />
              {formErrors.identifier && (
                <p className="text-sm text-red-500">{formErrors.identifier}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={submitting}
                className={`border-0 bg-gray-50 shadow-sm ${formErrors.password ? "ring-2 ring-red-500" : ""}`}
              />
              {formErrors.password && (
                <p className="text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign in"}
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link 
              href="/register" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Register
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right Column - Hero/Info Section */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative h-full flex flex-col justify-center items-center p-12 z-10">
          <div className="w-full max-w-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 text-center"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm mb-6 mx-auto">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Manage Final-Year Projects</h2>
              <p className="text-white/90 text-lg leading-relaxed">
                Streamline your academic projects with our comprehensive platform designed for BiT students, advisors, and evaluators.
              </p>
            </motion.div>

            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">Academic Excellence</h3>
                  <p className="text-white/80">Tools designed specifically for academic project requirements at BiT.</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-start gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">Version Control</h3>
                  <p className="text-white/80">Track changes and maintain project history with integrated version control.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 