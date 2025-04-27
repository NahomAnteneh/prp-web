"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { GraduationCap, Users, Compass, GitBranch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    idNumber: "",
    institutionalEmail: "",
    department: "",
    batchYear: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    idNumber: "",
    institutionalEmail: "",
    department: "",
    batchYear: "",
    password: "",
    confirmPassword: "",
    general: "",
  });

  useEffect(() => {
    // Check if user is already authenticated (commented out in original code)
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string): void => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      firstName: "",
      lastName: "",
      username: "",
      idNumber: "",
      institutionalEmail: "",
      department: "",
      batchYear: "",
      password: "",
      confirmPassword: "",
      general: "",
    };

    // First Name validation
    if (!formData.firstName) {
      errors.firstName = "First name is required";
      isValid = false;
    }

    // Last Name validation
    if (!formData.lastName) {
      errors.lastName = "Last name is required";
      isValid = false;
    }

    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
      isValid = false;
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
      isValid = false;
    }

    // ID Number validation
    if (!formData.idNumber) {
      errors.idNumber = "ID number is required";
      isValid = false;
    }

    // Institutional Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.institutionalEmail) {
      errors.institutionalEmail = "Institutional email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.institutionalEmail)) {
      errors.institutionalEmail = "Please enter a valid email address";
      isValid = false;
    } else if (!formData.institutionalEmail.endsWith('bdu.edu.et')) {
      errors.institutionalEmail = "Please use your BiT institutional email";
      isValid = false;
    }

    // Department validation
    if (!formData.department) {
      errors.department = "Department is required";
      isValid = false;
    }

    // Batch Year validation
    if (!formData.batchYear) {
      errors.batchYear = "Batch year is required";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          idNumber: formData.idNumber,
          email: formData.institutionalEmail,
          password: formData.password,
          department: formData.department,
          batchYear: formData.batchYear
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await response.json();
      console.log("Registration successful", data);
      
      router.push("/login?registered=true");
    } catch (error) {
      console.error("Registration error:", error);
      setFormErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : "Registration failed. Please try again."
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const departments = [
    { value: "computer-science", label: "Computer Science" },
    { value: "information-technology", label: "Information Technology" },
    { value: "software-engineering", label: "Software Engineering" },
    { value: "information-systems", label: "Information Systems" },
    { value: "computer-engineering", label: "Computer Engineering" },
  ];

  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 7 }, (_, i) => (currentYear - 5 + i).toString());

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Column - Registration Form */}
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
              Join PRP at BiT
            </h1>
            <p className="mt-3 text-gray-600">
              Create an account to start managing your final-year projects with our comprehensive platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formErrors.general && (
              <div className="p-4 bg-red-50 rounded-lg text-red-600 text-sm shadow-sm">
                {formErrors.general}
              </div>
            )}
            
            {/* First Name and Last Name Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                <Input 
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Your first name"
                  className={`border-0 bg-gray-50 shadow-sm ${formErrors.firstName ? "ring-2 ring-red-500" : ""}`}
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-500">{formErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                <Input 
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Your last name"
                  className={`border-0 bg-gray-50 shadow-sm ${formErrors.lastName ? "ring-2 ring-red-500" : ""}`}
                />
                {formErrors.lastName && (
                  <p className="text-sm text-red-500">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Existing Fields */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">Username</Label>
              <Input 
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                className={`border-0 bg-gray-50 shadow-sm ${formErrors.username ? "ring-2 ring-red-500" : ""}`}
              />
              {formErrors.username && (
                <p className="text-sm text-red-500">{formErrors.username}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-gray-700">Student ID</Label>
              <Input 
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="Your BiT student ID number"
                className={`border-0 bg-gray-50 shadow-sm ${formErrors.idNumber ? "ring-2 ring-red-500" : ""}`}
              />
              {formErrors.idNumber && (
                <p className="text-sm text-red-500">{formErrors.idNumber}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="institutionalEmail" className="text-gray-700">Institutional Email</Label>
              <Input 
                id="institutionalEmail"
                name="institutionalEmail"
                type="email"
                value={formData.institutionalEmail}
                onChange={handleChange}
                placeholder="your.name@bdu.edu.et"
                className={`border-0 bg-gray-50 shadow-sm ${formErrors.institutionalEmail ? "ring-2 ring-red-500" : ""}`}
              />
              {formErrors.institutionalEmail && (
                <p className="text-sm text-red-500">{formErrors.institutionalEmail}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-gray-700">Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => handleSelectChange("department", value)}
                >
                  <SelectTrigger
                    id="department"
                    className={`border-0 bg-gray-50 shadow-sm ${formErrors.department ? "ring-2 ring-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.department && (
                  <p className="text-sm text-red-500">{formErrors.department}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batchYear" className="text-gray-700">Batch Year</Label>
                <Select 
                  value={formData.batchYear} 
                  onValueChange={(value) => handleSelectChange("batchYear", value)}
                >
                  <SelectTrigger
                    id="batchYear"
                    className={`border-0 bg-gray-50 shadow-sm ${formErrors.batchYear ? "ring-2 ring-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchYears.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.batchYear && (
                  <p className="text-sm text-red-500">{formErrors.batchYear}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input 
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                className={`border-0 bg-gray-50 shadow-sm ${formErrors.password ? "ring-2 ring-red-500" : ""}`}
              />
              {formErrors.password && (
                <p className="text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
              <Input 
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={`border-0 bg-gray-50 shadow-sm ${formErrors.confirmPassword ? "ring-2 ring-red-500" : ""}`}
              />
              {formErrors.confirmPassword && (
                <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create Account"}
            </Button>
            
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
      
      {/* Right Column - Hero/Info Section */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 relative overflow-hidden">
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
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Final-Year Project Success</h2>
              <p className="text-white/90 text-lg leading-relaxed">
                Join our platform designed specifically for BiT students to collaborate with advisors and showcase your academic achievements.
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
                  <Compass className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">Project Guidance</h3>
                  <p className="text-white/80">Follow department standards and requirements with built-in templates and guidelines.</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-start gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <GitBranch className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">Distributed Repository</h3>
                  <p className="text-white/80">Store project resources and track changes with integrated version control.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}