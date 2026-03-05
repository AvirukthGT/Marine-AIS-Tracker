'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { Globe, Map as MapIcon } from 'lucide-react';
import type { Vessel } from '@/lib/mock-data';
import { generateTrajectory } from '@/lib/mock-data';

interface MapViewProps {
    vessels: Vessel[];
    selectedVessel: Vessel | null;
    onSelectVessel: (vessel: Vessel | null) => void;
}

const STATUS_COLORS: Record<string, [number, number, number, number]> = {
    normal: [0, 243, 255, 220],
    warning: [255, 191, 0, 230],
    critical: [255, 0, 60, 240],
};

const VIEW_GLOBE = {
    latitude: 20,
    longitude: 52,
    zoom: 2.8,
    pitch: 0,
    bearing: 0,
};

const VIEW_2D = {
    latitude: 22.5,
    longitude: 55,
    zoom: 5,
    pitch: 45,
    bearing: -10,
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function MapView({ vessels, selectedVessel, onSelectVessel }: MapViewProps) {
    const mapRef = useRef<MapRef>(null);
    const [trajectory, setTrajectory] = useState<[number, number][] | null>(null);
    const [isGlobe, setIsGlobe] = useState(true);
    const [viewState, setViewState] = useState(VIEW_GLOBE);

    // Generate trajectory when a vessel is selected
    useEffect(() => {
        if (selectedVessel) {
            setTrajectory(generateTrajectory(selectedVessel));
        } else {
            setTrajectory(null);
        }
    }, [selectedVessel]);

    // Toggle projection on the MapLibre instance
    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        if (isGlobe) {
            map.setProjection({ type: 'globe' });
        } else {
            map.setProjection({ type: 'mercator' });
        }
    }, [isGlobe]);

    const handleToggle = useCallback(() => {
        setIsGlobe((prev) => {
            const next = !prev;
            setViewState(next ? VIEW_GLOBE : VIEW_2D);
            return next;
        });
    }, []);

    const onClick = useCallback(
        (info: { object?: Vessel }) => {
            if (info.object) {
                onSelectVessel(info.object);
            }
        },
        [onSelectVessel]
    );

    const layers = [
        trajectory && selectedVessel
            ? new PathLayer({
                id: 'trajectory-path',
                data: [{ path: trajectory }],
                getPath: (d: { path: [number, number][] }) => d.path,
                getColor: [0, 243, 255, 100],
                getWidth: 2,
                widthMinPixels: 2,
                widthMaxPixels: 4,
                capRounded: true,
                jointRounded: true,
            })
            : null,

        new ScatterplotLayer<Vessel>({
            id: 'vessel-glow',
            data: vessels,
            getPosition: (d) => [d.lng, d.lat],
            getFillColor: (d) => {
                const c = STATUS_COLORS[d.status] || STATUS_COLORS.normal;
                return [c[0], c[1], c[2], 60];
            },
            getRadius: (d) => (d.id === selectedVessel?.id ? 35000 : 20000),
            radiusMinPixels: 8,
            radiusMaxPixels: 40,
            pickable: false,
        }),

        new ScatterplotLayer<Vessel>({
            id: 'vessels',
            data: vessels,
            getPosition: (d) => [d.lng, d.lat],
            getFillColor: (d) => STATUS_COLORS[d.status] || STATUS_COLORS.normal,
            getRadius: (d) => (d.id === selectedVessel?.id ? 12000 : 8000),
            radiusMinPixels: 4,
            radiusMaxPixels: 14,
            pickable: true,
            onClick,
            autoHighlight: true,
            highlightColor: [0, 243, 255, 100],
            updateTriggers: {
                getRadius: [selectedVessel?.id],
                getFillColor: [selectedVessel?.id],
            },
        }),

        selectedVessel
            ? new ScatterplotLayer<Vessel>({
                id: 'selection-ring',
                data: [selectedVessel],
                getPosition: (d) => [d.lng, d.lat],
                getFillColor: [0, 0, 0, 0],
                getLineColor: [0, 243, 255, 180],
                getRadius: 18000,
                radiusMinPixels: 10,
                radiusMaxPixels: 25,
                lineWidthMinPixels: 2,
                stroked: true,
                filled: false,
                pickable: false,
            })
            : null,
    ].filter(Boolean);

    return (
        <div className="absolute inset-0">
            <DeckGL
                viewState={viewState}
                onViewStateChange={({ viewState: vs }) => setViewState(vs as typeof viewState)}
                controller={true}
                layers={layers}
                getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
                style={{ position: 'absolute', inset: '0' }}
            >
                <Map
                    ref={mapRef}
                    mapStyle={MAP_STYLE}
                    attributionControl={false}
                    projection={isGlobe ? { type: 'globe' } as maplibregl.ProjectionSpecification : { type: 'mercator' } as maplibregl.ProjectionSpecification}
                    style={{ width: '100%', height: '100%' }}
                />
            </DeckGL>

            {/* Globe/2D Toggle Switch */}
            <div
                className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
                style={{ pointerEvents: 'auto' }}
            >
                <button
                    onClick={handleToggle}
                    className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full border border-glass-border hover:border-neon-cyan/40 transition-all duration-300 cursor-pointer group"
                >
                    {/* Toggle track */}
                    <div className="relative w-10 h-5 rounded-full bg-white/5 border border-glass-border transition-colors duration-300">
                        <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-lg ${isGlobe
                                    ? 'left-0.5 bg-neon-cyan shadow-neon-cyan/30'
                                    : 'left-[calc(100%-18px)] bg-amber-warn shadow-amber-warn/30'
                                }`}
                        />
                    </div>

                    {/* Label */}
                    <div className="flex items-center gap-1.5">
                        {isGlobe ? (
                            <>
                                <Globe className="w-3.5 h-3.5 text-neon-cyan" strokeWidth={1.5} />
                                <span className="text-[10px] font-bold tracking-widest text-neon-cyan uppercase">
                                    3D Globe
                                </span>
                            </>
                        ) : (
                            <>
                                <MapIcon className="w-3.5 h-3.5 text-amber-warn" strokeWidth={1.5} />
                                <span className="text-[10px] font-bold tracking-widest text-amber-warn uppercase">
                                    2D Tactical
                                </span>
                            </>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
}
