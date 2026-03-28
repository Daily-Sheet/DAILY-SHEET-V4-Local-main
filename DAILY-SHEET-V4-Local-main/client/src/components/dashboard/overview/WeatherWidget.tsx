import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Wind, Droplets } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";

export function getWeatherIcon(code: number) {
  if (code === 0) return <Sun className="h-5 w-5 text-yellow-400" />;
  if (code <= 3) return <Cloud className="h-5 w-5 text-gray-400" />;
  if (code <= 49) return <CloudFog className="h-5 w-5 text-gray-400" />;
  if (code <= 57) return <CloudDrizzle className="h-5 w-5 text-blue-300" />;
  if (code <= 67) return <CloudRain className="h-5 w-5 text-blue-400" />;
  if (code <= 77) return <CloudSnow className="h-5 w-5 text-blue-200" />;
  if (code <= 82) return <CloudRain className="h-5 w-5 text-blue-500" />;
  if (code <= 86) return <CloudSnow className="h-5 w-5 text-blue-300" />;
  if (code <= 99) return <CloudLightning className="h-5 w-5 text-yellow-500" />;
  return <Cloud className="h-5 w-5 text-gray-400" />;
}

export function getWeatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 49) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

export function WeatherWidget({ venueId, date }: { venueId: number; date: string }) {
  const { data: weather, isLoading } = useQuery<any>({
    queryKey: ["/api/weather", venueId],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/weather/${venueId}`), { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  if (isLoading || !weather) return null;

  const dateIdx = weather.daily?.dates?.indexOf(date) ?? -1;
  const currentTemp = weather.current?.temperature;
  const currentCode = weather.current?.weathercode ?? 0;
  const windSpeed = weather.current?.windSpeed;
  const humidity = weather.current?.humidity;
  const high = dateIdx >= 0 ? weather.daily.maxTemps[dateIdx] : null;
  const low = dateIdx >= 0 ? weather.daily.minTemps[dateIdx] : null;
  const dayCode = dateIdx >= 0 ? weather.daily.weatherCodes[dateIdx] : currentCode;

  return (
    <div className="flex items-center gap-3 sm:gap-4 text-secondary-foreground/80 w-full" data-testid={`weather-widget-${venueId}`}>
      <div className="flex items-center gap-2 min-w-0">
        {getWeatherIcon(dayCode)}
        <div className="text-xs leading-tight">
          {currentTemp != null && (
            <div className="font-bold text-sm">{Math.round(currentTemp)}°F</div>
          )}
          {high != null && low != null && (
            <div className="text-[10px] opacity-70">H:{Math.round(high)}° L:{Math.round(low)}°</div>
          )}
          <div className="text-[10px] opacity-60">{getWeatherLabel(dayCode)}</div>
        </div>
      </div>
      {(windSpeed != null || humidity != null) && (
        <div className="flex items-center gap-3 text-[11px] opacity-70">
          {windSpeed != null && (
            <div className="flex items-center gap-1">
              <Wind className="h-3.5 w-3.5" />
              <span>{Math.round(windSpeed)} mph</span>
            </div>
          )}
          {humidity != null && (
            <div className="flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" />
              <span>{humidity}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
