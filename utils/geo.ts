
export const getRegionFromLatLon = (lat: number, lon: number): string => {
  if (lat < -60) return "Antarctica";
  if (lat > 15 && lon > -170 && lon < -50) return "North America";
  if (lat <= 15 && lat > -60 && lon > -90 && lon < -30) return "South America";
  if (lat > 35 && lon > -10 && lon < 50) return "Europe";
  if (lat <= 35 && lat > -40 && lon > -20 && lon < 55) return "Africa";
  if (lat > 10 && lon > 55 && lon < 180) return "Asia"; // Broad simplification
  if (lat <= 10 && lat > -50 && lon > 110 && lon < 180) return "Oceania";
  if (lon > 30 && lon < 60 && lat > 10 && lat < 45) return "Middle East"; // Overlap handling
  return "International Waters";
};
