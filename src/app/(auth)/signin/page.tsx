"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<"magic" | "password">("magic");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/app");
    }
  }, [status, router]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/app",
      });
      if (result?.error) {
        toast.error("Failed to send magic link");
      } else {
        setSent(true);
        toast.success("Check your email for the magic link!");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/app",
      });
      if (result?.error) {
        toast.error("Invalid email or password");
      } else if (result?.ok) {
        router.push("/app");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-indigo-600 p-12 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold">RevBook</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Fill empty slots.<br />Boost revenue.
          </h2>
          <p className="text-lg text-indigo-200 max-w-md">
            Automatically apply smart discounts to unfilled appointment slots
            and send targeted offers to your customers.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold">40%</div>
              <div className="text-sm text-indigo-200">More bookings</div>
            </div>
            <div>
              <div className="text-3xl font-bold">2x</div>
              <div className="text-sm text-indigo-200">Revenue recovery</div>
            </div>
            <div>
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm text-indigo-200">Empty slots</div>
            </div>
          </div>
        </div>

        <p className="text-sm text-indigo-300">
          Trusted by service businesses everywhere
        </p>
      </div>

      {/* Right - Sign in form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">RevBook</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {mode === "magic"
                ? "Sign in with a magic link sent to your email"
                : "Sign in with your email and password"}
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">Check your email</p>
              <p className="mt-1 text-sm text-gray-600">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Try another method
              </button>
            </div>
          ) : mode === "magic" ? (
            <form onSubmit={handleMagicLink} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Continue with email
              </Button>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">or</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMode("password")}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Sign in with password
              </button>
              <p className="text-center text-xs text-gray-400">
                We&#39;ll send you a secure sign-in link. No password needed.
              </p>
            </form>
          ) : (
            <form onSubmit={handlePassword} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                id="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign in
              </Button>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">or</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMode("magic")}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Sign in with magic link
              </button>
              <p className="text-center text-xs text-gray-400">
                Forgot your password? Use a magic link to sign in and reset it from Settings.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
