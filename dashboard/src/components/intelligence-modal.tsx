'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Activity,
    DollarSign,
    Target,
    Anchor,
    EyeOff,
    Milestone,
    Ship
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface IntelligenceModalProps {
    onClose: () => void;
}

const API_BASE = 'http://localhost:8000';

export default function IntelligenceModal({ onClose }: IntelligenceModalProps) {
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [exposureData, setExposureData] = useState<any[]>([]);
    const [darkFleet, setDarkFleet] = useState<any[]>([]);
    const [divertedVessels, setDivertedVessels] = useState<any[]>([]);
    const [totalVessels, setTotalVessels] = useState(0);

    useEffect(() => {
        let mounted = true;

        async function fetchIntelligence() {
            try {
                const [summaryRes, exposureRes, darkFleetRes, divertedRes] = await Promise.all([
                    fetch(`${API_BASE}/api/intelligence/summary`),
                    fetch(`${API_BASE}/api/intelligence/economic-exposure`),
                    fetch(`${API_BASE}/api/intelligence/dark-fleet`),
                    fetch(`${API_BASE}/api/intelligence/diverted-vessels`)
                ]);

                if (!mounted) return;

                const summary = await summaryRes.json();
                const exposure = await exposureRes.json();
                const dark = await darkFleetRes.json();
                const diverted = await divertedRes.json();

                setTotalVessels(summary.total_vessels);
                setSummaryData(summary.zones.map((z: any) => ({
                    name: z.tactical_zone.replace(/_/g, ' '),
                    value: z.vessel_count
                })));

                setExposureData(exposure.exposure.map((e: any) => ({
                    name: e.tactical_zone.replace(/_/g, ' '),
                    value: e.total_value_usd || 0
                })));

                setDarkFleet(dark.vessels);
                setDivertedVessels(diverted.vessels);
            } catch (error) {
                console.error("Failed to fetch intelligence data:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchIntelligence();
        return () => { mounted = false; };
    }, []);

    const totalExposureUsd = exposureData.reduce((sum, item) => sum + item.value, 0);

    const PIE_COLORS = ['#00f3ff', '#ffbf00', '#ff003c', '#4ade80'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-6">
            <div className="relative w-full max-w-7xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-neon-cyan" />
                        <h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
                            Executive Intelligence Briefing
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
                        <div className="text-neon-cyan text-xs tracking-[0.3em] uppercase animate-pulse">
                            Compiling Intelligence Feed...
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Top Row: KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <KpiCard
                                icon={<DollarSign className="w-5 h-5 text-neon-cyan" />}
                                title="Value at Risk (HVT)"
                                value={`$${(totalExposureUsd / 1000000000).toFixed(2)}B`}
                                color="text-neon-cyan"
                            />
                            <KpiCard
                                icon={<EyeOff className="w-5 h-5 text-fuchsia-400" />}
                                title="Dark Fleet Suspects"
                                value={darkFleet.length}
                                color="text-fuchsia-400"
                            />
                            <KpiCard
                                icon={<Milestone className="w-5 h-5 text-amber-warn" />}
                                title="Cape Diverted"
                                value={divertedVessels.length}
                                color="text-amber-warn"
                            />
                            <KpiCard
                                icon={<Target className="w-5 h-5 text-slate-300" />}
                                title="Total Theater Traffic"
                                value={totalVessels.toLocaleString()}
                                color="text-foreground"
                            />
                        </div>

                        {/* Middle Row: Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[300px]">
                            {/* Bar Chart: Economic Exposure */}
                            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 flex flex-col">
                                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <Anchor className="w-4 h-4" /> Economic Exposure by Zone
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={exposureData} margin={{ top: 10, right: 10, left: 30, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#94a3b8"
                                                fontSize={10}
                                                tickMargin={10}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                fontSize={10}
                                                tickFormatter={(val) => `$${(val / 1000000000).toFixed(1)}B`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                                formatter={(val: any) => [`$${(Number(val) / 1000000000).toFixed(2)} Billion`, 'Exposure']}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {exposureData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.name.includes('CRITICAL') ? '#ff003c' : '#00f3ff'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Donut Chart: Vessels by Zone */}
                            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 flex flex-col">
                                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                                    <Ship className="w-4 h-4" /> Traffic Distribution
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={summaryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {summaryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Threat Ledger Table */}
                        <div className="bg-slate-800/30 border border-slate-700 rounded-lg flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                                <h3 className="text-xs font-bold tracking-widest text-crimson-alert uppercase flex items-center gap-2">
                                    <EyeOff className="w-4 h-4" /> Dark Fleet Suspects Ledger
                                </h3>
                                <span className="text-xs text-slate-400 font-mono">{darkFleet.length} Records</span>
                            </div>
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-700 z-10 text-[10px] uppercase tracking-widest text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">MMSI</th>
                                            <th className="px-4 py-3 font-medium">Ship Name</th>
                                            <th className="px-4 py-3 font-medium">Flag State</th>
                                            <th className="px-4 py-3 font-medium">Type</th>
                                            <th className="px-4 py-3 font-medium">Speed</th>
                                            <th className="px-4 py-3 font-medium text-right">Last Ping UTC</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50 font-mono text-xs">
                                        {darkFleet.map((v) => (
                                            <tr key={v.mmsi} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-2.5 text-neon-cyan">{v.mmsi}</td>
                                                <td className="px-4 py-2.5 text-slate-200">{v.ship_name || 'UNKNOWN'}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{v.flag_state}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{v.ship_type || 'N/A'}</td>
                                                <td className="px-4 py-2.5 text-amber-warn">{v.speed_over_ground?.toFixed(1) || '0.0'} kn</td>
                                                <td className="px-4 py-2.5 text-crimson-alert text-right">{v.last_ping_utc?.replace('T', ' ').substring(0, 19)}</td>
                                            </tr>
                                        ))}
                                        {darkFleet.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic font-sans">
                                                    No dark fleet vessels detected matching criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

function KpiCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string | number, color: string }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 flex items-center gap-4">
            <div className="p-3 bg-black/40 rounded-lg shrink-0 border border-slate-700">
                {icon}
            </div>
            <div>
                <h4 className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">{title}</h4>
                <div className={`text-2xl font-mono font-bold tracking-wider ${color}`}>
                    {value}
                </div>
            </div>
        </div>
    );
}
