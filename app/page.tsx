"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signin");
      } else {
        fetchData();
      }
    }
  }, [authLoading, user, router]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/init");
      if (!res.ok) throw new Error("Failed to fetch initial data");
      const json = await res.json();
      const productsResult = json.products as Product[];

      if (productsResult) setProducts(productsResult);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleView = async (productId: string) => {
    if (!user) return;

    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
          action_type: "view",
        }),
      });

      if (response.ok) {
        toast({
          title: "Product viewed",
          description: "Your interest has been recorded",
        });
      }
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  const handleAddToCart = async (productId: string) => {
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
          title: "Added to cart",
          description: "Product has been added to your cart",
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading products...</p>
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
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Discover Amazing Products
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Browse our curated collection and get personalized AI-powered recommendations 
              tailored just for you
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard
                product={product}
                onView={handleView}
                onAddToCart={handleAddToCart}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
