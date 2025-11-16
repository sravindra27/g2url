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
      // Get authentication token
      const token = await getAuthToken()

      // Extract domain from URL for custom code generation
      let customCode = ''
      try {
        const urlObj = new URL(url.trim())
        // Generate a simple code from domain (first 6 chars, alphanumeric only)
        customCode = urlObj.hostname
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 6)
          .toLowerCase()
        // If empty, use a random code
        if (!customCode) {
          customCode = Math.random().toString(36).substring(2, 8)
        }
      } catch {
        // If URL parsing fails, use random code
        customCode = Math.random().toString(36).substring(2, 8)
      }

      // Call the external API
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Shorten Your Link
              </h1>
              <p className="text-gray-600 text-sm">
                Fast, simple, reliable — g2url.in
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your long URL here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
                <p className="text-sm text-gray-600 font-medium">
                  Your shortened URL:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shortUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-indigo-600"
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

      <footer className="py-6 text-center text-gray-600 text-sm">
        © 2025 g2url.in | Simple URL Shortener
      </footer>
    </div>
  )
}

export default App