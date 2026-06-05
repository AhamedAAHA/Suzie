"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Shield, Globe, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import SuzieLogo from "@/components/SuzieLogo";

const GlobeScene = dynamic(() => import("@/components/GlobeScene"), { ssr: false });

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background globe */}
      <div className="absolute inset-0 opacity-30">
        <GlobeScene events={[]} className="w-full h-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            className="flex justify-center mb-6"
            animate={{ filter: ["drop-shadow(0 0 14px rgba(0,240,255,0.22))", "drop-shadow(0 0 26px rgba(0,240,255,0.42))", "drop-shadow(0 0 14px rgba(0,240,255,0.22))"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <SuzieLogo className="w-[min(74vw,390px)]" />
          </motion.div>

          <p className="text-lg text-gray-400 mb-2 tracking-wide">
            Your Global Intelligence Command Center
          </p>
          <p className="text-sm text-gray-600 mb-10">
            The Global Intelligence Assistant That Watches the World For You
          </p>

          <motion.button
            onClick={() => router.push("/boot")}
            className="group flex items-center gap-3 mx-auto px-8 py-4 rounded-xl border border-cyan-400/40 text-cyan-400 font-semibold tracking-wider hover:bg-cyan-400/10 transition-all"
            whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(0,240,255,0.2)" }}
            whileTap={{ scale: 0.97 }}
          >
            ACTIVATE SUZIE
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <div className="grid grid-cols-3 gap-6 mt-16 text-center">
            {[
              { icon: Globe, label: "3D Global Map", desc: "Live risk visualization" },
              { icon: Zap, label: "Ripple Analysis", desc: "Event impact chains" },
              { icon: Shield, label: "Risk Intelligence", desc: "AI-powered briefings" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-panel p-4">
                <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-300">{label}</p>
                <p className="text-[10px] text-gray-600 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-700 font-mono">
        SUZIE AI v1.0 — GLOBAL INTELLIGENCE SYSTEM — CLASSIFIED
      </div>
    </div>
  );
}
