import dynamic from "next/dynamic"
import { RefreshCw } from "lucide-react"

// Dynamically import the voice console with SSR disabled to prevent browser node crash on backend render
const PlaygroundConsole = dynamic(
  () => import("@/components/dashboard/playground-console").then(mod => mod.PlaygroundConsole),
  {
    loading: () => (
      <div className="flex-1 min-h-[500px] flex items-center justify-center text-muted gap-2 animate-pulse font-mono text-sm">
        <RefreshCw className="h-4 w-4 animate-spin" /> Initializing Audio Pipeline...
      </div>
    ),
    ssr: false
  }
)

export const metadata = {
  title: "Playground | Voice AI Platform",
  description: "Test your AI voice agents in real-time right from your browser.",
}

export default function PlaygroundPage() {
  return (
    <div className="flex-1 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 sm:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Developer Playground</h1>
          <p className="text-sm text-muted">
            Test your voice agent configurations dynamically. Talk directly to your AI using your mic.
          </p>
        </div>
      </div>

      {/* Main console component */}
      <PlaygroundConsole />
    </div>
  )
}
