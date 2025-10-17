"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative h-10 w-10">
              <Image
                src="/logo.svg"
                alt="E-commerce Recommender Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-900">
                SmartShop
              </h1>
              <p className="text-xs text-slate-600">
                AI-Powered Recommendations
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button 
                    variant="ghost" 
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    My Recommendations
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
                
                <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600">
                  <span>Welcome,</span>
                  <span className="font-medium text-slate-900">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </div>
              </>
            ) : (
              <Link href="/signin">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
