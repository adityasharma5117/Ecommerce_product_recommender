"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  product: Product;
  explanation: string;
}

export default function Dashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signin");
      } else {
        fetchRecommendations();
      }
    }
  }, [authLoading, user, router]);


  const fetchRecommendations = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const response = await fetch(
        `/api/recommendations?user_id=${user.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to load recommendations",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    if (!user) return;

    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
          action_type: "purchase",
        }),
      });

      if (response.ok) {
        toast({
          title: "Purchase recorded",
          description: "Product has been added to your purchases",
        });
      }
    } catch (error) {
      console.error("Error recording purchase:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to sign-in
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              <h1 className="text-4xl font-bold text-slate-900">
                Your Personalized Recommendations
              </h1>
            </div>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Based on your browsing history and preferences, we think you'll love these
            </p>
          </div>
        </motion.div>

        {generating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-slate-700">
              Generating personalized recommendations...
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Our AI is analyzing your preferences
            </p>
          </div>
        ) : recommendations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Sparkles className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">
              No recommendations yet
            </h2>
            <p className="text-slate-500 mb-6">
              Start browsing products to get personalized recommendations
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0">
                Browse Products
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard
                  product={rec.product}
                  explanation={rec.explanation}
                  showExplanation={true}
                  onAddToCart={handlePurchase}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
