'use client';

import { AlertTriangle, AlertCircle, Info, MapPin, Clock } from 'lucide-react';
import type { Anomaly } from '@/lib/mock-data';

interface AlertFeedProps {
    anomalies: Anomaly[];
    onSelectVessel: (vesselId: string) => void;
    selectedVesselId?: string | null;
}

const severityConfig = {
    critical: {
        icon: AlertCircle,
        badgeClass: 'badge-critical',
        label: 'CRITICAL',
        accentColor: 'text-crimson-alert',
        glowColor: 'rgba(255, 0, 60, 0.08)',
    },
    warning: {
        icon: AlertTriangle,
        badgeClass: 'badge-warning',
        label: 'WARNING',
        accentColor: 'text-amber-warn',
        glowColor: 'rgba(255, 191, 0, 0.05)',
    },
    info: {
        icon: Info,
        badgeClass: 'badge-info',
        label: 'INFO',
        accentColor: 'text-neon-cyan',
        glowColor: 'transparent',
    },
};

export default function AlertFeed({ anomalies, onSelectVessel, selectedVesselId }: AlertFeedProps) {
    return (
        <div
            className="fixed left-3 top-[60px] bottom-3 w-[340px] z-40 glass-panel flex flex-col"
            style={{ pointerEvents: 'auto' }}
        >
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-warn" strokeWidth={1.5} />
                    <h2 className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                        Threat Feed
                    </h2>
                </div>
                <span className="text-[10px] text-text-dim font-mono">
                    {anomalies.length} ALERTS
                </span>
            </div>

            {/* Scrollable feed */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {anomalies.map((anomaly, index) => {
                    const config = severityConfig[anomaly.severity];
                    const Icon = config.icon;
                    const isSelected = selectedVesselId === anomaly.vesselId;

                    return (
                        <button
                            key={anomaly.id}
                            onClick={() => onSelectVessel(anomaly.vesselId)}
                            className={`w-full text-left p-3 rounded-md border transition-all duration-200 cursor-pointer group animate-fade-in ${isSelected
                                ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,243,255,0.15)] ring-1 ring-neon-cyan/50'
                                : 'border-glass-border hover:border-glass-border-hover'
                                }`}
                            style={{
                                background: isSelected ? undefined : config.glowColor,
                                animationDelay: `${index * 50}ms`,
                            }}
                        >
                            {/* Top row: severity + vessel name */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-neon-cyan drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : config.accentColor}`} strokeWidth={2} />
                                    <span className={`text-[11px] font-semibold tracking-wide transition-colors ${isSelected ? 'text-neon-cyan drop-shadow-[0_0_2px_rgba(0,243,255,0.8)]' : 'text-foreground group-hover:text-neon-cyan'
                                        }`}>
                                        {anomaly.vesselName}
                                    </span>
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${config.badgeClass} tracking-wider`}>
                                    {config.label}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-[10px] text-text-secondary leading-relaxed mb-2">
                                {anomaly.description}
                            </p>

                            {/* Meta row */}
                            <div className="flex items-center gap-3 text-[9px] text-text-dim">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                                    <span className="font-mono">{anomaly.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" strokeWidth={1.5} />
                                    <span className="font-mono">{anomaly.location}</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Panel Footer */}
            <div className="px-4 py-2 border-t border-glass-border shrink-0">
                <div className="flex items-center justify-between text-[9px] text-text-dim">
                    <span>Auto-refresh: 30s</span>
                    <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-live" />
                        STREAMING
                    </span>
                </div>
            </div>
        </div>
    );
}
