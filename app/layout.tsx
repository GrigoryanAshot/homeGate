import type { Metadata, Viewport } from "next";
import { Noto_Sans_Armenian } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_Armenian({
  subsets: ["armenian", "latin"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "Touch SmartGate",
  description: "Smart rollup gate control",
  applicationName: "Touch SmartGate",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Touch SmartGate",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/app-icon.png", sizes: "32x32", type: "image/png" },
      { url: "/img/logo5-pwa-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/img/logo5-pwa-192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#e8f2ff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hy" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('smartgate-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className={`${noto.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
