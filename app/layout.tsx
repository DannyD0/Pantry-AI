import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
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
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
