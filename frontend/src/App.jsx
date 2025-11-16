import { useState } from 'react'
import { API_URL, getAuthToken } from '../config'

function App() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Basic client-side URL sanity check and normalization
  const normalizeUrl = (input) => {
    if (!input) return ''
    const trimmed = input.trim()
    // If user omitted scheme, assume https
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

  // Create a conservative custom code to reduce collisions:
  // {hostname-first6}-{random4}
  const buildCustomCode = (original) => {
    try {
      const urlObj = new URL(original)
      const hostPart = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toLowerCase()
      const rand = Math.random().toString(36).substring(2, 6)
      const code = (hostPart ? `${hostPart}-${rand}` : rand).toLowerCase()
      return code
    } catch {
      return Math.random().toString(36).substring(2, 8)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShortUrl('')
    setCopied(false)

    const normalized = normalizeUrl(url)
    if (!normalized) {
      setError('Please enter a URL')
      return
    }
    if (!isValidHttpUrl(normalized)) {
      setError('Please enter a valid http(s) URL')
      return
    }

    setLoading(true)

    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Authentication failed')

      const customCode = buildCustomCode(normalized)

      const payload = {
        original_url: normalized,
        custom_code: customCode,
        expires_in_days: 30,
        title: '',
        description: '',
        tags: [],
        domain: 'default',
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const response = await fetch(`${API_URL}/v1/shorten/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      // handle non-json responses safely
      let data = null
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        // Try to parse JSON if server mis-set header
        try {
          data = JSON.parse(text)
        } catch {
          data = { message: text || response.statusText }
        }
      }

      if (!response.ok) {
        const msg = data?.detail || data?.message || `Server responded with ${response.status}`
        throw new Error(msg)
      }

      // Typical API surface: prefer absolute short_url, fallback to constructing from code
      const finalShort = data.short_url || (data.short_code ? `${window.location.origin}/${data.short_code}` : null)
      if (!finalShort) throw new Error('Invalid response from server')

      setShortUrl(finalShort)
      setUrl('')
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Try again.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
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
        // fallback for older browsers
        const input = document.createElement('input')
        input.value = shortUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
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
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-600 text-sm">© 2025 g2url.in | Simple URL Shortener</footer>
    </div>
  )
}

export default App