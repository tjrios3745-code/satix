// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Satix",
  description: "Workspace inteligente com IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#06070a] text-zinc-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}