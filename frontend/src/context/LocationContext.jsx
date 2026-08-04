// Shared farm-location state for the Weather and Forecast pages. Holds the chosen
// coordinates + a human label, remembers it in localStorage so the two pages agree,
// and offers both "detect my location" and "set by name" (via geocoding).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LocationContext = createContext(null)
const STORAGE_KEY = 'spd.location'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function LocationProvider({ children }) {
  // { lat, lon, label, source: 'gps' | 'name' } or null
  const [location, setLocation] = useState(load)

  useEffect(() => {
    try {
      if (location) localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [location])

  const setByCoords = useCallback((lat, lon, label = 'Your location') => {
    setLocation({ lat, lon, label, source: 'gps' })
  }, [])

  const setByPlace = useCallback((place) => {
    const label = [place.name, place.admin1, place.country].filter(Boolean).join(', ')
    setLocation({ lat: place.latitude, lon: place.longitude, label, source: 'name' })
  }, [])

  const value = useMemo(
    () => ({ location, setByCoords, setByPlace }),
    [location, setByCoords, setByPlace],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider')
  return ctx
}
