# Deriv's AI Coach - Browser Extension

A Chrome side panel extension that appears on **Deriv trading pages** (app.deriv.com), spanning from top to bottom like the Teal extension. It tracks your trades in real time via Deriv's WebSocket API and provides AI Coach feedback.

## Features

- **Side panel display** – Renders on the right side of the browser when you're on app.deriv.com
- **Real-time balance tracking** – Uses Deriv's WebSocket API (Authorize + Balance subscribe)
- **AI Coach**:
  - **Wins**: Praises and encourages you, highlights what went right
  - **Losses**: Warnings when you're losing capital (5% threshold), stronger alerts at 10%
- **Demo account only** – Designed for Hackathon use with demo accounts

## Design

Uses the DerivHub design system:
- **Background**: `#0A0A0F`
- **Cards**: `#1A1A1F`
- **Primary accent**: `#FF444F` (Deriv red)
- **Success**: `#10B981`, **Warning**: `#F59E0B`

## Setup

### 1. Get your Deriv API token (Demo account)

1. Log in to [app.deriv.com](https://app.deriv.com) with your **Demo** account
2. Go to **Settings** → **API token**
3. Create a token (or use an existing one)
4. Copy the token (format: `a1-xxxxxxxxxxxxx`)

### 2. Load the extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension` folder in this project

### 3. Use the extension

1. Visit [app.deriv.com/dtrader](https://app.deriv.com/dtrader) (or any Deriv trading page)
2. Click the extension icon in the Chrome toolbar
3. The AI Coach side panel opens on the right
4. Enter your API token and click **Connect**
5. Start trading – the coach will track wins/losses and provide feedback

## API Configuration

- **WebSocket**: `wss://ws.derivws.com/websockets/v3?app_id=1089`
- **App ID**: `1089` (Deriv testing) – register your own at [api.deriv.com](https://api.deriv.com) for production
- **Session**: Ping sent every 30s to keep the connection alive (2 min timeout)

## Debugging

The extension doesn't log to the terminal. To debug:

1. Right-click the side panel → **Inspect** → Console tab
2. Type `DEBUG = true` and press Enter, then reconnect to see WebSocket messages

See `extension/DEBUG.md` for full instructions.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Manifest V3, side panel, background script |
| `background.js` | Enables side panel only on deriv.com |
| `sidepanel.html` | Side panel UI |
| `sidepanel.css` | DerivHub-themed styles |
| `sidepanel.js` | WebSocket, balance subscription, AI Coach logic |
| `DEBUG.md` | Debugging guide |
