# Debugging the Deriv AI Coach Extension

Browser extensions don't log to the Cursor terminal. Use Chrome DevTools instead.

## How to debug

### 1. Open DevTools for the side panel

1. Click the extension icon to open the AI Coach side panel.
2. **Right-click** anywhere inside the side panel (the dark area with "Connect Demo Account").
3. Click **"Inspect"**.
4. A DevTools window opens with the **Console** tab. All `console.log` output from the side panel appears here.

### 2. Enable debug logging

In the DevTools Console, type:

```javascript
DEBUG = true
```

Press Enter. Then click **Connect** again. You'll see every WebSocket message from Deriv in the console.

### 3. Alternative: use the (debug) button

1. Click **Connect** so the status bar appears.
2. Click the **(debug)** button in the status bar.
3. Right-click the panel → **Inspect** → Console.
4. Reconnect to see WebSocket messages.

### 4. What to check

| If you see... | It means... |
|---------------|-------------|
| `[Deriv WS] authorize {...}` | Authorize succeeded. |
| `[Deriv WS] balance {...}` | Balance subscription response received. |
| `error: { message: "..." }` | API error (e.g. invalid token). |
| No messages after "Subscribing..." | Deriv may not be sending balance response; 5s fallback should kick in. |
| `Parse error` | Response format differs from expected. |

### 5. Common issues

- **"Nothing happens"** – The extension may be stuck waiting for the balance response. The 5-second fallback should show the connected UI. If not, check Console for errors.
- **Invalid token** – Ensure you're using a Demo account token from app.deriv.com/account/api-token.
- **CORS/connection errors** – Extension WebSockets usually work; check Console for details.
