"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#151B23] px-4 text-white">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo Section */}
        <div className="space-y-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <Ticket className="h-6 w-6" />
            <span>TixHub</span>
          </Link>
          <div className="h-px w-full bg-white/10" />
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
} 