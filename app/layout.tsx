import type { Metadata } from "next";
import "./globals.css";
import "./account.css";
import "./owner.css";
import "./owner-menu.css";
import "./restaurant.css";
import "./navigation-fix.css";
import "./design-system.css";
import "./screen-refresh.css";

export const metadata: Metadata = {
  title: "FoodBookPH | Discover food. Meet your food people.",
  description: "Discover the places, plates, reviews, and people worth talking about across the Philippines.",
  applicationName: "FoodBookPH",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
