import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { SoilBackgroundAnimation } from "@/components/soil-background-animation"
import "./globals.css"
import Head from 'next/head';

export const metadata: Metadata = {
  title: "SoilPredict - ML-Based Soil Productivity Prediction",
  description: "Machine Learning and Clustering Based Soil Productivity Prediction System",
  generator: "v0.app",
  metadataBase: new URL('http://localhost:3000')
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-background">
        <SoilBackgroundAnimation />
        <Toaster position="top-center" />
        {children}
        <Analytics />
      </body>
    </html>
  )
}