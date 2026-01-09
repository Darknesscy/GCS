
import { Zone, WeatherPoint } from '../types';

// A grid of major cities to provide global context for the weather layer
const REFERENCE_LOCATIONS = [
  { lat: 40.71, lon: -74.00 }, // NYC
  { lat: 51.50, lon: -0.12 },  // London
  { lat: 35.68, lon: 139.76 }, // Tokyo
  { lat: -33.86, lon: 151.20 }, // Sydney
  { lat: -23.55, lon: -46.63 }, // Sao Paulo
  { lat: 19.07, lon: 72.87 }, // Mumbai
  { lat: 55.75, lon: 37.61 }, // Moscow
  { lat: 30.04, lon: 31.23 }, // Cairo
  { lat: -1.29, lon: 36.82 }, // Nairobi
  { lat: 39.90, lon: 116.40 }, // Beijing
  { lat: 64.14, lon: -21.94 }, // Reykjavik
  { lat: -4.44, lon: 15.26 }, // Kinshasa
  { lat: 61.21, lon: -149.90 }, // Anchorage
  { lat: -54.80, lon: -68.30 }, // Ushuaia
  { lat: 34.05, lon: -118.24 }, // Los Angeles
  { lat: 1.35, lon: 103.81 }, // Singapore
];

export const fetchGlobalWeather = async (activeZones: Zone[]): Promise<WeatherPoint[]> => {
  try {
    // Combine reference locations with active conflict zones for a dense map
    const points = [
      ...REFERENCE_LOCATIONS.map(p => ({ ...p, isReference: true })),
      ...activeZones.map(z => ({ lat: z.lat, lon: z.lon, isReference: false }))
    ];

    const lats = points.map(p => p.lat).join(',');
    const lons = points.map(p => p.lon).join(',');

    // Fetch batch data including wind metrics
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data || !Array.isArray(data)) {
        // Handle single result case if API returns non-array for single point (unlikely here but safe)
        if(data.current) {
             return [{
                 lat: data.latitude,
                 lon: data.longitude,
                 temp: data.current.temperature_2m,
                 precipitation: data.current.precipitation,
                 conditionCode: data.current.weather_code,
                 windSpeed: data.current.wind_speed_10m,
                 windDirection: data.current.wind_direction_10m,
                 isReference: points[0].isReference
             }];
        }
        return [];
    }

    return data.map((loc: any, index: number) => ({
      lat: loc.latitude,
      lon: loc.longitude,
      temp: loc.current.temperature_2m,
      precipitation: loc.current.precipitation,
      conditionCode: loc.current.weather_code,
      windSpeed: loc.current.wind_speed_10m,
      windDirection: loc.current.wind_direction_10m,
      isReference: points[index].isReference
    }));

  } catch (error) {
    console.error("Weather Service Error:", error);
    return [];
  }
};

export const getWeatherDescription = (code: number): string => {
  // WMO Weather interpretation codes (WW)
  if (code === 0) return "Clear Sky";
  if (code >= 1 && code <= 3) return "Partly Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
};
