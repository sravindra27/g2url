import { useState } from 'react'
import { API_URL, getAuthToken } from '../config'

function App() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)

  // Normalize input: add https:// if user omitted scheme
  function normalizeUrl(input) {
    if (!input) return ''
    var t = input.trim()
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(t)) {
      return 'https://' + t
    }
    return t
  }

  function isValidHttpUrl(value) {
    try {
      var u = new URL(value)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch (e) {
      return false
    }
  }

  // Conservative custom code to reduce collisions: hostname-first6 + random4
  function buildCustomCode(original) {
    try {
      var u = new URL(original)
      var hostPart = u.hostname.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toLowerCase()
      var rand = Math.random().toString(36).substring(2, 6)
      return hostPart ? hostPart + '-' + rand : rand
    } catch (e) {
      return Math.random().toString(36).substring(2, 8)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setShortUrl('')
    setCopied(false)
    setDebugInfo(null)

    var normalized = normalizeUrl(url)
    if (!normalized) {
      setError('Please enter a URL')
      return
    }
    if (!isValidHttpUrl(normalized)) {
      setError('Please enter a valid http(s) URL')
      return
    }

    if (!API_URL) {
      setError('Configuration error: API_URL is not defined')
      return
    }

    setLoading(true)

    try {
      var token = await getAuthToken()
      if (!token || typeof token !== 'string') {
        throw new Error('Authentication failed: token missing or invalid')
      }

      var payload = {
        original_url: normalized,
        custom_code: buildCustomCode(normalized),
        expires_in_days: 30,
        title: '',
        description: '',
        tags: [],
        domain: 'default'
      }

      var resp = await fetch(API_URL + '/v1/shorten/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      })

      // read body as text, then try parse JSON (handles servers that return text/html sometimes)
      var raw = ''
      try {
        raw = await resp.text()
      } catch (e) {
        raw = ''
      }

      var body = null
      try {
        body = raw ? JSON.parse(raw) : null
      } catch (e) {
        body = { raw: raw }
      }

      // Save debug info so you can inspect in UI if needed
      var headersObj = {}
      try {
        // iterate headers using for...of (supported widely)
        resp.headers.forEach(function (value, key) {
          headersObj[key] = value
        })
      } catch (e) {
        // ignore if headers iteration unsupported
      }

      setDebugInfo({
        status: resp.status,
        ok: resp.ok,
        headers: headersObj,
        body: body,
        raw: raw
      })

      if (!resp.ok) {
        var serverMsg = (body && (body.detail || body.message)) || (body && body.raw) || ('status ' + resp.status)
        throw new Error('Backend error: ' + serverMsg)
      }

      var finalShort = (body && body.short_url) || (body && body.short_code ? window.location.origin + '/' + body.short_code : null)
      if (!finalShort) {
        throw new Error('Invalid response from server: short_url missing')
      }

      setShortUrl(finalShort)
      setUrl('')
    } catch (err) {
      var msg = err && err.message ? err.message : String(err)
      setError(msg.length > 500 ? msg.substring(0, 500) + '...' : msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!shortUrl) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shortUrl)
      } else {
        // fallback copy
        var input = document.createElement('input')
        input.value = shortUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      setTimeout(function () {
        setCopied(false)
      }, 2000)
    } catch (e) {
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
                  onChange={function (e) { setUrl(e.target.value) }}
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
              Debug: {debugInfo ? ('status ' + debugInfo.status) : 'no response yet'}
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