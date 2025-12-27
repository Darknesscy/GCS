
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CategoriesData, Intel, Zone } from '../types';

const categorySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    color: { type: Type.INTEGER },
    zones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          lat: { type: Type.NUMBER },
          lon: { type: Type.NUMBER },
          intensity: { type: Type.NUMBER },
        },
      },
    },
  },
};

const fullSchema = {
  type: Type.OBJECT,
  properties: {
    environmental: categorySchema,
    social: categorySchema,
    government: categorySchema,
    species: categorySchema,
    radiation: categorySchema,
    war: categorySchema,
  },
};

export const fetchConflictZones = async (): Promise<CategoriesData> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Provide a JSON object of current global crisis and conflict zones for a 3D visualization.
      Categories: "environmental", "social", "government", "species", "radiation", "war".
      Each category needs a hex color integer and an array of 3-5 real-world zones with lat, lon, and intensity (0.1-1.0).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: fullSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return getStaticData();
  }
};

export const fetchHistoricalConflictZones = async (year: number): Promise<CategoriesData> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Provide a JSON object of global geopolitical and environmental crisis zones as they existed in the year ${year}.
      This is for a historical visualization project. 
      Identify major conflicts, social movements, and ecological issues of that specific era.
      Categories: "environmental", "social", "government", "species", "radiation", "war".
      Return 3-5 major zones per category with accurate lat/lon coordinates.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: fullSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Historical Gemini Error:", error);
    return getStaticData();
  }
};

export const fetchZoneIntel = async (zone: Zone, year?: number): Promise<Intel | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const timeContext = year ? `in the year ${year}` : "currently";
    
    // Switch to gemini-2.5-flash for Maps grounding compatibility as per guidelines.
    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a detailed intelligence report on the situation at "${zone.name}" ${timeContext}. Focus on tactical implications and developments specific to this period.`,
      config: { tools: year ? [] : [{ googleSearch: {} }, { googleMaps: {} }] }, // Grounding only for current
    });

    const intelText = textResponse.text || "Operational intelligence unavailable.";

    // Generate visualization image
    let imageUrl: string | undefined;
    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: `A tactical satellite or archival surveillance photo of ${zone.name} ${timeContext}. The style should be futuristic surveillance UI with neon markers. 1K resolution.`,
        config: { imageConfig: { aspectRatio: "16:9" } },
      });
      const part = imgResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) { console.warn("Image gen failed", e); }

    // Generate Audio Briefing
    let audioData: string | undefined;
    try {
      const audioResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Historical Briefing for ${zone.name}, ${year || 'Current'}: ${intelText.substring(0, 300)}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        },
      });
      audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) { console.warn("Audio gen failed", e); }

    return {
      text: intelText,
      metadata: textResponse.candidates?.[0]?.groundingMetadata ?? {},
      imageUrl,
      audioData,
    };
  } catch (error) {
    console.error("Intel Fetch Error:", error);
    return null;
  }
};

export const fetchGlobalTicker = async (year?: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const timeContext = year ? `from the year ${year}` : "from recent news";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 very short, urgent one-sentence headlines ${timeContext}. Format: [TIME] HEADLINE // [TIME] HEADLINE`,
    });
    return response.text || "NO ACTIVE ALERTS";
  } catch {
    return "SYSTEM STATUS: MONITORING GLOBAL STABILITY... ALL CHANNELS ACTIVE... STANDBY FOR UPDATES...";
  }
};

const getStaticData = (): CategoriesData => ({
  environmental: { color: 0x00ff88, name: 'Environmental', zones: [{ lat: -3.46, lon: -62.21, intensity: 0.9, name: 'Amazon Tipping Point', description: 'Critical deforestation levels reached.' }] },
  war: { color: 0xff4400, name: 'Active Combat', zones: [{ lat: 48.37, lon: 31.16, intensity: 0.95, name: 'Donbas Offensive', description: 'Intense artillery exchanges reported.' }] },
  social: { color: 0x0088ff, name: 'Civil Unrest', zones: [{ lat: 35.68, lon: 139.76, intensity: 0.4, name: 'Tokyo Economic Protest', description: 'Small scale march regarding inflation.' }] },
  government: { color: 0xaa00ff, name: 'Political Instability', zones: [{ lat: 15.32, lon: 44.19, intensity: 0.85, name: 'Sana\'a Crisis', description: 'Governance collapse in major districts.' }] },
  species: { color: 0xffcc00, name: 'Ecological Collapse', zones: [{ lat: -18.28, lon: 147.69, intensity: 0.7, name: 'Great Barrier Reef Bleaching', description: 'Mass coral mortality detected.' }] },
  radiation: { color: 0xffff00, name: 'Radiological Risk', zones: [{ lat: 37.42, lon: 141.03, intensity: 0.6, name: 'Fukushima Exclusion', description: 'Ongoing monitoring of water release.' }] }
});
