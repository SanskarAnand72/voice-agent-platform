import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Phone, Settings, AlertCircle, CheckCircle, ExternalLink } from "lucide-react"

interface SetupStep {
  title: string
  description: string
  status: "pending" | "complete" | "error"
  details?: string
}

interface CallSetupGuideProps {
  setupStatus: {
    twilio_credentials: boolean
    agents_with_phones: number
    base_url: string
  }
}

export function CallSetupGuide({ setupStatus }: CallSetupGuideProps) {
  const steps: SetupStep[] = [
    {
      title: "Set up Twilio credentials",
      description: "Add your Twilio Account SID and Auth Token to environment variables",
      status: setupStatus.twilio_credentials ? "complete" : "error",
      details: setupStatus.twilio_credentials 
        ? "Twilio credentials are configured" 
        : "Missing TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables"
    },
    {
      title: "Purchase Twilio phone number",
      description: "Buy a phone number from Twilio Console",
      status: "pending",
      details: "Visit console.twilio.com to purchase a phone number"
    },
    {
      title: "Configure agents with phone numbers",
      description: "Add Twilio phone numbers to your AI agents",
      status: setupStatus.agents_with_phones > 0 ? "complete" : "pending",
      details: setupStatus.agents_with_phones > 0 
        ? `${setupStatus.agents_with_phones} agent(s) configured with phone numbers`
        : "No agents have phone numbers configured"
    },
    {
      title: "Set up webhooks (optional for outbound calls)",
      description: "Configure Twilio webhooks for advanced features",
      status: "pending",
      details: `Base URL: ${setupStatus.base_url}`
    }
  ]

  const getStatusIcon = (status: SetupStep['status']) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: SetupStep['status']) => {
    switch (status) {
      case "complete":
        return <Badge variant="default" className="bg-green-500">Complete</Badge>
      case "error":
        return <Badge variant="danger">Required</Badge>
      default:
        return <Badge variant="secondary">Optional</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Call Setup Guide</h2>
        <p className="text-muted-foreground">
          Follow these steps to enable voice calling functionality for your AI agents.
        </p>
      </div>

      {!setupStatus.twilio_credentials && (
        <Alert className="border-red-200 bg-red-50/50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <strong>Action Required:</strong> Twilio credentials must be configured before you can make calls.
            Add your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your .env.local file.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {steps.map((step, index) => (
          <Card key={index} className="bg-elevated border-default">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-semibold text-text">
                    {index + 1}
                  </span>
                  <div>
                    <CardTitle className="text-lg text-text">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(step.status)}
                  {getStatusBadge(step.status)}
                </div>
              </div>
            </CardHeader>
            {step.details && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{step.details}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card className="bg-surface border-default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text">
            <Settings className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>
            Add these to your .env.local file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-elevated rounded-lg p-4 font-mono text-sm">
            <div className="text-text">
              TWILIO_ACCOUNT_SID=your_account_sid_here<br />
              TWILIO_AUTH_TOKEN=your_auth_token_here<br />
              NEXT_PUBLIC_BASE_URL=https://your-domain.com
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Twilio Console
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.twilio.com/docs/usage/api" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                API Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text">
            <Phone className="h-5 w-5" />
            Quick Test
          </CardTitle>
          <CardDescription>
            Test your setup with these commands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-text mb-2">1. Check setup status:</p>
              <div className="bg-elevated rounded-lg p-3 font-mono text-sm text-text">
                curl {setupStatus.base_url}/api/debug/call-setup
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text mb-2">2. Test TwiML response:</p>
              <div className="bg-elevated rounded-lg p-3 font-mono text-sm text-text">
                curl {setupStatus.base_url}/api/twilio/hello
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
