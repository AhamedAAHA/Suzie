import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import SuzieProvider from "@/components/SuzieProvider";

export const metadata: Metadata = {
  title: "SUZIE AI — Global Intelligence Command Center",
  description: "The Global Intelligence Assistant That Watches the World For You",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SuzieProvider>
          <NavBar />
          {children}
        </SuzieProvider>
      </body>
    </html>
  );
}
