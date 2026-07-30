import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: {
    default: "VoiceAI — AI Voice Agent Platform",
    template: "%s · VoiceAI",
  },
  description:
    "Build, deploy, and monitor intelligent AI voice agents for automated phone conversations at scale.",
  keywords: ["voice AI", "AI agents", "phone automation", "conversational AI", "Twilio", "ElevenLabs"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "VoiceAI — AI Voice Agent Platform",
    description: "Build and deploy AI voice agents in minutes.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0A0A0F" />
      </head>
      <body className={`${GeistSans.className} antialiased`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-elevated)",
              border: "1px solid var(--color-border-2)",
              color: "var(--color-text-1)",
              borderRadius: "var(--radius-lg)",
              fontSize: "13px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            },
          }}
        />
      </body>
    </html>
  )
}
