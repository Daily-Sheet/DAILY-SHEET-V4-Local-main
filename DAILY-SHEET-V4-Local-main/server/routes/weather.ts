import type { Express } from "express";
import type multer from "multer";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";

// ─── Shared result shape ──────────────────────────────────────────────────────
// All providers normalize to this format so the client never changes on swap.
interface WeatherResult {
  current: { temperature: number; weathercode: number; windSpeed: number | null; humidity: number | null } | null;
  daily: {
    dates: string[];
    maxTemps: number[];
    minTemps: number[];
    weatherCodes: number[];
  };
  venue: { name: string; address: string };
}

// ─── Provider 1: Open-Meteo (lat/lng — used when coordinates are cached) ─────
// Free, no API key. Used when the venue already has stored coordinates.

async function fetchWeatherOpenMeteo(lat: string, lng: string, venueName: string, address: string): Promise<WeatherResult> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`
  );
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
  const data = await res.json() as any;

  const cur = data.current;
  return {
    current: cur
      ? { temperature: cur.temperature_2m, weathercode: cur.weathercode, windSpeed: cur.windspeed_10m ?? null, humidity: cur.relativehumidity_2m ?? null }
      : null,
    daily: {
      dates: data.daily?.time || [],
      maxTemps: data.daily?.temperature_2m_max || [],
      minTemps: data.daily?.temperature_2m_min || [],
      weatherCodes: data.daily?.weathercode || [],
    },
    venue: { name: venueName, address },
  };
}

// ─── Provider 2: wttr.in (address string — current default, no API key) ──────
// Accepts any plain-text location: address, city name, zip code, etc.
// To scale: replace the fetchWeatherWttr call below with fetchWeatherApi().

function wttrCodeToWMO(code: number): number {
  if (code === 113) return 0;                                          // Sunny/Clear
  if (code === 116) return 1;                                          // Partly cloudy
  if (code === 119) return 2;                                          // Cloudy
  if (code === 122) return 3;                                          // Overcast
  if ([143, 248, 260].includes(code)) return 45;                      // Fog/Mist
  if ([263, 266].includes(code)) return 51;                           // Light drizzle
  if ([281, 284].includes(code)) return 56;                           // Freezing drizzle
  if ([176, 293, 296].includes(code)) return 61;                      // Light rain
  if ([299, 302].includes(code)) return 63;                           // Moderate rain
  if ([305, 308].includes(code)) return 65;                           // Heavy rain
  if ([311, 314, 317, 320].includes(code)) return 57;                 // Sleet/freezing rain
  if ([179, 323, 326].includes(code)) return 71;                      // Light snow
  if ([182, 329, 332].includes(code)) return 73;                      // Moderate snow
  if ([185, 335, 338, 227, 230].includes(code)) return 75;            // Heavy/blowing snow
  if ([350, 362, 365, 374, 377].includes(code)) return 77;            // Ice pellets/sleet showers
  if ([353, 356, 359].includes(code)) return 80;                      // Rain showers
  if ([368, 371].includes(code)) return 85;                           // Snow showers
  if ([200, 386, 389, 392, 395].includes(code)) return 95;            // Thunderstorm
  return 0;
}

async function fetchWeatherWttr(location: string, venueName: string, address: string): Promise<WeatherResult> {
  const res = await fetch(
    `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
    { headers: { "User-Agent": "DailySheet/1.0 (dailysheet.app)" } }
  );
  if (!res.ok) throw new Error(`wttr.in returned ${res.status}`);

  // wttr.in returns 200 even for unknown locations but with a text/html body
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json") && !contentType.includes("text/plain")) {
    throw new Error(`wttr.in returned unexpected content-type: ${contentType}`);
  }

  const data = await res.json() as any;
  const current = data.current_condition?.[0] ?? null;
  const forecasts: any[] = data.weather ?? [];

  if (!current && forecasts.length === 0) {
    throw new Error("wttr.in returned no weather data for this location");
  }

  return {
    current: current
      ? {
          temperature: parseFloat(current.temp_F),
          weathercode: wttrCodeToWMO(parseInt(current.weatherCode, 10)),
          windSpeed: current.windspeedMiles ? parseFloat(current.windspeedMiles) : null,
          humidity: current.humidity ? parseInt(current.humidity, 10) : null,
        }
      : null,
    daily: {
      dates: forecasts.map((d) => d.date),
      maxTemps: forecasts.map((d) => parseFloat(d.maxtempF)),
      minTemps: forecasts.map((d) => parseFloat(d.mintempF)),
      weatherCodes: forecasts.map((d) => wttrCodeToWMO(parseInt(d.weatherCode, 10))),
    },
    venue: { name: venueName, address },
  };
}

// ─── Provider 3: WeatherAPI.com (swap in when scaling) ───────────────────────
// 1. Sign up at https://www.weatherapi.com — free tier = 1M calls/month
// 2. Add WEATHER_API_KEY to your .env
// 3. Replace the fetchWeatherWttr call in the priority chain below with
//    fetchWeatherApi(location, ...) — it accepts the same location string
//
// function weatherApiCodeToWMO(code: number): number {
//   if (code === 1000) return 0;
//   if ([1003, 1006, 1009].includes(code)) return 2;
//   if ([1030, 1135, 1147].includes(code)) return 45;
//   if ([1063, 1150, 1153, 1180, 1183].includes(code)) return 61;
//   if ([1186, 1189, 1192, 1195, 1201].includes(code)) return 65;
//   if ([1066, 1210, 1213, 1216, 1219, 1222, 1225].includes(code)) return 71;
//   if ([1069, 1204, 1207, 1249, 1252].includes(code)) return 57;
//   if ([1114, 1117].includes(code)) return 75;
//   if ([1240, 1243, 1246].includes(code)) return 80;
//   if ([1255, 1258].includes(code)) return 85;
//   if ([1273, 1276, 1279, 1282].includes(code)) return 95;
//   return 0;
// }
//
// async function fetchWeatherApi(location: string, venueName: string, address: string): Promise<WeatherResult> {
//   const key = process.env.WEATHER_API_KEY;
//   if (!key) throw new Error("WEATHER_API_KEY env var not set");
//   const res = await fetch(
//     `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${encodeURIComponent(location)}&days=7&aqi=no`,
//     { headers: { "User-Agent": "DailySheet/1.0" } }
//   );
//   if (!res.ok) throw new Error(`WeatherAPI returned ${res.status}`);
//   const data = await res.json() as any;
//   return {
//     current: { temperature: data.current.temp_f, weathercode: weatherApiCodeToWMO(data.current.condition.code) },
//     daily: {
//       dates: data.forecast.forecastday.map((d: any) => d.date),
//       maxTemps: data.forecast.forecastday.map((d: any) => d.day.maxtemp_f),
//       minTemps: data.forecast.forecastday.map((d: any) => d.day.mintemp_f),
//       weatherCodes: data.forecast.forecastday.map((d: any) => weatherApiCodeToWMO(d.day.condition.code)),
//     },
//     venue: { name: venueName, address },
//   };
// }

// ─── Cache & route ────────────────────────────────────────────────────────────

const weatherCache = new Map<string, { data: WeatherResult; timestamp: number }>();
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function registerWeatherRoutes(app: Express, upload: multer.Multer) {
  app.get("/api/weather/:venueId", isAuthenticated, async (req: any, res) => {
    try {
      const venueId = Number(req.params.venueId);
      const venue = await storage.getVenue(venueId);
      if (!venue) return res.status(404).json({ message: "Venue not found" });

      const cacheKey = `weather_${venueId}`;
      const cached = weatherCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
        return res.json(cached.data);
      }

      const address = venue.address?.trim() || "";
      const lat = venue.latitude;
      const lng = venue.longitude;
      let result: WeatherResult;

      // Priority chain — most accurate to least accurate:
      //   1. Stored coordinates  → Open-Meteo (precise, no geocoding needed)
      //   2. Address string      → wttr.in (handles most real addresses)
      //   3. Venue name          → wttr.in (last resort for venues with no address)
      if (lat && lng) {
        result = await fetchWeatherOpenMeteo(lat, lng, venue.name, address);
      } else if (address) {
        result = await fetchWeatherWttr(address, venue.name, address);
      } else if (venue.name) {
        result = await fetchWeatherWttr(venue.name, venue.name, address);
      } else {
        return res.status(404).json({ message: "Venue has no location data (no coordinates, address, or name)" });
      }

      weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
      res.json(result);
    } catch (err) {
      console.error("Weather API error:", err);
      res.status(500).json({ message: "Failed to fetch weather" });
    }
  });
}
