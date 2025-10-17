"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/supabase";

interface ProductCardProps {
  product: Product;
  onView?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  explanation?: string;
  showExplanation?: boolean;
}

export function ProductCard({
  product,
  onView,
  onAddToCart,
  explanation,
  showExplanation = false,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden h-full flex flex-col group">
        <div className="relative overflow-hidden aspect-square bg-slate-100">
          <motion.img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 hover:bg-white">
            {product.category}
          </Badge>
        </div>

        <CardHeader className="flex-grow">
          <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
          <div className="pt-2">
            <span className="text-2xl font-bold text-slate-900">
              ${product.price}
            </span>
          </div>
        </CardHeader>

        {showExplanation && explanation && (
          <CardContent className="pt-0">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                {explanation}
              </p>
            </div>
          </CardContent>
        )}

        <CardFooter className="gap-2 pt-4">
          {onView && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onView(product.id)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          )}
          {onAddToCart && (
            <Button
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
              onClick={() => onAddToCart(product.id)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
