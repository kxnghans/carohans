import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import { STORAGE_BASE_URL } from "./utils/helpers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carohans | Enterprise Resource Management",
  description: "Advanced digital workflow experience for modern teams.",
  metadataBase: new URL('https://carohans.com'),
  icons: {
    icon: [
      {
        url: `${STORAGE_BASE_URL}carohans.PNG`,
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: `${STORAGE_BASE_URL}carohans.PNG`,
        type: 'image/png',
      },
    ],
  },
  openGraph: {
    title: 'Carohans | Enterprise Resource Management',
    description: 'Advanced digital workflow experience for modern teams.',
    url: 'https://carohans.com',
    siteName: 'Carohans',
    images: [
      {
        url: `${STORAGE_BASE_URL}Carohans_opengraph.PNG`,
        width: 1200,
        height: 630,
        alt: 'Carohans Enterprise Resource Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carohans | Enterprise Resource Management',
    description: 'Advanced digital workflow experience for modern teams.',
    images: [`${STORAGE_BASE_URL}Carohans_opengraph.PNG`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
