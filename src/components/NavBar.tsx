"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Globe, Zap, HardHat, FileText, Settings, LayoutDashboard } from "lucide-react";
import SuzieLogo from "./SuzieLogo";
import WorldPulse from "./WorldPulse";
import { useSuzieStore } from "@/store/suzieStore";

const NAV = [
  { href: "/dashboard", label: "Command", icon: LayoutDashboard },
  { href: "/simulator", label: "Ripple", icon: Zap },
  { href: "/construction", label: "Construction", icon: HardHat },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function NavBar() {
  const pathname = usePathname();
  const riskScores = useSuzieStore((s) => s.riskScores);
  const isOnline = useSuzieStore((s) => s.isOnline);

  if (pathname === "/" || pathname === "/boot") return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass-panel border-b border-cyan-400/10 px-4 py-2">
      <div className="flex items-center justify-between max-w-[1800px] mx-auto">
        <Link href="/dashboard" className="flex items-center gap-3">
          <SuzieLogo className="w-28 sm:w-32" />
          <div className="hidden sm:block">
            <span className="text-[9px] text-gray-500 tracking-wider">
              {isOnline ? "GLOBAL INTELLIGENCE ONLINE" : "GLOBAL INTELLIGENCE"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}>
                <motion.div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    active
                      ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <WorldPulse riskScore={riskScores.overall} />
          <Globe className="w-4 h-4 text-cyan-400/50" />
        </div>
      </div>
    </nav>
  );
}
