import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { SITE } from "@/lib/config";
import { FOUNDERS } from "@/lib/team";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Timule: Indian components for drones, robots and data centers", template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "Indian electronic components supplier",
    "critical components India",
    "Indian drone components",
    "batch tested components India",
    "robot actuator India",
    "robot joint actuator manufacturer India",
    "AGV drive wheel India",
    "data center components India",
    "server fan manufacturer India",
    "server power supply India",
    "data center liquid cooling India",
    "made in India drone parts",
    "indigenous drone components",
    "BLDC motor India",
    "drone motor manufacturer India",
    "drone ESC India",
    "drone propeller India",
    "no foreign components drone",
    "indigenous content calculator",
    "drone propulsion calculator",
    "Kisan drone indigenous content",
    "defence drone supply chain India",
    "TM code",
    "Timule",
  ],
  authors: FOUNDERS.map((f) => ({ name: f.name, url: f.linkedin })),
  creator: "Timule",
  publisher: "Timule",
  category: "technology",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
  },
  openGraph: { type: "website", siteName: SITE.name, locale: "en_IN", url: SITE.url },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

// Applies the stored theme choice before first paint, so there is no flash.
const themeScript = `try{var m=localStorage.getItem("assay-theme");if(m==="light"||m==="dark")document.documentElement.dataset.mode=m;else document.documentElement.dataset.mode="auto"}catch(e){document.documentElement.dataset.mode="auto"}`;

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

/** Who we are, for search engines and AI answer engines. */
const orgLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#org`,
      name: "Timule",
      url: SITE.url,
      logo: `${SITE.url}/icon.svg`,
      slogan: "One code for every critical part",
      description: SITE.description,
      email: SITE.contactEmail,
      areaServed: "IN",
      knowsAbout: ["BLDC motors", "Electronic speed controllers", "Drone components", "Robot joint actuators", "AGV and AMR drive wheels", "Server fans", "Server power supplies", "Data center liquid cooling", "Indigenous content", "Supplier qualification"],
      founder: FOUNDERS.map((f) => ({ "@type": "Person", name: f.name, jobTitle: f.role, email: f.email, sameAs: [f.linkedin] })),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#site`,
      url: SITE.url,
      name: "Timule",
      publisher: { "@id": `${SITE.url}/#org` },
      inLanguage: "en-IN",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable} data-mode="auto" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, "\\u003c") }} />
      </head>
      <body className="min-h-dvh antialiased">
        <MotionProvider>{children}</MotionProvider>
        {plausibleDomain ? (
          <Script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
