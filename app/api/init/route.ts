import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const [productsRes, usersRes] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("users").select("*").order("name"),
    ]);

    const products = productsRes.data ?? [];
    const users = usersRes.data ?? [];

    return NextResponse.json({ products, users });
  } catch (error) {
    console.error("Error in /api/init:", error);
    return NextResponse.json({ products: [], users: [] }, { status: 500 });
  }
}
