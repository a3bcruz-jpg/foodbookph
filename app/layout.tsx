import type { Metadata } from "next";
import "./globals.css";
import "./account.css";
import "./owner.css";
import "./owner-menu.css";

export const metadata: Metadata = {
  title: "FoodBookPH | Find your next favorite",
  description: "Discover the places and plates worth talking about in the Philippines.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
