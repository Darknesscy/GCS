
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import { playSuccessSound, playAlertSound } from '../utils/soundEffects';

const tools: FunctionDeclaration[] = [
  {
    name: "update_globe_view",
    description: "Move the globe to focus on a specific location (latitude/longitude) or region.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER, description: "Latitude coordinate" },
        lon: { type: Type.NUMBER, description: "Longitude coordinate" },
        label: { type: Type.STRING, description: "Name of the location" }
      },
      required: ["lat", "lon"]
    }
  },
  {
    name: "activate_category",
    description: "Turn a specific data layer/category on or off.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, enum: ["environmental", "social", "government", "species", "radiation", "war", "phenomena"] },
        active: { type: Type.BOOLEAN }
      },
      required: ["category", "active"]
    }
  },
  {
    name: "run_simulation_scenario",
    description: "Initiate a hypothetical global scenario simulation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        scenario_description: { type: Type.STRING, description: "The description of the scenario to simulate." }
      },
      required: ["scenario_description"]
    }
  },
  {
    name: "inspect_zone_by_name",
    description: "Find and open intelligence reports for a specific conflict zone or area by name.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the zone or country to inspect." }
      },
      required: ["name"]
    }
  }
];

interface UseCommanderVoiceProps {
  onUpdateView: (lat: number, lon: number) => void;
  onToggleCategory: (category: string, active: boolean) => void;
  onRunScenario: (scenario: string) => void;
  onInspectZone: (name: string) => void;
}

export const useCommanderVoice = ({ onUpdateView, onToggleCategory, onRunScenario, onInspectZone }: UseCommanderVoiceProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); 
  const [isListening, setIsListening] = useState(false); 
  const [permissionError, setPermissionError] = useState(false);
  const sessionRef = useRef<any>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const disconnect = () => {
    if (inputContextRef.current) inputContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    if (sessionRef.current) {
       sessionRef.current.then((s: any) => { if(s && s.close) s.close(); });
    }
    for (const source of sourcesRef.current) {
        source.stop();
    }
    sourcesRef.current.clear();
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  const connect = async () => {
    setPermissionError(false);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
             setIsConnected(true);
             setIsListening(true);
             playSuccessSound();
             
             const ctx = inputContextRef.current!;
             const source = ctx.createMediaStreamSource(stream);
             const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
             
             scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(session => {
                   session.sendRealtimeInput({ media: pcmBlob });
                });
             };
             
             source.connect(scriptProcessor);
             scriptProcessor.connect(ctx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Interruptions
            if (msg.serverContent?.interrupted) {
                for (const source of sourcesRef.current) {
                    try { source.stop(); } catch(e) {}
                }
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
                return;
            }

            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
               setIsSpeaking(true);
               const ctx = outputContextRef.current!;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx, 24000);
               const source = ctx.createBufferSource();
               source.buffer = buffer;
               source.connect(ctx.destination);
               source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
               });
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += buffer.duration;
               sourcesRef.add(source);
            }

            // Handle Tool Calls
            if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                   let result: any = { status: "ok" };
                   playSuccessSound();

                   if (fc.name === 'update_globe_view') {
                      onUpdateView(fc.args.lat as number, fc.args.lon as number);
                      result = { status: "view updated" };
                   } else if (fc.name === 'activate_category') {
                      onToggleCategory(fc.args.category as string, fc.args.active as boolean);
                      result = { status: "layer updated" };
                   } else if (fc.name === 'run_simulation_scenario') {
                      onRunScenario(fc.args.scenario_description as string);
                      result = { status: "simulation started" };
                   } else if (fc.name === 'inspect_zone_by_name') {
                      onInspectZone(fc.args.name as string);
                      result = { status: "inspecting" };
                   }
                   
                   sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: {
                           id: fc.id,
                           name: fc.name,
                           response: { result }
                        }
                      });
                   });
                }
            }
          },
          onclose: () => disconnect(),
          onerror: (e) => {
            console.error("Live Error", e);
            playAlertSound();
            disconnect();
          }
        },
        config: {
           responseModalities: [Modality.AUDIO],
           tools: [{ functionDeclarations: tools }],
           systemInstruction: "You are the AI interface for a global conflict monitoring station. You are concise, tactical, and professional. You provide real-time updates and control the globe visualization. Use the tools provided when the user asks to move the view, toggle layers, or simulate scenarios."
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e: any) {
      const msg = e.message || e.toString();
      const isPermission = 
        e.name === 'NotAllowedError' || 
        e.name === 'PermissionDismissedError' || 
        msg.toLowerCase().includes('permission') || 
        msg.toLowerCase().includes('dismissed') || 
        msg.toLowerCase().includes('denied');

      if (isPermission) {
        console.warn("Microphone permission was dismissed or denied.");
        setPermissionError(true);
      } else {
        console.error("Connection Failed", e);
        playAlertSound();
      }
      setIsConnected(false);
    }
  };

  return { connect, disconnect, isConnected, isSpeaking, isListening, permissionError };
};
