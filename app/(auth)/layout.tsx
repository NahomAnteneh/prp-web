import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | PRP BiT",
    default: "Authentication | PRP BiT",
  },
  description: "Sign in or register to access the Project Resource Platform for BiT students.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 