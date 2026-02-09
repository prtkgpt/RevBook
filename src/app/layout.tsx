import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "SlotSaver",
  description: "Fill empty appointment slots automatically",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
