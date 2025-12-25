import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData } from '../utils/audio';

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private activeStream: MediaStream | null = null;
  private sessionPromise: Promise<any> | null = null;
  
  // Callbacks
  public onConnect?: () => void;
  public onDisconnect?: () => void;
  public onError?: (error: any) => void;
  public onAudioActivity?: (isPlaying: boolean) => void;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect() {
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      this.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live Error:', e);
            this.onError?.(e);
          },
          onclose: (e: CloseEvent) => {
            console.log('Gemini Live Closed:', e);
            this.onDisconnect?.();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are "Grace", a compassionate and professional care coordinator for "CareConnect Home Healthcare Agency". 
          
          Your goal is to have a natural spoken conversation to:
          1. Qualify the user's care needs (Ask about the patient's age, medical conditions like Dementia/Alzheimer's, mobility issues, and what daily activities they need help with).
          2. Explain our service plans based on their needs.
             - "Companion Care": Light housekeeping, meal prep, social engagement.
             - "Personal Care": Bathing, dressing, grooming, mobility assistance.
             - "Specialized Care": Alzheimer's/Dementia support, post-op recovery.
          3. Ultimately schedule a "Free In-Home Safety & Care Assessment". Ask for a preferred day/time.

          Keep your responses concise (2-3 sentences max) to allow for a back-and-forth conversation. Be warm, empathetic, and reassuring. If the user mentions a medical emergency, tell them to hang up and dial 911.`,
        },
      };

      this.sessionPromise = this.ai.live.connect(config);
    } catch (err) {
      this.onError?.(err);
    }
  }

  private handleOpen() {
    if (!this.inputAudioContext || !this.activeStream) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.activeStream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      if (this.sessionPromise) {
        this.sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      }
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
    
    this.onConnect?.();
  }

  private async handleMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext) return;

    const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    
    if (base64EncodedAudioString) {
      this.onAudioActivity?.(true);

      // Sync timing
      this.nextStartTime = Math.max(
        this.nextStartTime,
        this.outputAudioContext.currentTime,
      );

      const audioBuffer = await decodeAudioData(
        decode(base64EncodedAudioString),
        this.outputAudioContext,
        24000,
        1,
      );

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Gain node for volume control if needed, connecting directly for now
      source.connect(this.outputAudioContext.destination);

      source.addEventListener('ended', () => {
        this.sources.delete(source);
        if (this.sources.size === 0) {
           this.onAudioActivity?.(false);
        }
      });

      source.start(this.nextStartTime);
      this.nextStartTime = this.nextStartTime + audioBuffer.duration;
      this.sources.add(source);
    }

    // Handle interruptions
    const interrupted = message.serverContent?.interrupted;
    if (interrupted) {
      console.log('Interrupted by user');
      this.stopAllAudio();
      this.nextStartTime = 0;
      this.onAudioActivity?.(false);
    }
  }

  private stopAllAudio() {
    for (const source of this.sources.values()) {
      source.stop();
      this.sources.delete(source);
    }
  }

  async disconnect() {
    this.stopAllAudio();
    
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }

    if (this.inputAudioContext) {
      await this.inputAudioContext.close();
      this.inputAudioContext = null;
    }

    if (this.outputAudioContext) {
      await this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    // We can't explicitly "close" the session via the SDK in the provided snippet
    // but stopping the stream handles the client side.
    this.sessionPromise = null;
    this.onDisconnect?.();
  }
}
