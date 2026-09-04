import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "INREcrm - Mobile First",
  description: "Sell To Anyone, Anywhere, Automatically.",
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-50`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-0">
        <AuthProvider>
          <ClientLayout>
            {children}
            <Toaster position="top-center" />
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
