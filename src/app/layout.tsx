import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NorCal Star Wars: Unlimited",
  description: "Join the NorCal Star Wars: Unlimited community! Find local events, connect with players, and learn about the game.",
  keywords: [
    // Game-related keywords
    "Star Wars: Unlimited",
    "SWU",
    "Trading Card Game",
    "TCG",
    "Card Game",
    "Star Wars",
    // Regional keywords
    "San Francisco Bay Area",
    "Bay Area",
    "SF Bay",
    "Silicon Valley",
    "Northern California",
    "NorCal",
    "Central Coast",
    // Major cities
    "San Francisco",
    "San Jose",
    "Oakland",
    "Berkeley",
    "Palo Alto",
    "Mountain View",
    "Sunnyvale",
    "Santa Clara",
    "Fremont",
    "Hayward",
    "San Mateo",
    "Redwood City",
    "Walnut Creek",
    "Concord",
    "Richmond",
    "Alameda",
    "South San Francisco",
    "San Rafael",
    "Santa Rosa",
    "Salinas",
    "Monterey",
    "Santa Cruz",
    // Counties
    "San Francisco County",
    "Santa Clara County",
    "San Mateo County",
    "Alameda County",
    "Contra Costa County",
    "Marin County",
    "Sonoma County",
    "Napa County",
    "Solano County",
    "Monterey County",
    "Santa Cruz County",
    // Regions
    "Peninsula",
    "South Bay",
    "East Bay",
    "North Bay",
    "Central Coast",
    "Community"
  ],
  openGraph: {
    title: "NorCal Star Wars: Unlimited",
    description: "Join the NorCal Star Wars: Unlimited community! Find local events, connect with players, and learn about the game.",
    type: "website",
    locale: "en_US",
    images: [{
      url: "/NorCalSWU.png",
      width: 600,
      height: 338,
      alt: "NorCal Star Wars: Unlimited Logo"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NorCal Star Wars: Unlimited",
    description: "Join the NorCal Star Wars: Unlimited community! Find local events, connect with players, and learn about the game.",
    images: ["/NorCalSWU.png"],
  },
  icons: {
    icon: "/NorCalSWU.png",
    apple: "/NorCalSWU.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[lightgoldenrodyellow]`}>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
