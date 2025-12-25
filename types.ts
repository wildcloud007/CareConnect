export interface ServicePlan {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface AudioVisualizerProps {
  isPlaying: boolean;
  isListening: boolean;
  volume: number;
}
