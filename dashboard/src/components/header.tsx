'use client';

import { Radar, Radio, Shield, FileText } from 'lucide-react';

interface HeaderProps {
    onOpenBriefing?: () => void;
}

export default function Header({ onOpenBriefing }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-5 glass-panel rounded-none border-t-0 border-x-0 pointer-events-auto"
            style={{ borderBottom: '1px solid rgba(0, 243, 255, 0.1)' }}
        >
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Shield className="w-5 h-5 text-neon-cyan" strokeWidth={1.5} />
                    <div className="absolute inset-0 w-5 h-5 text-neon-cyan animate-glow-cyan rounded-full" />
                </div>
                <h1 className="text-sm font-bold tracking-[0.3em] text-neon-cyan uppercase">
                    Maritime Overwatch
                </h1>
                <span className="text-[10px] tracking-widest text-text-dim uppercase ml-2 hidden sm:inline">
                    Tactical Awareness System
                </span>
            </div>

            {/* Center: Decorative */}
            <div className="hidden md:flex items-center gap-6 text-[10px] text-text-dim tracking-wider uppercase">
                <div className="flex items-center gap-1.5">
                    <Radar className="w-3.5 h-3.5 text-neon-cyan opacity-50" strokeWidth={1.5} />
                    <span>AIS Monitoring</span>
                </div>
                <div className="w-px h-4 bg-glass-border" />
                <span>Indian Ocean · Red Sea · Persian Gulf</span>
            </div>

            {/* Right: Live Feed Indicator & Briefing Button */}
            <div className="flex items-center gap-4">
                {onOpenBriefing && (
                    <button
                        onClick={onOpenBriefing}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-neon-cyan/30 bg-neon-cyan/5 hover:bg-neon-cyan/20 transition-all text-neon-cyan text-[10px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(0,243,255,0.1)] cursor-pointer"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Intelligence Report
                    </button>
                )}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-live" />
                    <span className="text-[10px] font-semibold tracking-widest text-green-400 uppercase">
                        Live Feed Active
                    </span>
                </div>
                <Radio className="w-4 h-4 text-text-dim" strokeWidth={1.5} />
            </div>
        </header>
    );
}
