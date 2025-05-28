import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background py-6 mt-8">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center px-4 md:px-8">
        <div className="flex items-center mb-4 md:mb-0 text-center md:text-left">
          <span className="text-sm text-muted-foreground">
            © {currentYear} Project Repository Platform. All rights reserved.
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <Link 
            href="/terms" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link 
            href="/privacy" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link 
            href="/help" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Help
          </Link>
          <Link 
            href="/contact" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}