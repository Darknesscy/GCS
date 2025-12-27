
export interface Zone {
  lat: number;
  lon: number;
  intensity: number;
  name: string;
  description: string;
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

export interface Intel {
  text: string;
  metadata: GroundingMetadata;
  imageUrl?: string;
  audioData?: string;
}
