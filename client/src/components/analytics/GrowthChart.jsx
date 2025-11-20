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
            <div className="bg-white dark:bg-gray-800 p-3 border border-border rounded-lg shadow-xl backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                <p className="text-sm font-medium text-text-primary mb-1">{label}</p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

const GrowthChart = ({ data, title, color = "#6366f1" }) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
                <CardHeader className="pb-2 shrink-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 min-h-0">
                    <div className="w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                                    tickFormatter={(value) =>
                                        value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                                    }
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={color}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default GrowthChart;
