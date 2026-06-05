"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useSuzieStore } from "@/store/suzieStore";

interface ServiceStatus {
  ok: boolean;
  message: string;
  latencyMs?: number;
  configured?: boolean;
}

interface HealthResponse {
  status: string;
  services: Record<string, ServiceStatus>;
}

export default function SettingsPage() {
  const { userMemory, updateMemory, silentWatch, setSilentWatch } = useSuzieStore();
  const [name, setName] = useState(userMemory.name);
  const [country, setCountry] = useState(userMemory.country);
  const [briefingStyle, setBriefingStyle] = useState(userMemory.briefingStyle);
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSave = () => {
    updateMemory({ name, country, briefingStyle });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen pt-16 px-6 pb-8 grid-bg">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold neon-text-cyan tracking-wider">SETTINGS</h1>
          </div>
          <p className="text-sm text-gray-500">Configure SUZIE AI preferences and verify API connections</p>
        </motion.div>

        {/* API Health */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cyan-400 tracking-wider">API STATUS</h2>
            <button
              onClick={checkHealth}
              disabled={checking}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {health && (
            <div className="space-y-2">
              <p className={`text-xs font-mono ${health.status === "healthy" ? "text-green-400" : "text-yellow-400"}`}>
                System: {health.status.toUpperCase()}
              </p>
              {Object.entries(health.services).map(([name, svc]) => (
                <div key={name} className="flex items-start gap-2 text-xs">
                  {svc.ok ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="text-gray-300 capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
                    <p className="text-gray-500">{svc.message}</p>
                    {svc.latencyMs !== undefined && svc.latencyMs > 0 && (
                      <p className="text-gray-600">{svc.latencyMs}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 space-y-6">
          <h2 className="text-sm font-semibold text-cyan-400 tracking-wider">USER PROFILE</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">Your Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Focus Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full mt-1 bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Briefing Style</label>
              <select
                value={briefingStyle}
                onChange={(e) => setBriefingStyle(e.target.value as "short" | "detailed")}
                className="w-full mt-1 bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-400/50"
              >
                <option value="short">Short & Direct</option>
                <option value="detailed">Detailed Analysis</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-sm font-semibold text-cyan-400 tracking-wider">SYSTEM MODES</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-gray-300">Silent Watch Mode</p>
              <p className="text-[10px] text-gray-600">Background scanning with voice alerts for new crises</p>
            </div>
            <input
              type="checkbox"
              checked={silentWatch}
              onChange={(e) => setSilentWatch(e.target.checked)}
              className="w-4 h-4 accent-cyan-400"
            />
          </label>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-sm font-semibold text-cyan-400 tracking-wider">API KEYS</h2>
          <p className="text-[10px] text-gray-600">
            Keys are stored in <code className="text-cyan-400/70">.env.local</code> (never committed to git).
            See <code className="text-cyan-400/70">.env.example</code> for the full list.
          </p>
          {[
            "AIML_API_KEY",
            "BRIGHT_DATA_API_KEY",
            "BRIGHT_DATA_SERP_ZONE",
            "NEWS_API_KEY",
            "OPENWEATHER_API_KEY",
            "SPEECHMATICS_API_KEY",
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          ].map((key) => (
            <div key={key}>
              <label className="text-xs text-gray-500">{key}</label>
              <input
                type="password"
                value="••••••••••••"
                disabled
                className="w-full mt-1 bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-600"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-all"
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
