import { useState } from 'react'
import { API_URL, getAuthToken } from '../config'

function App() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null) // raw server/body info for debugging

  const normalizeUrl = (input) => {
    if (!input) return ''
    const trimmed = input.trim()
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      return `https://${trimmed}`
    }
    return trimmed
  }

  const isValidHttpUrl = (value) => {
    try {
      const u = new URL(value)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  const buildCustomCode = (original) => {
    try {
      const urlObj = new URL(original)
      const hostPart = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toLowerCase()
      const rand = Math.random().toString(36).substring(2, 6)
      return (hostPart ? `${hostPart}-${rand}` : rand).toLowerCase()
    } catch {
      return Math.random().toString(36).substring(2, 8)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShortUrl('')
    setCopied(false)
    setDebugInfo(null)

    const normalized = normalizeUrl(url)
    if (!normalized) {
      setError('Please enter a URL')
      console.warn('validate: empty or whitespace URL')
      return
    }
    if (!isValidHttpUrl(normalized)) {
      setError('Please enter a valid http(s) URL')
      console.warn('validate: url failed protocol check', normalized)
      return
    }

    if (!API_URL) {
      setError('Configuration error: API_URL is not defined')
      console.error('API_URL missing', API_URL)
      return
    }

    setLoading(true)

    try {
      console.info('Request starting', { original: normalized, api: API_URL })
      const token = await getAuthToken()
      console.info('Token from getAuthToken():', token ? 'present' : token)

      if (!token || typeof token !== 'string') {
        throw new Error('Authentication failed: token missing or invalid')
      }

      const payload = {
        original_url: normalized,
        custom_code: buildCustomCode(normalized),
        expires_in_days: 30,
        title: '',
        description: '',
        tags: [],
        domain: 'default',
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const resp = await fetch(`${API_URL}/v1/shorten/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const rawText = await resp.text().catch((err) => {
        console.error('Failed to read response text', err)
        return ''
      })

      let body = null
      try {
        body = rawText ? JSON.parse(rawText) : null
      } catch {
        body = { raw: rawText }
      }

      console.info('Network response', { status: resp.status, ok: resp.ok, headers: [...resp.headers] })
      console.debug('Response body', body)

      setDebugInfo({
        status: resp.status,
        ok: resp.ok,
        headers: Array.from(resp.headers.entries()),
        body,
        rawText,
      })

      if (!resp.ok) {
        const serverMsg = body?.detail || body?.message || body?.raw || `status ${resp.status}`
        throw new Error(`Backend error: ${serverMsg}`)
      }

      const short = body?.short_url || (body?.short_code ? `${window.location.origin}/${body.short_code}` : null)
      if (!short) {
        console.error('Missing short_url in API response', body)
        throw new Error('Invalid response from server: short_url missing')
      }

      setShortUrl(short)
      setUrl('')
    } catch (err) {
      console.error('handleSubmit error', err)
      const msg = err && err.message ? err.message : String(err)
      setError(msg.length > 500 ? msg.slice(0, 500) + '...' : msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!shortUrl) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shortUrl)
      } else {
        const input = document.createElement('input')
        input.value = shortUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Shorten Your Link</h1>
              <p className="text-gray-600 text-sm">Fast, simple, reliable — g2url.in</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
              <label className="sr-only" htmlFor="long-url">Long URL</label>
              <div>
                <input
                  id="long-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your long URL here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  disabled={loading}
                  aria-label="Long URL"
                />
              </div>

              {error && (
                <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Shortening...' : 'Shorten URL'}
              </button>
            </form>

            {shortUrl && (
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <p className="text-sm text-gray-600 font-medium">Your shortened URL:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shortUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-indigo-600"
                    aria-label="Shortened URL"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 text-xs text-gray-500">
              Debug: {debugInfo ? `status ${debugInfo.status}` : 'no response yet'}
            </div>

            {debugInfo && (
              <details className="mt-2 text-xs text-gray-700">
                <summary className="cursor-pointer underline">Show debug details (safe to share)</summary>
                <pre className="whitespace-pre-wrap text-xs mt-2 bg-gray-50 p-2 rounded border">{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-600 text-sm">© 2025 g2url.in | Simple URL Shortener</footer>
    </div>
  )
}

export default App