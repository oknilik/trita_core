"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      // Redirect based on auth state
      if (isSignedIn) {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Show a brief loading state while checking auth
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <p className="text-sm text-gray-600">Átirányítás...</p>
      </div>
    </div>
  );
}
