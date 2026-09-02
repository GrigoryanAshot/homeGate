import type { Metadata } from "next";
import { Noto_Sans_Armenian } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_Armenian({
  subsets: ["armenian", "latin"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "HomeGate",
  description: "Smart rollup gate control",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hy">
      <body className={`${noto.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
