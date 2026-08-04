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

// Current weather for a coordinate (Open-Meteo, proxied server-side).
// Returns the weather object, or null on any failure.
export async function getWeather(lat, lon) {
  try {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.weather || null
  } catch {
    return null
  }
}

// Look up coordinates for a place name (Open-Meteo geocoding, proxied server-side).
// Returns an array of place matches, or [] on any failure.
export async function geocode(query) {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.results) ? data.results : []
  } catch {
    return []
  }
}

// Outbreak forecast for the next few months at a coordinate.
// Returns the full forecast object, or null on any failure.
export async function getForecast(lat, lon, months = 3) {
  try {
    const res = await fetch(`/api/forecast?lat=${lat}&lon=${lon}&months=${months}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
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
