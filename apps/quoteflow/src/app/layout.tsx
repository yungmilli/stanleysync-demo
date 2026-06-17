import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "StanleySync App",
  description: "Quote. Track. Invoice. All in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="page-shell min-h-full">{children}</body>
    </html>
  );
}
