import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Modular Workspace",
  description: "Workspace with MailHunt and AI Contact Extractor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pt-16 lg:pt-0">
          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
