import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-[#0f172a]/90 text-slate-900 dark:text-white border border-slate-200/60 dark:border-white/10 rounded-xl shadow-2xl px-4 py-3 backdrop-blur">
                <p className="text-xs text-slate-500 dark:text-white/70 mb-1">{label}</p>
                <p className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6ee7ff] inline-block" />
                    Views: {payload[0].value?.toLocaleString() ?? 0}
                </p>
            </div>
        );
    }
    return null;
};

const GrowthChart = ({ data, title, color = "#6366f1" }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const gradientId = "growth-gradient";

    const stars = Array.from({ length: 24 }).map((_, idx) => ({
        id: idx,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        opacity: 0.25 + Math.random() * 0.4,
        size: 2 + Math.random() * 2,
    }));

    const cardBg = isDark
        ? "bg-gradient-to-br from-[#0b1120] via-[#0d1328] to-[#0b1120]"
        : "bg-gradient-to-br from-white via-[#f8fafc] to-[#eef2ff]";
    const overlay = isDark
        ? "bg-[radial-gradient(circle_at_20%_20%,rgba(82,152,255,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(132,94,255,0.15),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(45,212,191,0.12),transparent_30%)]"
        : "bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.08),transparent_32%),radial-gradient(circle_at_40%_80%,rgba(16,185,129,0.08),transparent_32%)]";
    const gridColor = isDark ? "#1f2937" : "#e2e8f0";
    const tickColor = isDark ? "#94a3b8" : "#475569";

    const hasData = Array.isArray(data) && data.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full"
        >
            <Card className={`relative h-full flex flex-col overflow-hidden border ${isDark ? "border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.45)]" : "border-slate-200/80 shadow-[0_16px_32px_rgba(15,23,42,0.08)]"} ${cardBg}`}>
                <div className={`absolute inset-0 opacity-70 ${overlay}`} />
                {isDark &&
                    stars.map((star) => (
                        <span
                            key={star.id}
                            className="absolute rounded-full blur-[0.5px]"
                            style={{
                                top: star.top,
                                left: star.left,
                                width: star.size,
                                height: star.size,
                                background: "rgba(255,255,255,0.7)",
                                opacity: star.opacity,
                            }}
                        />
                    ))}

                <CardHeader className="pb-2 shrink-0 relative z-10">
                    <CardTitle className={`flex items-center gap-2 text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                        <TrendingUp className="w-5 h-5 text-[#6ee7ff]" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 min-h-0 relative z-10">
                    {hasData ? (
                        <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data}
                                    margin={{ top: 20, right: 10, left: -10, bottom: 10 }}
                                >
                                    <defs>
                                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6ee7ff" stopOpacity={0.5} />
                                            <stop offset="70%" stopColor="#7c3aed" stopOpacity={0.15} />
                                            <stop offset="100%" stopColor="#0f172a" stopOpacity={0.05} />
                                        </linearGradient>
                                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#6ee7ff" floodOpacity="0.35" />
                                        </filter>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} strokeOpacity={0.35} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: tickColor, fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: tickColor, fontSize: 12 }}
                                        tickFormatter={(value) =>
                                            value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                                        }
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#6ee7ff", strokeWidth: 1, strokeDasharray: "4 4" }} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#6ee7ff"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill={`url(#${gradientId})`}
                                        animationDuration={1400}
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: "#6ee7ff", filter: "url(#shadow)" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-slate-500 dark:text-white/70">
                            No trend data yet.
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default GrowthChart;
