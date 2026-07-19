import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "TrainerFlow — Software para Personal Trainers",
  description:
    "Gestioná clientes, rutinas, nutrición, pagos y progreso desde una sola plataforma. El software todo en uno para entrenadores personales en Uruguay y Latinoamérica.",
  applicationName: "TrainerFlow",
  keywords: [
    "personal trainer",
    "software entrenadores",
    "gestión clientes gimnasio",
    "rutinas personalizadas",
    "cobros MercadoPago",
    "Uruguay",
  ],
  openGraph: {
    title: "TrainerFlow — Tu negocio de entrenamiento, todo en uno",
    description:
      "Clientes, rutinas, nutrición, pagos y progreso. Una sola plataforma para profesionalizar tu servicio.",
    url: "https://trainerflow-uy.netlify.app",
    siteName: "TrainerFlow",
    type: "website",
    locale: "es_UY",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrainerFlow — Software para Personal Trainers",
    description:
      "Gestioná clientes, rutinas, nutrición, pagos y progreso desde una sola plataforma.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrainerFlow",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c5ce7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}<CookieBanner /></body>
    </html>
  );
}
