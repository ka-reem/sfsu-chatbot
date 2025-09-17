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
  // --- EASTER EGG SETTINGS ---
  // To change the visibility or the displayed name, edit these constants below.
  const EASTER_ENABLED = true; // set to false to disable
  const EASTER_NAME = 'VIDMAN2'; // change the displayed name here

  return (
    <html lang="en">
      <body className="font-sans antialiased relative">
        {EASTER_ENABLED && (
          // hover-only label positioned near top-right
          <div className="cyconerd-hover-wrapper" aria-hidden={true}>
            <span className="cyconerd-label">{EASTER_NAME}</span>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
