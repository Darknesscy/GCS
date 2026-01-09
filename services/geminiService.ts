
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CategoriesData, Intel, Zone, GlobalMetrics, SimulationReport, RegionalIntel, StrategicAsset, ReconReport, TrustAnalysis } from '../types';

// Robust JSON Sanitizer to handle LLM quirks
const sanitizeJson = (text: string): string => {
  let clean = text.trim();
  // Remove markdown blocks if present
  if (clean.startsWith('```json')) clean = clean.replace(/^```json/, '');
  if (clean.startsWith('```')) clean = clean.replace(/^```/, '');
  if (clean.endsWith('```')) clean = clean.replace(/```$/, '');
  
  clean = clean.trim();
  
  // Remove trailing commas in objects/arrays which often break standard JSON.parse
  clean = clean.replace(/,\s*([\]}])/g, '$1');
  
  return clean;
};

// Fallback Mock Data Generators
const getStaticData = (): CategoriesData => ({
  environmental: { color: 0x00ff88, name: 'Environmental', zones: [{ lat: -3.46, lon: -62.21, intensity: 0.9, severity: 8, affectedRadius: 500, name: 'Amazon Tipping Point', description: 'Critical deforestation levels reached.' }] },
  war: { color: 0xff4400, name: 'Active Combat', zones: [{ lat: 48.37, lon: 31.16, intensity: 0.95, severity: 9, affectedRadius: 100, name: 'Donbas Offensive', description: 'Intense artillery exchanges reported.' }] },
  social: { color: 0x0088ff, name: 'Civil Unrest', zones: [{ lat: 35.68, lon: 139.76, intensity: 0.4, severity: 3, affectedRadius: 20, name: 'Tokyo Economic Protest', description: 'Small scale march regarding inflation.' }] },
  government: { color: 0xaa00ff, name: 'Political Instability', zones: [{ lat: 15.32, lon: 44.19, intensity: 0.85, severity: 7, affectedRadius: 150, name: 'Sana\'a Crisis', description: 'Governance collapse in major districts.' }] },
  species: { color: 0xffcc00, name: 'Ecological Collapse', zones: [{ lat: -18.28, lon: 147.69, intensity: 0.7, severity: 6, affectedRadius: 1000, name: 'Great Barrier Reef Bleaching', description: 'Mass coral mortality detected.' }] },
  radiation: { color: 0xffff00, name: 'Radiological Risk', zones: [{ lat: 37.42, lon: 141.03, intensity: 0.6, severity: 5, affectedRadius: 30, name: 'Fukushima Exclusion', description: 'Ongoing monitoring of water release.' }] },
  phenomena: { color: 0xffffff, name: 'Anomalous Phenomena', zones: [{ lat: 37.24, lon: -115.81, intensity: 0.9, severity: 10, affectedRadius: 50, name: 'Nevada UAP Corridor', description: 'Persistent unidentified aerial signatures detected.' }] }
});

const getMockMetrics = (): GlobalMetrics => ({
  cyberLevel: 45,
  civilUnrest: 30,
  economicInstability: 55,
  defcon: 3
});

const getMockAssets = (): StrategicAsset[] => [
  { id: '1', name: 'USS Gerald R. Ford', type: 'NAVAL', lat: 36.0, lon: -5.0, status: 'ACTIVE' },
  { id: '2', name: 'Global Hawk 7', type: 'AIR', lat: 25.0, lon: 55.0, status: 'DEPLOYING' },
  { id: '3', name: 'Cyber Command Node', type: 'CYBER', lat: 39.0, lon: -77.0, status: 'ACTIVE' }
];

const getMockRegionalIntel = (region: string): RegionalIntel => ({
  regionName: region,
  threatLevel: 42,
  summary: "DATA LINK UNSTABLE. SHOWING CACHED INTEL: Regional stability holding within nominal variance. Monitoring low-level signal traffic."
});

const getMockIntel = (zone: Zone): Intel => ({
  summary: `OFFLINE MODE: Automated analysis of ${zone.name}. Situation critical but stable.`,
  historicalContext: "Data unavailable due to network partition. Historical records indicate long-standing geopolitical friction in this sector.",
  currentDynamics: "Satellite imagery unavailable. Ground reports suggest sporadic activity.",
  strategicSignificance: "High value strategic interest due to location and resources.",
  metadata: { groundingChunks: [] },
  trust: { score: 0, level: 'UNVERIFIED', sourceCount: 0, verificationNote: 'Offline: Unable to verify via satellite/web uplink.' }
});

const handleGeminiError = (error: any, context: string): void => {
  const msg = error.message || error.toString();
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
    console.warn(`[System Uplink] ${context} running in OFFLINE MODE (Quota Limit). Switching to simulation data.`);
  } else {
    console.error(`[System Uplink] Error fetching ${context}:`, error);
  }
};

export const fetchConflictZones = async (): Promise<CategoriesData> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Identify REAL-WORLD, CONFIRMED events from the last 7 days.
      Output a JSON object for a global conflict visualization.
      Categories: environmental, social, government, species, radiation, war, phenomena.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(sanitizeJson(response.text || "{}"));
  } catch (error) {
    handleGeminiError(error, "Zones");
    return getStaticData();
  }
};

export const fetchHistoricalConflictZones = async (year: number): Promise<CategoriesData> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Provide historical crisis data for the year ${year}. Return JSON.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(sanitizeJson(response.text || "{}"));
  } catch (error) {
    handleGeminiError(error, "Historical Data");
    return getStaticData();
  }
};

export const fetchScenarioZones = async (scenario: string): Promise<CategoriesData> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate hypothetical crisis zones for scenario: "${scenario}". Return JSON.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(sanitizeJson(response.text || "{}"));
  } catch (error) {
    handleGeminiError(error, "Scenario");
    return getStaticData();
  }
};

const calculateTrustScore = (groundingMetadata: any): TrustAnalysis => {
    const chunks = groundingMetadata?.groundingChunks || [];
    const count = chunks.length;
    let score = count === 0 ? 0 : Math.min(100, 40 + (count * 10));
    let level: TrustAnalysis['level'] = score > 90 ? 'CONFIRMED' : score > 75 ? 'HIGH' : score > 50 ? 'MODERATE' : score > 0 ? 'LOW' : 'UNVERIFIED';
    return { score, level, sourceCount: count, verificationNote: "Analysis complete." };
};

export const fetchZoneIntel = async (zone: Zone, year?: number): Promise<Intel | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Perform a deep intelligence analysis on "${zone.name}". Return JSON.`;
    const textResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        tools: year ? [] : [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }, 
    });

    const data = JSON.parse(sanitizeJson(textResponse.text || "{}"));
    const trust = calculateTrustScore(textResponse.candidates?.[0]?.groundingMetadata);

    return { ...data, metadata: textResponse.candidates?.[0]?.groundingMetadata ?? {}, trust };
  } catch (error) {
    handleGeminiError(error, "Intel Analysis");
    return getMockIntel(zone);
  }
};

export const fetchGlobalTicker = async (year?: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 urgent global headlines ${year ? `from ${year}` : 'from today'}. Format: [TIME] HEADLINE.`,
      config: { tools: year ? [] : [{ googleSearch: {} }] }
    });
    return response.text || "NO ACTIVE ALERTS";
  } catch (error) {
    handleGeminiError(error, "Ticker");
    return "OFFLINE MODE: ARCHIVE DATA LOADED...";
  }
};

export const fetchGlobalMetrics = async (): Promise<GlobalMetrics> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Calculate Global metrics (cyberLevel, civilUnrest, economicInstability, defcon). Return JSON.",
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(sanitizeJson(response.text || "{}"));
    } catch (e) {
      handleGeminiError(e, "Metrics");
      return getMockMetrics();
    }
};

export const fetchStrategicAssets = async (): Promise<StrategicAsset[]> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "List 10 major active military assets with public lat/lon. Return JSON object with 'assets' array.",
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(sanitizeJson(response.text || "{}"));
      return data.assets || [];
    } catch (e) {
      handleGeminiError(e, "Assets");
      return getMockAssets();
    }
};

export const fetchRegionalIntel = async (regionName: string, activeZones: string[]): Promise<RegionalIntel> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide regional stability analysis for ${regionName}. Return JSON.`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(sanitizeJson(response.text || "{}"));
    } catch (e) {
      handleGeminiError(e, "Regional Intel");
      return getMockRegionalIntel(regionName);
    }
};

export const runZoneSimulation = async (zone: Zone): Promise<SimulationReport | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Run a high-fidelity simulation for ${zone.name}. Return JSON.`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(sanitizeJson(response.text || "{}"));
    } catch (e) {
      handleGeminiError(e, "Simulation");
      return null;
    }
};
export const generateBriefingVideo = async (zone: Zone): Promise<string | null> => { return null; };
export const analyzeReconImage = async (base64Image: string): Promise<ReconReport | null> => { return null; };
