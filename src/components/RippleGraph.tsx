"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { RippleNode } from "@/types";

interface RippleGraphProps {
  chain: RippleNode[];
  animated?: boolean;
}

export default function RippleGraph({ chain, animated = true }: RippleGraphProps) {
  return (
    <div className="space-y-3">
      {chain.map((node, i) => (
        <div key={node.id}>
          <motion.div
            initial={animated ? { opacity: 0, x: -20 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0"
              style={{
                borderColor: `rgba(0,240,255,${node.impact / 200})`,
                background: `rgba(0,240,255,${node.impact / 500})`,
              }}
            >
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200">{node.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-500 uppercase">{node.category}</span>
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden max-w-[100px]">
                  <motion.div
                    className="h-full bg-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${node.impact}%` }}
                    transition={{ delay: i * 0.3 + 0.2, duration: 0.5 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-cyan-400">{node.impact}%</span>
              </div>
            </div>
          </motion.div>

          {i < chain.length - 1 && (
            <motion.div
              initial={animated ? { opacity: 0 } : false}
              animate={{ opacity: 0.4 }}
              transition={{ delay: i * 0.3 + 0.15 }}
              className="flex justify-center py-1"
            >
              <ArrowRight className="w-3 h-3 text-cyan-400/50 rotate-90" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
