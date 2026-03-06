'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/header';
import AlertFeed from '@/components/alert-feed';
import VesselInspector from '@/components/vessel-inspector';
import TacticalOverlay from '@/components/tactical-overlay';
import ConflictInsights from '@/components/conflict-insights';
import IntelligenceModal from '@/components/intelligence-modal';
import { fetchVessels, generateAnomalies } from '@/lib/mock-data';
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
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);

  // Panel visibility state
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Fetch live vessel data from the FastAPI backend
  useEffect(() => {
    let cancelled = false;

    async function loadVessels() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchVessels();
        if (!cancelled) {
          setVessels(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch vessels');
          console.error('Failed to load vessels:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVessels();
    return () => { cancelled = true; };
  }, []);

  // Derive anomalies from the live vessel data
  const anomalies = useMemo(() => generateAnomalies(vessels), [vessels]);

  const handleSelectVessel = (vessel: Vessel | null) => {
    setSelectedVessel(vessel);
    if (vessel) {
      setLeftPanelOpen(true);
      setRightPanelOpen(false); // Hide insights when inspecting
    } else {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  const handleSelectVesselById = (vesselId: string) => {
    const vessel = vessels.find((v) => v.id === vesselId) || null;
    handleSelectVessel(vessel);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[100] bg-background/90 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
          <div className="text-neon-cyan text-xs tracking-[0.3em] uppercase animate-pulse">
            Loading AIS Data from Snowflake...
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-[100] bg-background/90 flex flex-col items-center justify-center gap-4">
          <div className="text-crimson-alert text-sm tracking-widest uppercase">
            Connection Error
          </div>
          <div className="text-text-dim text-xs max-w-md text-center">
            {error}
          </div>
          <div className="text-text-dim text-[10px] mt-2">
            Ensure the FastAPI backend is running on localhost:8000
          </div>
        </div>
      )}

      {/* Full-bleed Map */}
      <MapView
        vessels={vessels}
        selectedVessel={selectedVessel}
        onSelectVessel={handleSelectVessel}
      />

      {/* Overlay UI — pointer-events: none so the map is interactive underneath */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <Header onOpenBriefing={() => setShowBriefing(true)} />
        <AlertFeed
          anomalies={anomalies}
          onSelectVessel={handleSelectVesselById}
          selectedVesselId={selectedVessel?.id}
        />
        <ConflictInsights
          vessels={vessels}
          onSelectVessel={handleSelectVesselById}
          isOpen={rightPanelOpen}
        />
        <VesselInspector
          vessel={selectedVessel}
          onClose={() => handleSelectVessel(null)}
          isOpen={!!selectedVessel}
        />
        <TacticalOverlay vessels={vessels} threatCount={anomalies.filter(a => a.severity === 'critical' || a.severity === 'warning').length} />
      </div>

      {/* Modals */}
      {showBriefing && <IntelligenceModal onClose={() => setShowBriefing(false)} />}

      {/* Noise grain overlay */}
      <div className="noise-overlay" />
    </div>
  );
}
