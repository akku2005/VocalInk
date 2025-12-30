import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { motion } from "framer-motion";
import { Users, MapPin, UserX, MapPinOff } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-2 border border-border rounded shadow-lg text-xs">
                <p className="font-semibold text-text-primary">{label}</p>
                <p className="text-primary-600 dark:text-primary-400">
                    {payload[0].value}%
                </p>
            </div>
        );
    }
    return null;
};

// Check if data has any actual values
const hasAgeData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return false;
    return data.some((item) => (item.value || 0) > 0);
};

const hasLocationData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return false;
    return data.some((item) => (item.value || 0) > 0);
};

const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-4">
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700/50 mb-3">
            <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-medium text-text-primary mb-1">{title}</p>
        <p className="text-xs text-text-secondary max-w-[200px]">{description}</p>
    </div>
);

export const AgeDistributionChart = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const showChart = hasAgeData(data);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
                <CardHeader className="pb-2 shrink-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5 text-blue-500" />
                        Age Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 min-h-0">
                    {showChart ? (
                        <div className="w-full h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="range"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                        tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#8b5cf6"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyState
                            icon={UserX}
                            title="No age data yet"
                            description="Follower demographics will appear here as your audience grows"
                        />
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export const LocationChart = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const showChart = hasLocationData(data);

    const mapPositions = {
        "usa": { top: 38, left: 24 },
        "united states": { top: 38, left: 24 },
        "canada": { top: 30, left: 22 },
        "mexico": { top: 46, left: 22 },
        "brazil": { top: 64, left: 32 },
        "uk": { top: 32, left: 44 },
        "united kingdom": { top: 32, left: 44 },
        "germany": { top: 38, left: 48 },
        "france": { top: 40, left: 46 },
        "europe": { top: 36, left: 46 },
        "india": { top: 48, left: 64 },
        "asia": { top: 46, left: 70 },
        "japan": { top: 34, left: 76 },
        "china": { top: 40, left: 68 },
        "australia": { top: 72, left: 80 },
        "australia/new zealand": { top: 76, left: 82 },
        "africa": { top: 56, left: 48 },
        "nigeria": { top: 56, left: 48 },
        "south africa": { top: 68, left: 50 },
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#0d1428] to-[#0b1220] text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_35%)]" />
                <CardHeader className="pb-2 shrink-0 relative z-10">
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        Top Locations
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 min-h-0 relative z-10">
                    {showChart ? (
                        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-white/5 bg-[#0f172a]">
                            <div
                                className="absolute inset-0 bg-no-repeat bg-center bg-contain opacity-50"
                                style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')" }}
                            />
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#0f172a]" />
                            {data.slice(0, 8).map((loc, idx) => {
                                const key = (loc.label || "").toLowerCase();
                                const pos = mapPositions[key] || { top: 50, left: 50 };
                                const size = 8 + Math.min(12, (loc.value || 0) * 0.4);
                                const hue = 160 + idx * 20;
                                return (
                                    <div
                                        key={`${loc.label}-${idx}`}
                                        className="absolute group transition-transform"
                                        style={{ top: `${pos.top}%`, left: `${pos.left}%`, transform: "translate(-50%, -50%)" }}
                                    >
                                        <div
                                            className="absolute inset-0 rounded-full blur-md opacity-60"
                                            style={{ width: size * 2, height: size * 2, background: `radial-gradient(circle, hsla(${hue},80%,60%,0.4), transparent)` }}
                                        />
                                        <div
                                            className="relative flex items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur"
                                            style={{ width: size, height: size, color: `hsl(${hue},80%,70%)` }}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 px-2 py-1 rounded-lg bg-black/70 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                            {loc.label} · {loc.value || 0}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-white/5 bg-[#0f172a]">
                            <div
                                className="absolute inset-0 bg-no-repeat bg-center bg-contain opacity-30"
                                style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')" }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                                <div className="p-3 rounded-full bg-white/10 mb-3">
                                    <MapPinOff className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-sm font-medium text-white/80 mb-1">No location data yet</p>
                                <p className="text-xs text-white/50 max-w-[200px]">Location insights will appear as your followers add their locations</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};
