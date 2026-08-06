import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ConvexClientProvider } from "@/components/convex-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Sublime — AI characters that move like you mean it",
    template: "%s · Sublime",
  },
  description:
    "Build a consistent AI character, then clone the movement and performance of any reference video.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
