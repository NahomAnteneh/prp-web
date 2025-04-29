import { AuthProvider } from "@/components/providers/auth-provider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your PRP account to manage your final-year projects at BiT.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>
  <AuthProvider>
    {children}
  </AuthProvider>
  </>;
} 