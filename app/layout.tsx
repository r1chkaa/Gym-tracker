import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Local-first gym tracker built for performance.",
  manifest: "/manifest.json?v=999",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* FORCE iOS CACHE BUST */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=999" />
        <link rel="icon" href="/icon.png?v=999" />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('gym_theme') === 'dark' || (!('gym_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="antialiased pb-24 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}