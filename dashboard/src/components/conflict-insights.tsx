'use client';

import { useMemo } from 'react';
import { Target, ShieldAlert, Navigation, Ship } from 'lucide-react';
import type { Vessel } from '@/lib/mock-data';
import { getConflictZoneStats } from '@/lib/conflict-zone';

interface ConflictInsightsProps {
    vessels: Vessel[];
    onSelectVessel?: (vesselId: string) => void;
    isOpen: boolean;
}

export default function ConflictInsights({ vessels, onSelectVessel, isOpen }: ConflictInsightsProps) {
    const stats = useMemo(() => getConflictZoneStats(vessels), [vessels]);

    // Sort vessel types by count descending
    const topTypes = Object.entries(stats.byType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return (
        <div
            className={`fixed right-3 top-[60px] w-[320px] z-40 glass-panel flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-[120%]'
                }`}
            style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between shrink-0 bg-crimson-alert/5">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-crimson-alert" strokeWidth={1.5} />
                    <h2 className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                        HRA INSIGHTS
                    </h2>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded badge-critical tracking-wider">
                    RED SEA / ME
                </span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5">
                {/* Total Traffic */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] text-text-dim tracking-widest uppercase mb-1">
                            Vessels in Zone
                        </div>
                        <div className="text-3xl font-mono font-bold text-amber-warn flex items-baseline gap-2">
                            {stats.totalInZone.toLocaleString()}
                            <span className="text-[10px] text-text-dim font-sans font-normal tracking-wide">
                                ACTIVE
                            </span>
                        </div>
                    </div>
                </div>

                {/* Threat Level */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel p-3 border border-glass-border rounded-lg bg-black/20">
                        <div className="flex items-center gap-1.5 text-[9px] text-text-dim tracking-widest uppercase mb-2">
                            <ShieldAlert className="w-3 h-3 text-crimson-alert" />
                            Elevated Risk
                        </div>
                        <div className="text-lg font-mono font-bold text-crimson-alert tracking-wider">
                            {stats.criticalCount}
                        </div>
                    </div>
                    <div className="glass-panel p-3 border border-glass-border rounded-lg bg-black/20">
                        <div className="flex items-center gap-1.5 text-[9px] text-text-dim tracking-widest uppercase mb-2">
                            <Navigation className="w-3 h-3 text-neon-cyan" />
                            Avg Speed
                        </div>
                        <div className="text-lg font-mono font-bold text-neon-cyan tracking-wider">
                            {stats.avgSpeed.toFixed(1)} <span className="text-[10px] text-text-dim">kn</span>
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                <div>
                    <div className="flex items-center gap-2 text-[10px] text-text-dim tracking-widest uppercase mb-3 border-b border-glass-border/50 pb-2">
                        <Ship className="w-3 h-3" />
                        Fleet Composition
                    </div>
                    <div className="space-y-2.5">
                        {topTypes.length > 0 ? topTypes.map(([type, count]) => {
                            const percentage = (count / stats.totalInZone) * 100;
                            return (
                                <div key={type} className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-text-secondary truncate pr-2" title={type}>{type}</span>
                                        <span className="font-mono text-foreground font-semibold">{count}</span>
                                    </div>
                                    <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-warn/60 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-xs text-text-dim italic text-center py-2">
                                No vessels detected in HRA.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-glass-border shrink-0 bg-black/20">
                <div className="flex items-center justify-between text-[9px] text-text-dim">
                    <span>Zone: Red Sea / Gulf of Aden</span>
                    <span className="font-mono text-amber-warn/50">LIVE</span>
                </div>
            </div>
        </div>
    );
}
