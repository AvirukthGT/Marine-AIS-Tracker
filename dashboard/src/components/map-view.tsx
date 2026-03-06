'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, PathLayer, PolygonLayer } from '@deck.gl/layers';
import { Globe, Map as MapIcon } from 'lucide-react';
import type { Vessel } from '@/lib/mock-data';
import { CONFLICT_ZONE_POLYGON } from '@/lib/conflict-zone';

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

const GLOW_COLORS: Record<string, [number, number, number, number]> = {
    normal: [0, 243, 255, 50],
    warning: [255, 191, 0, 50],
    critical: [255, 0, 60, 60],
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
    const [trajectory] = useState<[number, number][] | null>(null);
    const [isGlobe, setIsGlobe] = useState(true);
    const [viewState, setViewState] = useState(VIEW_GLOBE);


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

    const layers = useMemo(() => {
        const result: any[] = [
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

            new PolygonLayer({
                id: 'conflict-zone-hra',
                data: [{ polygon: CONFLICT_ZONE_POLYGON }],
                getPolygon: (d) => d.polygon,
                getFillColor: [255, 0, 60, 25],
                getLineColor: [255, 0, 60, 150],
                getLineWidth: 2,
                lineWidthMinPixels: 2,
                stroked: true,
                filled: true,
                pickable: false,
            }),
        ];

        // Glow layer — larger, transparent points for ambient glow
        result.push(
            new ScatterplotLayer<Vessel>({
                id: 'vessel-glow',
                data: vessels,
                getPosition: (d) => [d.lng, d.lat],
                getFillColor: (d) => {
                    const c = STATUS_COLORS[d.status] || STATUS_COLORS.normal;
                    return [c[0], c[1], c[2], 40];
                },
                radiusUnits: 'pixels',
                getRadius: (d) => (d.id === selectedVessel?.id ? 12 : 7),
                pickable: false,
                updateTriggers: {
                    getRadius: [selectedVessel?.id],
                },
            }),

            // Main vessel dots
            new ScatterplotLayer<Vessel>({
                id: 'vessels',
                data: vessels,
                getPosition: (d) => [d.lng, d.lat],
                getFillColor: (d) => STATUS_COLORS[d.status] || STATUS_COLORS.normal,
                radiusUnits: 'pixels',
                getRadius: (d) => (d.id === selectedVessel?.id ? 6 : 4),
                pickable: true,
                onClick,
                autoHighlight: true,
                highlightColor: [0, 243, 255, 100],
                updateTriggers: {
                    getRadius: [selectedVessel?.id],
                },
            }),

            // Selection ring around selected vessel
            selectedVessel
                ? new ScatterplotLayer<Vessel>({
                    id: 'selection-ring',
                    data: [selectedVessel],
                    getPosition: (d) => [d.lng, d.lat],
                    getFillColor: [0, 0, 0, 0],
                    getLineColor: [0, 243, 255, 180],
                    radiusUnits: 'pixels',
                    getRadius: 10,
                    lineWidthMinPixels: 2,
                    stroked: true,
                    filled: false,
                    pickable: false,
                })
                : null,
        );

        return result.filter(Boolean);
    }, [vessels, selectedVessel, trajectory, onClick]);

    return (
        <div className="absolute inset-0">
            <DeckGL
                viewState={viewState}
                onViewStateChange={(evt) => setViewState(evt.viewState as any)}
                controller={true}
                layers={layers}
                getCursor={() => 'grab'}
                style={{ width: '100%', height: '100%' }}
            >
                <Map
                    ref={mapRef}
                    mapStyle={MAP_STYLE}
                    attributionControl={false}
                    projection={isGlobe ? { type: 'globe' } as maplibregl.ProjectionSpecification : { type: 'mercator' } as maplibregl.ProjectionSpecification}
                    reuseMaps
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
                    <div className="relative w-10 h-5 rounded-full bg-white/5 border border-glass-border transition-colors duration-300">
                        <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-lg ${isGlobe
                                ? 'left-0.5 bg-neon-cyan shadow-neon-cyan/30'
                                : 'left-[calc(100%-18px)] bg-amber-warn shadow-amber-warn/30'
                                }`}
                        />
                    </div>
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
