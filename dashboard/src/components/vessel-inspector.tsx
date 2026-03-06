'use client';

import {
    Ship,
    Navigation,
    Gauge,
    Compass,
    Anchor,
    Flag,
    Radio,
    X,
    MapPin,
    EyeOff,
    DollarSign,
    Milestone,
    Target,
} from 'lucide-react';
import type { Vessel } from '@/lib/mock-data';

interface VesselInspectorProps {
    vessel: Vessel | null;
    onClose: () => void;
    isOpen: boolean;
}

const statusConfig = {
    normal: { label: 'NOMINAL', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/30', dot: 'bg-neon-cyan' },
    warning: { label: 'ANOMALOUS', color: 'text-amber-warn', bg: 'bg-amber-warn/10', border: 'border-amber-warn/30', dot: 'bg-amber-warn' },
    critical: { label: 'CRITICAL', color: 'text-crimson-alert', bg: 'bg-crimson-alert/10', border: 'border-crimson-alert/30', dot: 'bg-crimson-alert' },
};

function DataRow({ icon: Icon, label, value, accent = false }: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    value: string | number;
    accent?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-glass-border/50 last:border-b-0">
            <div className="flex items-center gap-2 text-text-dim">
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-wider">{label}</span>
            </div>
            <span className={`text-[11px] font-semibold font-mono ${accent ? 'text-neon-cyan' : 'text-foreground'}`}>
                {value}
            </span>
        </div>
    );
}

export default function VesselInspector({ vessel, onClose, isOpen }: VesselInspectorProps) {
    return (
        <div
            className={`fixed right-3 top-[60px] bottom-3 w-[340px] z-[45] glass-panel flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-[120%]'
                }`}
            style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        >
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-neon-cyan" strokeWidth={1.5} />
                    <h2 className="text-[11px] font-bold tracking-[0.2em] text-foreground uppercase">
                        Vessel Inspector
                    </h2>
                </div>
                {vessel && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5 text-text-dim" strokeWidth={1.5} />
                    </button>
                )}
            </div>

            {vessel ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in">
                    {/* Vessel Name & Status */}
                    <div>
                        <h3 className="text-base font-bold text-foreground tracking-wide mb-1">
                            {vessel.name}
                        </h3>
                        <div className="flex items-center gap-2">
                            {(() => {
                                const sc = statusConfig[vessel.status];
                                return (
                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color} ${sc.border} border tracking-widest`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse-live`} />
                                        {sc.label}
                                    </span>
                                );
                            })()}
                            <span className="text-[10px] text-text-dim">
                                {vessel.type}
                            </span>
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="rounded-md border border-glass-border p-3"
                        style={{ background: 'rgba(15,15,15,0.5)' }}
                    >
                        <DataRow icon={Radio} label="MMSI" value={vessel.mmsi} accent />
                        <DataRow icon={Ship} label="Type" value={vessel.type} />
                        <DataRow icon={Flag} label="Zone" value={vessel.tacticalZone} />
                        <DataRow icon={Anchor} label="Destination" value={vessel.destination} />
                        <DataRow icon={Gauge} label="Speed" value={`${vessel.speed.toFixed(1)} kn`} />
                        <DataRow icon={Compass} label="Heading" value={`${vessel.heading}°`} />
                        <DataRow icon={Navigation} label="Course" value={`${vessel.heading}° T`} />
                        <DataRow icon={MapPin} label="Position" value={`${vessel.lat.toFixed(4)}°N, ${vessel.lng.toFixed(4)}°E`} />
                    </div>

                    {/* Geopolitical Intelligence */}
                    <div className="rounded-md border border-glass-border p-3 space-y-2"
                        style={{ background: 'rgba(50,10,10,0.3)' }}
                    >
                        <div className="text-[9px] uppercase tracking-widest text-crimson-alert mb-2 flex items-center gap-1.5 border-b border-crimson-alert/20 pb-2">
                            <Target className="w-3 h-3" />
                            Tactical Intelligence
                        </div>
                        <DataRow icon={Ship} label="HVT" value={vessel.isHighValueTarget ? 'YES' : 'NO'} accent={vessel.isHighValueTarget} />
                        <DataRow
                            icon={EyeOff}
                            label="Dark Fleet Suspicion"
                            value={vessel.darkFleetSuspicion ? 'CRITICAL' : 'CLEAR'}
                            accent={vessel.darkFleetSuspicion}
                        />
                        <DataRow
                            icon={Milestone}
                            label="Cape Diversion"
                            value={vessel.isDivertedCape ? 'DETECTED' : 'CLEAR'}
                            accent={vessel.isDivertedCape}
                        />
                        <DataRow
                            icon={DollarSign}
                            label="Est. Cargo Value"
                            value={vessel.estimatedCargoValueUsd > 0 ? `$${(vessel.estimatedCargoValueUsd / 1000000).toFixed(0)}M USD` : 'N/A'}
                            accent={vessel.estimatedCargoValueUsd > 0}
                        />
                    </div>

                    {/* Coordinates Display */}
                    <div className="rounded-md border border-glass-border p-3"
                        style={{ background: 'rgba(15,15,15,0.5)' }}
                    >
                        <div className="text-[9px] uppercase tracking-widest text-text-dim mb-2">
                            Last Known Position
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-[9px] text-text-dim mb-0.5">LAT</div>
                                <div className="text-sm font-mono font-bold text-neon-cyan">
                                    {vessel.lat.toFixed(6)}°
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] text-text-dim mb-0.5">LNG</div>
                                <div className="text-sm font-mono font-bold text-neon-cyan">
                                    {vessel.lng.toFixed(6)}°
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Last Update */}
                    <div className="text-[9px] text-text-dim flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-live" />
                        Last update: {vessel.lastUpdate}
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full border border-glass-border flex items-center justify-center mb-4 opacity-30">
                        <Ship className="w-8 h-8 text-neon-cyan" strokeWidth={1} />
                    </div>
                    <p className="text-[11px] text-text-dim tracking-wide leading-relaxed">
                        Select a vessel on the map<br />to inspect its details
                    </p>
                </div>
            )}

            {/* Panel Footer */}
            <div className="px-4 py-2 border-t border-glass-border shrink-0">
                <div className="flex items-center justify-between text-[9px] text-text-dim">
                    <span>Source: AIS Network</span>
                    <span>Classification: UNCLASSIFIED</span>
                </div>
            </div>
        </div>
    );
}
