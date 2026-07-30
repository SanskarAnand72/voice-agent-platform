import { type NextRequest, NextResponse } from "next/server"

// This demonstrates how Express middleware translates to Next.js
// Your Express app.use() equivalents are handled in the route handler

export async function POST(request: NextRequest) {
  try {
    // Express: app.use(express.urlencoded({ extended: false }))
    // Next.js: Handle form data
    const formData = await request.formData()
    
    // Express: app.use(express.json())  
    // Next.js: Handle JSON data (if Content-Type is application/json)
    let jsonData = null
    if (request.headers.get("content-type")?.includes("application/json")) {
      jsonData = await request.json()
    }

    // Convert FormData to object for easier handling
    const bodyData: Record<string, any> = {}
    formData.forEach((value, key) => {
      bodyData[key] = value
    })

    // Log all incoming data (equivalent to console.log(req.body))
    console.log("Express-style request data:", {
      formData: bodyData,
      jsonData,
      headers: Object.fromEntries(request.headers.entries()),
      method: request.method,
      url: request.url,
    })

    // Express-style response
    // res.set("Content-Type", "text/xml")
    // res.send(xmlContent)
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! This is an Express-style response in Next.js.</Say>
  <Say>Your request has been processed successfully.</Say>
</Response>`

    return new NextResponse(xmlResponse, {
      headers: { 
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    })

  } catch (error) {
    console.error("Express-style route error:", error)

    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, there was an error processing your request.</Say>
</Response>`, {
      headers: { "Content-Type": "text/xml" },
      status: 500,
    })
  }
}

// Express: app.listen(PORT, callback)
// Next.js: Development server runs automatically
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Express-style server running in Next.js",
    port: process.env.PORT || 3000,
    status: "Server is running",
    routes: {
      "POST /api/express-demo": "This endpoint (Express-style middleware demo)",
      "POST /api/twilio/incoming-call": "Incoming call webhook (your original Express code)",
      "GET /dashboard/webhooks": "Webhook management dashboard"
    },
    middleware_equivalents: {
      "express.urlencoded()": "request.formData()",
      "express.json()": "request.json()",
      "res.set()": "Response headers",
      "res.send()": "NextResponse constructor",
      "console.log(req.body)": "Log parsed data"
    },
    timestamp: new Date().toISOString()
  })
}
