import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Courtly Auction",
  description: "Badminton Player Auction",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-950 text-white font-sans antialiased flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="text-center text-xs text-gray-600 py-3 border-t border-gray-900">
          {`© ${new Date().getFullYear()} Sanjay & Naveen Naidu. All rights reserved.`}
        </footer>
      </body>
    </html>
  );
}
