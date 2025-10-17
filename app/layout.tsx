import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "SmartShop - AI-Powered Product Recommendations",
  description:
    "Discover amazing products with AI-powered recommendations based on your browsing history",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-inter">
        <AuthProvider>
          <Header />
          <main>
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
