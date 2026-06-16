import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Kopthree | Premium & Bold Coffee E-Commerce",
  description: "Crafted for those who appreciate bold character. Discover our curated collection of premium dark roasts, single origins, and specialty cold brews.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${outfit.variable} dark scroll-smooth`}>
      <body className="bg-neutral-950 text-neutral-100 font-sans min-h-screen antialiased selection:bg-amber-600 selection:text-neutral-950">
        {children}
      </body>
    </html>
  );
}
