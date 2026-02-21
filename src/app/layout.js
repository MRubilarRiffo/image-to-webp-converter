import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Image Converter Next.js",
  description: "Convierte imágenes a formato WebP o AVIF de manera nativa y rápida en tu navegador, sin pérdida de calidad y con alta compresión.",
  keywords: ["image converter", "webp", "avif", "compresión de imagenes", "next.js"],
  authors: [{ name: "Muricio Rubilar" }],
  openGraph: {
    title: "Image Converter Next.js - WebP & AVIF Ultra Rápido",
    description: "Convierte múltiples imágenes a WebP o AVIF directamente en tu navegador. Optimización en base a Sharp (Serverless).",
    url: "https://image-converter-next.vercel.app", // Sustituir por dominio real
    siteName: "Image Converter Next",
    images: [{
      url: "/window.svg", // Fallback local placeholder
      width: 800,
      height: 600,
    }],
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Toaster theme="dark" position="bottom-right" richColors />
        {children}
      </body>
    </html>
  );
}
