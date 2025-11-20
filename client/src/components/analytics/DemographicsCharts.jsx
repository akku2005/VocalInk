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
import { Users, MapPin } from "lucide-react";

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

export const AgeDistributionChart = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

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
                </CardContent>
            </Card>
        </motion.div>
    );
};

export const LocationChart = ({ data }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
                <CardHeader className="pb-2 shrink-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                        Top Locations
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 min-h-0">
                    <div className="w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }}
                                    interval={0}
                                />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(${150 + index * 20}, 70%, 50%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
