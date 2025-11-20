import React from "react";
import { Card, CardContent } from "../ui/Card";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";



const StatCard = ({ label, value, icon: Icon, trend, trendValue, color = "primary", delay = 0 }) => {
    const isPositive = trend === "up";
    const isNegative = trend === "down";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="h-full min-h-[160px]"
        >
            <Card className="h-full !overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl flex flex-col">
                <div className={`absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300 text-${color}-500 pointer-events-none`}>
                    <Icon className="w-32 h-32 transform rotate-12" />
                </div>

                <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between flex-1">
                    <div className="flex justify-between items-start mb-4 gap-2">
                        <div className={`p-3.5 rounded-2xl bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 ring-1 ring-${color}-500/20 shrink-0`}>
                            <Icon className="w-7 h-7" />
                        </div>
                        {trendValue && (
                            <div className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${isPositive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-500/20" :
                                isNegative ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 ring-1 ring-rose-500/20" :
                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                }`}>
                                {isPositive ? <ArrowUpRight className="w-4 h-4" /> :
                                    isNegative ? <ArrowDownRight className="w-4 h-4" /> :
                                        <Minus className="w-4 h-4" />}
                                {trendValue}
                            </div>
                        )}
                    </div>

                    <div className="mt-auto">
                        <p className="text-base font-medium text-text-secondary mb-1 truncate">{label}</p>
                        <h3 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight truncate" title={value}>{value}</h3>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default StatCard;
