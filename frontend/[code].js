// api/[code].js
export default async function handler(req, res) {
    try {
      const { code } = req.query || {}
      if (!code) {
        res.status(400).send('Bad request')
        return
      }
  
      // read API URL from env var set in Vercel dashboard
      const API_URL = process.env.API_URL
      if (!API_URL) {
        res.status(500).send('Missing API_URL')
        return
      }
  
      // Call your backend resolve endpoint (adjust path if different)
      const fetchUrl = `${API_URL}/v1/shorten/resolve/${encodeURIComponent(code)}`
      const apiResp = await fetch(fetchUrl)
      if (apiResp.status === 200) {
        const data = await apiResp.json()
        const dest = data.original_url || data.url || data.target
        if (dest) {
          // 302 Temporary redirect (change to 301 if permanent)
          res.writeHead(302, { Location: dest })
          res.end()
          return
        } else {
          res.status(500).send('Resolve returned no destination')
          return
        }
      } else if (apiResp.status === 404) {
        res.status(404).send('Not found')
        return
      } else {
        const text = await apiResp.text().catch(()=>null)
        res.status(502).send('Upstream resolve error: ' + (text || apiResp.status))
        return
      }
    } catch (err) {
      console.error('Redirect handler error', err)
      res.status(500).send('Server error')
    }
  }
  