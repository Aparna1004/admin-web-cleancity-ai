import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import "leaflet/dist/leaflet.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CleanCity Admin",
  description: "Admin dashboard for CleanCity operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-50">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-sA+4J1rYK7M4ZjWQ6p6sB07wP6p0i5lVd2U5lHn0kS0="
          crossOrigin=""
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}




