import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Mail, Phone, MapPin, FileText, GraduationCap } from "lucide-react";

export function Footer() {
  return (
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
              A comprehensive platform for managing final-year projects at Bahir Dar
              Institute of Technology (BiT).
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
                <span>Bahir Dar Institute of Technology<br />Bahir Dar, Ethiopia</span>
              </div>
            </div>
          </div>

          {/* Links - symmetrically arranged in columns */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Platform
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/student-guide" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  Student Guide
                </Link>
              </li>
              <li>
                <Link href="/faculty-resources" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  Faculty Resources
                </Link>
              </li>
              <li>
                <Link href="/help-center" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  Tutorials
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Legal
            </h3>
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
                <Link href="/accessibility" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                  Accessibility
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-muted-foreground hover:text-blue-600 transition-colors">
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
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1">
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
  );
} 