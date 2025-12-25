import React, { useState, useRef, useEffect } from 'react';
import { GeminiLiveService } from './services/geminiLive';
import { AudioVisualizer } from './components/AudioVisualizer';
import { SERVICE_PLANS, ICONS } from './constants';
import { ConnectionState } from './types';

const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Ref to hold the service instance to prevent recreation on re-renders
  const geminiServiceRef = useRef<GeminiLiveService | null>(null);

  useEffect(() => {
    // Initialize service once
    const service = new GeminiLiveService();
    
    service.onConnect = () => {
      setConnectionState(ConnectionState.CONNECTED);
      setErrorMsg(null);
    };
    
    service.onDisconnect = () => {
      setConnectionState(ConnectionState.DISCONNECTED);
      setIsPlaying(false);
    };

    service.onError = (err) => {
      setConnectionState(ConnectionState.ERROR);
      setErrorMsg(err.message || 'An error occurred with the voice service.');
      console.error(err);
    };

    service.onAudioActivity = (playing) => {
      setIsPlaying(playing);
    };

    geminiServiceRef.current = service;

    return () => {
      service.disconnect();
    };
  }, []);

  const toggleConnection = async () => {
    if (!geminiServiceRef.current) return;

    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      await geminiServiceRef.current.disconnect();
    } else {
      setConnectionState(ConnectionState.CONNECTING);
      await geminiServiceRef.current.connect();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="bg-teal-600 p-2 rounded-lg">
                <ICONS.Phone />
              </div>
              <span className="ml-3 text-xl font-bold text-slate-800">CareConnect</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#services" className="text-slate-600 hover:text-teal-600 font-medium">Services</a>
              <a href="#about" className="text-slate-600 hover:text-teal-600 font-medium">About Us</a>
              <button className="bg-teal-600 text-white px-4 py-2 rounded-md font-medium hover:bg-teal-700 transition">
                Book Assessment
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero / Voice Agent Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white pb-24">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080" 
            alt="Caregiver holding hands" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Compassionate Care,<br />Right at Home
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            Speak with "Grace," our AI Care Coordinator, to discuss your family's needs, understand our plans, and schedule your free in-home safety assessment instantly.
          </p>

          {/* Voice Interface Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md mx-auto shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <div className="inline-block p-1 bg-teal-500/20 rounded-full mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                  connectionState === ConnectionState.CONNECTED ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {connectionState === ConnectionState.CONNECTED ? 'Live Agent Active' : 'Agent Offline'}
                </span>
              </div>
              <h3 className="text-2xl font-bold">Talk to Grace</h3>
            </div>

            <AudioVisualizer 
              isPlaying={isPlaying} 
              isListening={connectionState === ConnectionState.CONNECTED && !isPlaying}
              volume={0.5} 
            />

            {errorMsg && (
              <div className="mb-4 text-sm text-red-300 bg-red-900/20 p-2 rounded border border-red-500/50">
                {errorMsg}
              </div>
            )}

            <button
              onClick={toggleConnection}
              disabled={connectionState === ConnectionState.CONNECTING}
              className={`w-full flex items-center justify-center py-4 px-6 rounded-xl text-lg font-bold shadow-lg transition-all transform active:scale-95 ${
                connectionState === ConnectionState.CONNECTED 
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-teal-500 hover:bg-teal-400 text-white'
              } ${connectionState === ConnectionState.CONNECTING ? 'opacity-70 cursor-wait' : ''}`}
            >
              {connectionState === ConnectionState.CONNECTING ? (
                'Connecting...'
              ) : connectionState === ConnectionState.CONNECTED ? (
                <>
                  <span className="mr-2"><ICONS.MicOff /></span> End Conversation
                </>
              ) : (
                <>
                  <span className="mr-2"><ICONS.Mic /></span> Start Conversation
                </>
              )}
            </button>
            <p className="mt-4 text-xs text-slate-400">
              Microphone access required. Powered by Gemini Native Audio.
            </p>
          </div>
        </div>
      </div>

      {/* Service Plans Section */}
      <div id="services" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Tailored Care Plans</h2>
            <p className="mt-4 text-xl text-slate-600">We customize our support to match your specific lifestyle and medical needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICE_PLANS.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-100 overflow-hidden group">
                <div className="p-8">
                  <div className="text-4xl mb-6 bg-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{plan.title}</h3>
                  <p className="text-slate-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-teal-500 mr-2 mt-1"><ICONS.Check /></span>
                        <span className="text-slate-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100">
                  <button className="w-full py-2 text-teal-700 font-semibold hover:text-teal-900 text-sm">
                    Learn More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-teal-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 text-white">
            <h2 className="text-3xl font-bold mb-2">Ready to schedule an assessment?</h2>
            <p className="text-teal-100 text-lg">Our care coordinators are available 24/7 to answer your questions.</p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-white text-teal-800 px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-slate-100 transition">
              Call (555) 123-4567
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">CareConnect</h3>
            <p className="text-sm">Providing dignified, professional home healthcare since 2010.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>Companion Care</li>
              <li>Personal Care</li>
              <li>Nursing Services</li>
              <li>Respite Care</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>About Us</li>
              <li>Careers</li>
              <li>Locations</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Patient Rights</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
