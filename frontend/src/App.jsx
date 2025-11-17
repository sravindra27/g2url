import { useState } from 'react'
import { API_URL, getAuthToken } from '../config'

function App() {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShortUrl('')
    setCopied(false)

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)

    try {
      const token = await getAuthToken()

      let customCode = ''
      try {
        const urlObj = new URL(url.trim())
        customCode = urlObj.hostname
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 6)
          .toLowerCase()
        if (!customCode) {
          customCode = Math.random().toString(36).substring(2, 8)
        }
      } catch {
        customCode = Math.random().toString(36).substring(2, 8)
      }

      const response = await fetch(`${API_URL}/v1/shorten/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          original_url: url.trim(),
          custom_code: customCode,
          expires_in_days: 30,
          title: '',
          description: '',
          tags: [],
          domain: 'default',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to shorten URL')
      }

      setShortUrl(data.short_url)
      setUrl('')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (shortUrl) {
      try {
        await navigator.clipboard.writeText(shortUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        setError('Failed to copy to clipboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-amber-200">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Shorten Your Link
              </h1>
              <p className="text-amber-600 font-medium text-sm tracking-wide">
                Fast, simple, reliable - g2url.in
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your long URL here..."
                className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 outline-none transition-all bg-amber-50"
                disabled={loading}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-3 rounded-lg font-semibold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Shortening...' : 'Shorten URL'}
              </button>
            </form>

            {/* Output */}
            {shortUrl && (
              <div className="pt-4 border-t border-amber-200 space-y-3">
                <p className="text-sm text-orange-700 font-semibold">
                  Your shortened URL:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shortUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-amber-50 border border-amber-300 rounded-lg text-sm font-mono text-orange-600"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-amber-700 text-sm font-medium">
        © 2025 g2url.in | Simple URL Shortener
      </footer>
    </div>
  )
}

export default App