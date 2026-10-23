import type { Metadata } from "next";
import "./globals.css";
import { webMetadata } from "@/components/web/metadata";
import { ToastProvider } from "@/components/providers";

export const metadata: Metadata = webMetadata;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
