import type { Vessel } from './mock-data';

// Rough polygon encompassing the Red Sea, Gulf of Aden, and parts of the Arabian Sea
// representing the High-Risk Area (HRA) for shipping during the conflict.
export const CONFLICT_ZONE_POLYGON: [number, number][] = [
    [32.0, 30.0],  // Suez
    [35.0, 28.0],  // Northern Red Sea
    [43.0, 12.5],  // Bab al-Mandab Strait
    [45.0, 11.5],  // Gulf of Aden West
    [58.0, 14.5],  // Arabian Sea / Socotra region
    [59.0, 22.5],  // Gulf of Oman East
    [55.0, 26.5],  // Strait of Hormuz
    [48.0, 29.5],  // Persian Gulf North
    [39.0, 21.0],  // Red Sea Middle (Saudi Coast)
];

// Simple ray-casting algorithm to check if a point is inside a polygon
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [lng, lat] = point;
    let isInside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }

    return isInside;
}

export function isVesselInConflictZone(vessel: Vessel): boolean {
    if (vessel.lat == null || vessel.lng == null) return false;
    return isPointInPolygon([vessel.lng, vessel.lat], CONFLICT_ZONE_POLYGON);
}

export function getConflictZoneStats(vessels: Vessel[]) {
    const inZone = vessels.filter(isVesselInConflictZone);

    const byType = inZone.reduce((acc, v) => {
        const t = v.type || 'Unknown';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const avgSpeed = inZone.length > 0
        ? inZone.reduce((sum, v) => sum + (v.speed || 0), 0) / inZone.length
        : 0;

    const criticalCount = inZone.filter(v => v.status === 'critical' || v.status === 'warning').length;

    return {
        totalInZone: inZone.length,
        byType,
        avgSpeed,
        criticalCount
    };
}
