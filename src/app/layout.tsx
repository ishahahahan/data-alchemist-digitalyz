import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/lib/agGridSetup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Data Alchemist - AI-Powered Resource Allocation Configurator",
  description: "Transform messy spreadsheet data into clean, validated datasets with AI-powered features for resource allocation systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-gray-50 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
