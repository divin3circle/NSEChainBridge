import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NSEChainBridge - Trade NSE Stocks on Blockchain",
  description:
    "Trade NSE stocks securely and efficiently on the Hedera blockchain platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rubik.className}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
