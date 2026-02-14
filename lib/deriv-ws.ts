/**
 * Deriv WebSocket API utility for server-side usage
 * Opens a short-lived connection, authorizes, sends requests, collects responses, closes.
 */
import WebSocket from 'ws'

const DERIV_WS_URL = 'wss://ws.derivws.com/websockets/v3'

type DerivMessage = Record<string, unknown>

/**
 * Connect to Deriv WebSocket, authorize with token, execute a series of requests, then close.
 * Each request is sent sequentially after the previous response is received.
 */
export async function fetchDerivData(
  token: string,
  requests: DerivMessage[],
  appId: number = 1089,
  timeoutMs: number = 20000
): Promise<DerivMessage[]> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${DERIV_WS_URL}?app_id=${appId}`)
    const responses: DerivMessage[] = []
    let currentRequest = 0
    let authorized = false

    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('Deriv WebSocket connection timeout'))
    }, timeoutMs)

    ws.on('open', () => {
      ws.send(JSON.stringify({ authorize: token }))
    })

    ws.on('message', (raw: WebSocket.RawData) => {
      try {
        const data = JSON.parse(raw.toString())

        if (data.error) {
          clearTimeout(timeout)
          ws.close()
          reject(new Error(data.error.message || 'Deriv API error'))
          return
        }

        if (data.msg_type === 'authorize' && !authorized) {
          authorized = true
          if (requests.length > 0) {
            ws.send(JSON.stringify(requests[currentRequest]))
          } else {
            clearTimeout(timeout)
            ws.close()
            resolve(responses)
          }
          return
        }

        if (authorized && data.msg_type !== 'authorize') {
          responses.push(data)
          currentRequest++
          if (currentRequest < requests.length) {
            ws.send(JSON.stringify(requests[currentRequest]))
          } else {
            clearTimeout(timeout)
            ws.close()
            resolve(responses)
          }
        }
      } catch (e) {
        clearTimeout(timeout)
        ws.close()
        reject(e)
      }
    })

    ws.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    ws.on('close', () => {
      clearTimeout(timeout)
    })
  })
}

/**
 * Map Deriv shortcodes to human-readable instrument names
 */
export function parseInstrument(shortcode: string): string {
  if (!shortcode) return 'Unknown'
  // Volatility indices
  if (shortcode.includes('R_100') || shortcode.includes('1HZ100V')) return 'Volatility 100'
  if (shortcode.includes('R_75') || shortcode.includes('1HZ75V')) return 'Volatility 75'
  if (shortcode.includes('R_50') || shortcode.includes('1HZ50V')) return 'Volatility 50'
  if (shortcode.includes('R_25') || shortcode.includes('1HZ25V')) return 'Volatility 25'
  if (shortcode.includes('R_10') || shortcode.includes('1HZ10V')) return 'Volatility 10'
  // Crash/Boom
  if (shortcode.includes('BOOM1000')) return 'Boom 1000'
  if (shortcode.includes('BOOM500')) return 'Boom 500'
  if (shortcode.includes('CRASH1000')) return 'Crash 1000'
  if (shortcode.includes('CRASH500')) return 'Crash 500'
  // Step indices
  if (shortcode.includes('stpRNG')) return 'Step Index'
  // Jump indices
  if (shortcode.includes('JD10')) return 'Jump 10'
  if (shortcode.includes('JD25')) return 'Jump 25'
  if (shortcode.includes('JD50')) return 'Jump 50'
  if (shortcode.includes('JD75')) return 'Jump 75'
  if (shortcode.includes('JD100')) return 'Jump 100'
  // Forex
  if (shortcode.includes('frxEURUSD')) return 'EUR/USD'
  if (shortcode.includes('frxGBPUSD')) return 'GBP/USD'
  if (shortcode.includes('frxUSDJPY')) return 'USD/JPY'
  if (shortcode.includes('frxAUDUSD')) return 'AUD/USD'
  if (shortcode.includes('frxUSDCAD')) return 'USD/CAD'
  if (shortcode.includes('frxEURGBP')) return 'EUR/GBP'
  // Commodities
  if (shortcode.includes('frxXAUUSD')) return 'Gold (XAU/USD)'
  if (shortcode.includes('frxXAGUSD')) return 'Silver (XAG/USD)'
  // Crypto
  if (shortcode.includes('cryBTCUSD')) return 'BTC/USD'
  if (shortcode.includes('cryETHUSD')) return 'ETH/USD'
  // Fallback - try to extract from shortcode pattern
  const match = shortcode.match(/(?:CALL|PUT|MULTUP|MULTDOWN|DIGIT\w+|EXPIRY\w+|RANGE|UPORDOWN|ONETOUCH|NOTOUCH|RESET\w+|TICK\w+|ASIAN\w+|LBFLOAT\w+|LBHIGHLOW)_([A-Za-z0-9]+?)_/)
  if (match) {
    const raw = match[1]
    if (raw.startsWith('frx')) return raw.slice(3).replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2')
    if (raw.startsWith('cry')) return raw.slice(3).replace(/([A-Z]+)(USD)/, '$1/$2')
    return raw
  }
  return 'Unknown'
}

/**
 * Parse Deriv contract type from shortcode
 */
export function parseContractType(shortcode: string): string {
  if (!shortcode) return 'Trade'
  if (shortcode.startsWith('CALL')) return 'Rise'
  if (shortcode.startsWith('PUT')) return 'Fall'
  if (shortcode.startsWith('MULTUP')) return 'Multiplier Up'
  if (shortcode.startsWith('MULTDOWN')) return 'Multiplier Down'
  if (shortcode.startsWith('DIGITOVER')) return 'Digit Over'
  if (shortcode.startsWith('DIGITUNDER')) return 'Digit Under'
  if (shortcode.startsWith('DIGITMATCH')) return 'Digit Match'
  if (shortcode.startsWith('DIGITDIFF')) return 'Digit Diff'
  if (shortcode.startsWith('TICKHIGH')) return 'High Tick'
  if (shortcode.startsWith('TICKLOW')) return 'Low Tick'
  return 'Trade'
}

/**
 * Format epoch to relative time string
 */
export function formatTimeAgo(epoch: number): string {
  const now = Date.now() / 1000
  const diff = now - epoch
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
