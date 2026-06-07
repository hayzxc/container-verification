import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Container Verification",
  description: "Container inspection and verification PWA"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
