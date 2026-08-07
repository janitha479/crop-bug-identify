// Maps the backend's plain-text weather description to a line icon, so the UI
// carries no emoji. The backend still sends an `emoji` field; we simply ignore it.
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun,
} from 'lucide-react'

const RULES = [
  [/thunder|hail/i, CloudLightning],
  [/heavy rain|violent|showers/i, CloudRain],
  [/rain/i, CloudRain],
  [/drizzle/i, CloudDrizzle],
  [/snow|grains/i, CloudSnow],
  [/fog|mist/i, CloudFog],
  [/overcast/i, Cloud],
  [/partly|mainly/i, CloudSun],
  [/clear/i, Sun],
]

export function weatherIcon(description = '') {
  const hit = RULES.find(([re]) => re.test(description))
  return hit ? hit[1] : CloudSun
}

export default function WeatherIcon({ description, size = 28, className = '', strokeWidth = 1.6 }) {
  const Icon = weatherIcon(description)
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
}
