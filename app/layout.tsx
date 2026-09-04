import type { Metadata, Viewport } from "next";
import { Lora, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import Header from "@/components/Header";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600", "700"] });
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Meu Canto, Minha Fé — Livro de Músicas EAC",
  description: "Letras, cifras e repertórios do EAC, com transposição de tom e geração de PDF.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0F1B33",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lora.variable} ${workSans.variable} ${plexMono.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <SplashScreen />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
