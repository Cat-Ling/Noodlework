import type { Metadata } from "next";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noodle Privacy",
  description: "Privacy-focused frontend for Noodle Magazine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
