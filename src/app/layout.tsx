import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SFSU Chatbot - San Francisco State University Assistant",
  description: "Get answers to your questions about San Francisco State University with our AI-powered chatbot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
