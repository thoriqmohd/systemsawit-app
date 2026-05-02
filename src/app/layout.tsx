import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SistemSawit App",
  description: "Sistem pengurusan ladang kelapa sawit untuk pelanggan SistemSawit"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
