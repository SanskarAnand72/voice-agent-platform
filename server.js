require("dotenv").config({ path: ".env.local" });

const http = require("http");
const express = require("express");
const next = require("next");
const ws = require("ws");
const { handleMediaStream } = require("./lib/twilio/media-stream-handler");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = 3002;

app.prepare().then(() => {
  const expressApp = express();

  // Parse JSON bodies
  expressApp.use(express.json());

  // Handle all HTTP routes with Next.js
  expressApp.all("*", (req, res) => {
    return handle(req, res);
  });

  // Create native HTTP server wrapping the Express application
  const server = http.createServer(expressApp);

  // Initialize WebSocket Server without spinning up a separate port
  const wss = new ws.Server({ noServer: true });

  // Intercept HTTP upgrade requests specifically for the /media-stream route
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (pathname === "/media-stream") {
      wss.handleUpgrade(request, socket, head, (wsConnection) => {
        wss.emit("connection", wsConnection, request);
      });
    } else {
      // Allow other paths or let Next.js handle it (if Next.js ever uses WebSockets, e.g. HMR in dev mode)
      // HMR uses paths starting with /_next/webpack-hmr, let's pass them through or destroy others
      if (pathname.startsWith("/_next/webpack-hmr")) {
        // Handled by Next.js request handler
      } else {
        socket.destroy();
      }
    }
  });

  // Wire up the media stream coordinator on WebSocket connections
  wss.on("connection", (wsConnection, request) => {
    handleMediaStream(wsConnection, request);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 10) : 'NOT SET'}`);
    console.log(`TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER || 'NOT SET'}`);
  });
});
