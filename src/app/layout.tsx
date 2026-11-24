import type { Metadata } from "next";
import { Doto, Inter } from "next/font/google";
import AppToaster from "@/components/AppToaster";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const doto = Doto({ variable: "--font-doto", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MultiClock",
  description:
    "The multi-timer app that lets you bifurcate time like a pro.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${doto.variable} antialiased`}>
      <body>
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
