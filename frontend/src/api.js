// Thin API client. In dev, Vite proxies /api to the Flask backend (see vite.config.js).

export async function detectPest(file, message) {
  const form = new FormData()
  form.append('image', file)
  if (message) form.append('message', message)

  const res = await fetch('/api/detect', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Detection failed')
  return data
}

export async function chat(message, pest) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, pest }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Chat failed')
  return data
}

export async function health() {
  const res = await fetch('/api/health')
  return res.json()
}

// Live agriculture headlines (proxied server-side from Google News RSS).
// Returns [] on any failure so the UI can fall back to curated tips.
export async function getNews() {
  try {
    const res = await fetch('/api/news')
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.items) ? data.items : []
  } catch {
    return []
  }
}
