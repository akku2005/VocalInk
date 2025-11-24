import React from 'react';
import { Save, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function SaveStatusIndicator({ status, lastSaved, errorMessage }) {
    const getStatusConfig = () => {
        switch (status) {
            case 'saving':
                return {
                    icon: Loader2,
                    text: 'Saving...',
                    className: 'text-blue-500',
                    iconClassName: 'animate-spin'
                };
            case 'saved':
                return {
                    icon: Check,
                    text: lastSaved ? `Saved ${formatTime(lastSaved)}` : 'Saved',
                    className: 'text-green-500',
                    iconClassName: ''
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    text: errorMessage || 'Failed to save',
                    className: 'text-red-500',
                    iconClassName: ''
                };
            default: // idle
                return {
                    icon: Save,
                    text: lastSaved ? `Last saved ${formatTime(lastSaved)}` : 'Not saved',
                    className: 'text-text-tertiary',
                    iconClassName: ''
                };
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const saved = new Date(date);
        const diffMs = now - saved;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return saved.toLocaleDateString();
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-2 text-sm ${config.className}`}>
            <Icon className={`w-4 h-4 ${config.iconClassName}`} />
            <span>{config.text}</span>
        </div>
    );
}
