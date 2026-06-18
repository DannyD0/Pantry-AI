import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/providers/Toaster"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pantry AI",
  description: "Minimalist grocery inventory & predictive depletion tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pantry AI",
    startupImage: "/apple-touch-icon.png",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/favicon-32.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d0d0d",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Inline script prevents flash of wrong theme before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('pantry_prefs')||'{}');var t=p.theme||'light';var h=document.documentElement;if(t==='dark'){h.classList.add('dark');}else if(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches){h.classList.add('dark');}else{h.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <Toaster>{children}</Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
