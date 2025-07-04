"use client";

import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to sign in to your account
        </p>
      </div>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
} 