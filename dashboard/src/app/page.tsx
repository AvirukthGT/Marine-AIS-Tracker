'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/header';
import AlertFeed from '@/components/alert-feed';
import VesselInspector from '@/components/vessel-inspector';
import TacticalOverlay from '@/components/tactical-overlay';
import { generateVessels, generateAnomalies } from '@/lib/mock-data';
import type { Vessel } from '@/lib/mock-data';

// Dynamic import for map (no SSR — MapLibre/Deck.gl need the browser)
const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-background flex items-center justify-center">
      <div className="text-neon-cyan text-xs tracking-widest uppercase animate-pulse">
        Initializing map system...
      </div>
    </div>
  ),
});

export default function Home() {
  // Generate mock data once
  const vessels = useMemo(() => generateVessels(50), []);
  const anomalies = useMemo(() => generateAnomalies(vessels), [vessels]);

  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  const handleSelectVessel = (vessel: Vessel | null) => {
    setSelectedVessel(vessel);
  };

  const handleSelectVesselById = (vesselId: string) => {
    const vessel = vessels.find((v) => v.id === vesselId) || null;
    setSelectedVessel(vessel);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Full-bleed Map */}
      <MapView
        vessels={vessels}
        selectedVessel={selectedVessel}
        onSelectVessel={handleSelectVessel}
      />

      {/* Overlay UI — pointer-events: none so the map is interactive underneath */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <Header />
        <AlertFeed anomalies={anomalies} onSelectVessel={handleSelectVesselById} />
        <VesselInspector vessel={selectedVessel} onClose={() => setSelectedVessel(null)} />
        <TacticalOverlay />
      </div>

      {/* Noise grain overlay */}
      <div className="noise-overlay" />
    </div>
  );
}
