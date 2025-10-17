// Use the module (ESM) build to avoid bundler warnings from CJS dynamic requires
import { createClient } from "@supabase/supabase-js/dist/module";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  created_at: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type UserInteraction = {
  id: string;
  user_id: string;
  product_id: string;
  action_type: "view" | "add_to_cart" | "purchase";
  timestamp: string;
};
