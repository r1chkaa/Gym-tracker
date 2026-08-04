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
          /* Unbreakable Landscape Blocker */
          @media screen and (orientation: landscape) {
            #main-app-content { display: none !important; }
            #landscape-blocker { display: flex !important; }
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
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors duration-300 w-full h-full overflow-hidden">
        
        {/* Landscape Warning Screen */}
        <div id="landscape-blocker" className="hidden fixed inset-0 z-[999999] bg-[#09090b] text-white flex-col items-center justify-center p-6 text-center w-full h-full">
          <svg className="w-16 h-16 mb-6 text-blue-500 animate-[spin_3s_linear_infinite]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Rotate Device</h1>
          <p className="text-white/50 font-bold text-sm">Gym Tracker is designed strictly for portrait mode.</p>
        </div>

        {/* Main App Content */}
        <div id="main-app-content" className="w-full h-full relative">
          {children}
        </div>
      </body>
    </html>
  );
}