import { env, hasOpenWeather } from "@/lib/env";
import { GlobalEvent } from "@/types";

interface OpenWeatherResponse {
  name: string;
  sys: { country: string };
  coord: { lat: number; lon: number };
  weather: { main: string; description: string }[];
  main: { temp: number; humidity: number };
  wind: { speed: number };
}

export interface WeatherAlert {
  city: string;
  country: string;
  lat: number;
  lng: number;
  condition: string;
  description: string;
  tempC: number;
  humidity: number;
  windSpeed: number;
  riskLevel: GlobalEvent["riskLevel"];
}

export async function fetchWeatherForCity(city: string): Promise<WeatherAlert | null> {
  if (!hasOpenWeather()) return null;

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", city);
    url.searchParams.set("appid", env.openWeather.apiKey);
    url.searchParams.set("units", "metric");

    const res = await fetch(url.toString(), { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`OpenWeather ${res.status}`);

    const data: OpenWeatherResponse = await res.json();
    const main = data.weather[0]?.main?.toLowerCase() ?? "";
    const isSevere = ["thunderstorm", "rain", "snow", "tornado"].some((w) => main.includes(w));

    return {
      city: data.name,
      country: data.sys.country,
      lat: data.coord.lat,
      lng: data.coord.lon,
      condition: data.weather[0]?.main ?? "Unknown",
      description: data.weather[0]?.description ?? "",
      tempC: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      riskLevel: isSevere ? "high" : "medium",
    };
  } catch {
    return null;
  }
}

export async function weatherToGlobalEvent(weather: WeatherAlert): Promise<GlobalEvent> {
  return {
    id: `weather-${weather.city.toLowerCase()}`,
    title: `${weather.condition} Alert — ${weather.city}`,
    description: `${weather.description}. Temp ${weather.tempC}°C, humidity ${weather.humidity}%, wind ${weather.windSpeed}m/s.`,
    type: "climate_disaster",
    riskLevel: weather.riskLevel,
    lat: weather.lat,
    lng: weather.lng,
    country: weather.city,
    region: weather.country,
    timestamp: new Date().toISOString(),
    source: "OpenWeather",
    categories: ["climate", "construction"],
    rippleEffects: [
      "Construction site delays possible",
      "Transport disruption risk",
      "Material delivery delays",
    ],
  };
}

export async function fetchLocalWeatherEvents(focusCountry: string): Promise<GlobalEvent[]> {
  const cities =
    focusCountry.toLowerCase().includes("sri lanka")
      ? ["Colombo", "Kandy", "Galle"]
      : [focusCountry];

  const events: GlobalEvent[] = [];
  for (const city of cities) {
    const weather = await fetchWeatherForCity(city);
    if (weather && (weather.riskLevel === "high" || weather.condition.toLowerCase().includes("rain"))) {
      events.push(await weatherToGlobalEvent(weather));
    }
  }
  return events;
}
