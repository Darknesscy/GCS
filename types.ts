
export interface Zone {
  lat: number;
  lon: number;
  intensity: number;
  name: string;
  description: string;
  severity: number; // 1-10 scale
  affectedRadius: number; // in km
}

export interface Category {
  color: number;
  name: string;
  zones: Zone[];
}

export interface CategoriesData {
  [key: string]: Category;
}

export interface SelectedZoneInfo {
  zone: Zone;
  categoryName: string;
  categoryColor: number;
}

export interface GroundingChunk {
  web?: { uri: string; title: string; };
  maps?: { uri: string; title: string; };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface TimelineEvent {
  timeframe: string; // e.g., "T+7 Days"
  headline: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SimulationReport {
  outcome: string;
  probability: number;
  tacticalAdvice: string;
  timeline: TimelineEvent[];
  futureImplications: string; // New field for long-term outlook
}

export interface GlobalMetrics {
  cyberLevel: number; // 0-100
  civilUnrest: number; // 0-100
  economicInstability: number; // 0-100
  defcon: number; // 1-5
}

export interface TrustAnalysis {
  score: number; // 0-100
  level: 'UNVERIFIED' | 'LOW' | 'MODERATE' | 'HIGH' | 'CONFIRMED';
  sourceCount: number;
  verificationNote: string;
}

export interface Intel {
  summary: string;
  historicalContext: string;
  currentDynamics: string;
  strategicSignificance: string;
  metadata: GroundingMetadata;
  trust: TrustAnalysis; // The "Brain" assessment of accuracy
  imageUrl?: string;
  audioData?: string;
  simulation?: SimulationReport; 
}

export interface RegionalIntel {
  regionName: string;
  threatLevel: number; // 0-100
  summary: string;
}

export interface WeatherPoint {
  lat: number;
  lon: number;
  temp: number; // Celsius
  conditionCode: number; // WMO code
  precipitation: number; // mm
  windSpeed: number; // m/s
  windDirection: number; // degrees
  isReference?: boolean; // True if it's a major city, False if it's a conflict zone
}

export interface StrategicAsset {
  id: string;
  name: string;
  type: 'NAVAL' | 'AIR' | 'CYBER' | 'AID';
  lat: number;
  lon: number;
  status: 'ACTIVE' | 'DEPLOYING' | 'HOLDING';
}

export interface ReconReport {
  analysis: string;
  threatScore: number;
  detectedAssets: string[];
  tacticalRecommendation: string;
}
