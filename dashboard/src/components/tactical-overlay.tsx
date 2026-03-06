'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Crosshair,
    Satellite,
    Activity,
    Database,
    Wifi,
    Shell,
    Target,
    EyeOff,
    DollarSign,
    Milestone
} from 'lucide-react';
import type { Vessel } from '@/lib/mock-data';
import { getConflictZoneStats } from '@/lib/conflict-zone';

interface TacticalOverlayProps {
    vessels: Vessel[];
    threatCount: number;
}

export default function TacticalOverlay({ vessels, threatCount }: TacticalOverlayProps) {
    const [time, setTime] = useState('');
    const [missionClock, setMissionClock] = useState('00:00:00');
    const [scanAngle, setScanAngle] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const now = new Date();
            setTime(
                now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
            );

            // Mission clock
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
            const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
            const s = String(elapsed % 60).padStart(2, '0');
            setMissionClock(`${h}:${m}:${s}`);

            // Radar sweep angle
            setScanAngle((prev) => (prev + 3) % 360);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const hraStats = useMemo(() => getConflictZoneStats(vessels), [vessels]);

    // Compute tactical counts for the entire theater
    const { darkFleet, diverted, economicExposure } = useMemo(() => {
        let df = 0, div = 0, expo = 0;
        vessels.forEach(v => {
            if (v.darkFleetSuspicion) df++;
            if (v.isDivertedCape) div++;
            if (v.isHighValueTarget) expo += (v.estimatedCargoValueUsd || 0);
        });
        return { darkFleet: df, diverted: div, economicExposure: expo };
    }, [vessels]);

    return (
        <>
            {/* ─── Animated Scan Line ─── */}
            <div className="scan-line" />

            {/* ─── Corner Brackets (HUD targeting reticle) ─── */}
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />

            {/* ─── Top-Left: Mission Clock & Datetime ─── */}
            <div
                className="fixed left-[356px] top-[60px] z-50 flex flex-col gap-1"
                style={{ pointerEvents: 'none' }}
            >
                <div className="flex items-center gap-2 text-[9px] text-neon-cyan/70 font-mono tracking-widest">
                    <Crosshair className="w-3 h-3" strokeWidth={1.5} />
                    <span>{time}</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-neon-cyan/40 font-mono tracking-widest">
                    <Activity className="w-3 h-3" strokeWidth={1.5} />
                    <span>MISSION CLOCK {missionClock}</span>
                </div>
            </div>

            {/* ─── Bottom-Center: Tactical Stats Bar ─── */}
            <div
                className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-5 px-5 py-2 glass-panel rounded-full"
                style={{ pointerEvents: 'auto' }}
            >
                <StatBadge
                    icon={<Satellite className="w-3 h-3" />}
                    label="SAT LINKS"
                    value="4"
                    color="text-neon-cyan"
                />
                <div className="w-px h-5 bg-glass-border" />
                <StatBadge
                    icon={<Wifi className="w-3 h-3" />}
                    label="AIS FEEDS"
                    value="12"
                    color="text-green-400"
                />
                <div className="w-px h-5 bg-glass-border" />
                <StatBadge
                    icon={<Database className="w-3 h-3" />}
                    label="TRACKED"
                    value={vessels.length.toLocaleString()}
                    color="text-amber-warn"
                />
                <div className="w-px h-5 bg-glass-border" />
                <StatBadge
                    icon={<Target className="w-3 h-3" />}
                    label="HRA ZONES"
                    value={hraStats.totalInZone.toLocaleString()}
                    color="text-crimson-alert"
                />
                <div className="w-px h-5 bg-glass-border" />
                <StatBadge
                    icon={<Shell className="w-3 h-3" />}
                    label="THREATS"
                    value={String(threatCount)}
                    color="text-crimson-alert"
                />
                <div className="w-px h-5 bg-glass-border" />
                <StatBadge
                    icon={<EyeOff className="w-3 h-3" />}
                    label="DARK FLEET"
                    value={darkFleet.toLocaleString()}
                    color="text-fuchsia-400"
                />
                <div className="w-px h-5 bg-glass-border" />
                <StatBadge
                    icon={<Milestone className="w-3 h-3" />}
                    label="DIVERTED (CAPE)"
                    value={diverted.toLocaleString()}
                    color="text-amber-warn"
                />
                <div className="w-px h-5 bg-glass-border" />
                <StatBadge
                    icon={<DollarSign className="w-3 h-3" />}
                    label="ECONOMIC EXPOSURE"
                    value={`$${(economicExposure / 1000000000).toFixed(1)}B`}
                    color="text-neon-cyan"
                />
                <div className="w-px h-5 bg-glass-border" />
                <div className="flex items-center gap-2">
                    <div
                        className="relative w-6 h-6 rounded-full border border-neon-cyan/30"
                        style={{ overflow: 'hidden' }}
                    >
                        {/* Radar Sweep */}
                        <div
                            className="absolute top-1/2 left-1/2 w-3 h-[1px] origin-left"
                            style={{
                                background:
                                    'linear-gradient(90deg, rgba(0,243,255,0.8), transparent)',
                                transform: `translate(0, -50%) rotate(${scanAngle}deg)`,
                                transition: 'transform 1s linear',
                            }}
                        />
                        <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/60" />
                    </div>
                    <span className="text-[9px] text-neon-cyan/60 font-mono tracking-widest">
                        SCANNING
                    </span>
                </div>
            </div>

            {/* ─── Right edge: altitude / zoom indicator ─── */}
            <div
                className="fixed right-[356px] bottom-16 z-50 flex flex-col items-end gap-1"
                style={{ pointerEvents: 'none' }}
            >
                <div className="text-[9px] text-neon-cyan/40 font-mono tracking-widest">
                    ALT 3,200 km
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-neon-cyan/30" />
                    <div className="text-[9px] text-neon-cyan/30 font-mono">Z4.5</div>
                </div>
            </div>

            {/* ─── Vignette Overlay ─── */}
            <div className="vignette-overlay" />

            {/* ─── Coordinate Grid Overlay ─── */}
            <div className="grid-overlay" />
        </>
    );
}

function StatBadge({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className={`${color} opacity-60`}>{icon}</span>
            <div className="flex flex-col">
                <span className="text-[8px] text-text-dim tracking-widest">{label}</span>
                <span className={`text-xs font-bold font-mono ${color}`}>{value}</span>
            </div>
        </div>
    );
}
