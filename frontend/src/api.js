// Thin API client. In dev, Vite proxies /api to the Flask backend (see vite.config.js).

const TOKEN_KEY = 'spd.token'

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* ignore */ }
}

// Authorization header for the current token, if any.
function authHeaders(extra = {}) {
  const t = getToken()
  return t ? { ...extra, Authorization: `Bearer ${t}` } : extra
}

// fetch + JSON that attaches the auth token and throws on error responses.
async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: authHeaders(options.headers || {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function detectPest(file, message, farmId) {
  const form = new FormData()
  form.append('image', file)
  if (message) form.append('message', message)
  if (farmId) form.append('farm_id', String(farmId))

  // Attach the token (if signed in) so the scan is logged to history.
  const res = await fetch('/api/detect', { method: 'POST', body: form, headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Detection failed')
  return data
}

// --- Auth ---
export function register(payload) {
  return apiJson('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
export function login(payload) {
  return apiJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
export function fetchMe() {
  return apiJson('/api/auth/me')
}

// --- Farms / dashboard ---
export function listFarms() {
  return apiJson('/api/farms')
}
export function createFarm(payload) {
  return apiJson('/api/farms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
export function deleteFarm(id) {
  return apiJson(`/api/farms/${id}`, { method: 'DELETE' })
}
export function farmsOverview() {
  return apiJson('/api/farms/overview')
}
export function listDetections() {
  return apiJson('/api/detections')
}

// Download the farm report PDF (sends the auth token, then triggers a save).
export async function downloadReport() {
  const res = await fetch('/api/report.pdf', { headers: authHeaders() })
  if (!res.ok) throw new Error('Could not generate the report')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'farm-report.pdf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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
