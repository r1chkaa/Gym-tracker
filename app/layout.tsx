import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Local-first gym tracker built for performance.",
  manifest: "/manifest.json",
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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          @media screen and (orientation: landscape) {
            body { transform: rotate(-90deg); transform-origin: left top; width: 100vh; height: 100vw; overflow-x: hidden; position: absolute; top: 100%; left: 0; }
          }
        `}} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('gym_theme') === 'dark' || (!('gym_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
                if (screen.orientation && screen.orientation.lock) {
                  screen.orientation.lock('portrait').catch(function(error) {});
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