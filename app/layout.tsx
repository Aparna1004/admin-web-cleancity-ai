import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import "leaflet/dist/leaflet.css"; // ✅ ONLY THIS

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CleanCity Admin",
  description: "Admin dashboard for CleanCity operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-50">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
