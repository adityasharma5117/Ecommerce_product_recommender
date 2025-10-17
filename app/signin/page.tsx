"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Chrome, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Signing in...",
        description: "Redirecting you to your dashboard",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4"
            >
              <Chrome className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-600">
              Sign in to get personalized product recommendations tailored just for you
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 shadow-sm"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Chrome className="w-5 h-5 mr-2" />
              )}
              {loading ? "Signing in..." : "Continue with Google"}
            </Button>

            <div className="text-center">
              <p className="text-xs text-slate-500">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-slate-600">
            New to our platform? Sign in with Google to get started with personalized recommendations
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
