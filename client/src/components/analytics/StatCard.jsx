import React, { useMemo } from "react";
import { Card, CardContent } from "../ui/Card";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const palette = {
  blue: {
    iconBg: "from-[#1f3b8c] to-[#3b82f6]",
    glow: "shadow-[0_0_35px_rgba(59,130,246,0.28)]",
    line: "url(#grad-blue)",
  },
  rose: {
    iconBg: "from-[#8b1e74] to-[#ec4899]",
    glow: "shadow-[0_0_35px_rgba(236,72,153,0.28)]",
    line: "url(#grad-rose)",
  },
  amber: {
    iconBg: "from-[#8c5a1f] to-[#f59e0b]",
    glow: "shadow-[0_0_35px_rgba(245,158,11,0.28)]",
    line: "url(#grad-amber)",
  },
  emerald: {
    iconBg: "from-[#0f5133] to-[#10b981]",
    glow: "shadow-[0_0_35px_rgba(16,185,129,0.28)]",
    line: "url(#grad-emerald)",
  },
  primary: {
    iconBg: "from-[#1f2937] to-[#6366f1]",
    glow: "shadow-[0_0_35px_rgba(99,102,241,0.28)]",
    line: "url(#grad-primary)",
  },
};

const sparkPath = "M4 26 C 26 8, 46 36, 74 22 S 112 16, 132 26";

const StatCard = ({ label, value, icon: Icon, trend, trendValue, color = "primary", delay = 0 }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isPositive = trend === "up";
  const isNegative = trend === "down";
  const accent = palette[color] || palette.primary;
  const gradId = useMemo(() => `spark-${color}-${label.replace(/\s+/g, "-").toLowerCase()}`, [color, label]);
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-white/70" : "text-slate-600";
  const cardBg = isDark
    ? "from-[#0b1224] via-[#0e152d] to-[#0b1224]"
    : "from-white via-white to-[#f6f7fb]";
  const cardBorder = isDark ? "border-white/5" : "border-slate-200/80";
  const pillBase = isDark ? "backdrop-blur border border-white/10" : "border border-slate-200 bg-white/95";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="h-full"
    >
      <Card className={`relative h-full overflow-hidden border ${cardBorder} bg-gradient-to-br ${cardBg} ${isDark ? "text-white shadow-[0_20px_45px_rgba(0,0,0,0.35)]" : "text-slate-900 shadow-[0_16px_32px_rgba(15,23,42,0.06)]"}`}>
        {isDark && (
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.03),transparent_30%)]" />
        )}
        <CardContent className="relative z-10 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${accent.iconBg} ${isDark ? accent.glow : "shadow-[0_8px_18px_rgba(15,23,42,0.08)]"}`}>
              <Icon className="w-6 h-6 text-white drop-shadow" />
            </div>
            {trendValue && (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${pillBase} ${
                  isPositive
                    ? isDark ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"
                    : isNegative
                    ? isDark ? "bg-rose-500/15 text-rose-200" : "bg-rose-50 text-rose-700"
                    : isDark ? "bg-white/10 text-white/80" : "bg-slate-50 text-slate-700"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : isNegative ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {trendValue}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className={`text-sm ${textSecondary}`}>{label}</p>
            <p className={`text-3xl font-bold tracking-tight ${textPrimary}`} title={value}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
