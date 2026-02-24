import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Activity, Send, CheckCircle2, AlertCircle, Loader2, Settings2, Terminal } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { OpenClawPatch } from "./plugin/OpenClawPatch";

export default function App() {
  const [config, setConfig] = useState({
    homeserver: "https://matrix.org",
    userId: "@your-bot:matrix.org",
    accessToken: "",
    roomId: "!your-room:matrix.org"
  });
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ time: string, msg: string, type: 'info' | 'error' | 'success' | 'ai' }[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const patchRef = useRef<OpenClawPatch | null>(null);

  const addLog = (msg: string, type: 'info' | 'error' | 'success' | 'ai' = 'info') => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    patchRef.current = new OpenClawPatch(socket, process.env.GEMINI_API_KEY || "");

    socket.on("connect", () => addLog("Bridge: WebSocket connected"));
    socket.on("matrix_message", (data: { sender: string, body: string }) => {
      addLog(`Matrix: [${data.sender}] ${data.body}`, "info");
      patchRef.current?.processMessage(data.body, addLog);
    });

    const init = async () => {
      try {
        const configRes = await fetch("/api/matrix/config");
        const saved = await configRes.json();
        if (saved.homeserver) setConfig(prev => ({ ...prev, ...saved }));
        
        const statusRes = await fetch("/api/matrix/status");
        const data = await statusRes.json();
        if (data.connected) setStatus("connected");
      } catch (e) { console.error(e); }
    };
    init();

    return () => { socket.disconnect(); };
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("connecting");
    setError(null);
    try {
      const res = await fetch("/api/matrix/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setStatus("connected");
      addLog("Matrix: Connected successfully", "success");
    } catch (err: any) {
      setStatus("disconnected");
      setError(err.message);
      addLog(`Error: ${err.message}`, "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Header Section */}
        <header className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-3">
              <Shield className="w-10 h-10 text-emerald-500" />
              OPENCLAW <span className="text-zinc-500 font-light">MATRIX PLUGIN</span>
            </h1>
            <p className="text-zinc-500 mt-1">Secure, real-time AI communication bridge</p>
          </div>
          
          <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-full">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-sm font-medium uppercase tracking-wider">
              {status === 'connected' ? 'Live & Listening' : status === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
          </div>
        </header>

        {/* Configuration Panel */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 space-y-6"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-semibold">Configuration</h2>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Homeserver URL</label>
                <input 
                  type="text" 
                  value={config.homeserver}
                  onChange={e => setConfig({...config, homeserver: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="https://matrix.org"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">User ID</label>
                <input 
                  type="text" 
                  value={config.userId}
                  onChange={e => setConfig({...config, userId: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="@bot:matrix.org"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Access Token</label>
                <input 
                  type="password" 
                  value={config.accessToken}
                  onChange={e => setConfig({...config, accessToken: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="syt_..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Room ID</label>
                <input 
                  type="text" 
                  value={config.roomId}
                  onChange={e => setConfig({...config, roomId: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="!roomid:matrix.org"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={status === 'connecting'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
              >
                {status === 'connecting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {status === 'connected' ? 'Update Connection' : 'Initialize Plugin'}
              </button>
            </form>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Plugin Features
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span><strong>E2EE Support:</strong> Messages are decrypted by the client before processing.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span><strong>Typing Indicators:</strong> Real-time feedback while OpenClaw processes.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span><strong>Operation Streams:</strong> Step-by-step updates sent back to the room.</span>
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Activity Log */}
        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 flex flex-col h-[calc(100vh-12rem)]"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-bottom border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-semibold">Activity Stream</h2>
              </div>
              <span className="text-xs text-zinc-500 font-mono">{logs.length} events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                    <Activity className="w-12 h-12 opacity-20" />
                    <p>Waiting for plugin initialization...</p>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border ${
                        log.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                        log.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                        log.type === 'ai' ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300' :
                        'bg-zinc-800/30 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className="leading-relaxed">{log.msg}</span>
                        <span className="text-[10px] opacity-40 shrink-0 mt-1">{log.time}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
