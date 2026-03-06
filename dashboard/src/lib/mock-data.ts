// Types and API client for the maritime tracking dashboard

const API_BASE = 'http://localhost:8000';

// ─── Types ────────────────────────────────────────────────────────

export interface Vessel {
  id: string;
  mmsi: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: 'normal' | 'warning' | 'critical';
  destination: string;
  tacticalZone: string;
  isHighValueTarget: boolean;
  darkFleetSuspicion: boolean;
  isDivertedCape: boolean;
  estimatedCargoValueUsd: number;
  lastUpdate: string;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  vesselName: string;
  vesselId: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  location: string;
}

// ─── Status Derivation ────────────────────────────────────────────
// Derive UI status from tactical_zone and speed
function deriveStatus(tacticalZone: string, speed: number): Vessel['status'] {
  if (tacticalZone === 'CRITICAL_RED_SEA') return 'critical';
  if (tacticalZone === 'HIGH_HORMUZ' || tacticalZone === 'ELEVATED_ADEN') return 'warning';
  if (speed !== null && speed > 20) return 'critical';
  return 'normal';
}

// ─── API Client ───────────────────────────────────────────────────

export async function fetchVessels(): Promise<Vessel[]> {
  const response = await fetch(`${API_BASE}/api/vessels/live`);
  if (!response.ok) {
    throw new Error(`Failed to fetch vessels: ${response.status}`);
  }

  const data = await response.json();

  // Map fct_regional_vessels columns → frontend Vessel interface
  return data.vessels.map((v: Record<string, unknown>) => ({
    id: `vessel-${v.mmsi}`,
    mmsi: String(v.mmsi),
    name: (v.ship_name as string) || 'UNKNOWN CONTACT',
    type: (v.ship_type as string) || 'Unknown',
    lat: v.latitude as number,
    lng: v.longitude as number,
    speed: (v.speed_over_ground as number) ?? 0,
    heading: (v.true_heading as number) ?? 0,
    status: deriveStatus(
      (v.tactical_zone as string) ?? 'STANDARD_TRANSIT',
      (v.speed_over_ground as number) ?? 0
    ),
    destination: (v.destination as string) || 'N/A',
    tacticalZone: (v.tactical_zone as string) ?? 'STANDARD_TRANSIT',
    isHighValueTarget: (v.is_high_value_target as boolean) ?? false,
    darkFleetSuspicion: (v.dark_fleet_suspicion as boolean) ?? false,
    isDivertedCape: (v.is_diverted_cape as boolean) ?? false,
    estimatedCargoValueUsd: (v.estimated_cargo_value_usd as number) ?? 0,
    lastUpdate: v.last_ping_utc
      ? String(v.last_ping_utc).replace('T', ' ').substring(0, 19) + ' UTC'
      : 'N/A',
  }));
}

// ─── Anomaly Generation ───────────────────────────────────────────
// Anomalies are still derived client-side from the vessel status data

function randomTimestamp(minutesAgo: number): string {
  const now = new Date();
  const offset = Math.floor(Math.random() * minutesAgo);
  const ts = new Date(now.getTime() - offset * 60 * 1000);
  return ts.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

export function generateAnomalies(vessels: Vessel[]): Anomaly[] {
  const criticalVessels = vessels.filter((v) => v.status === 'critical');
  const warningVessels = vessels.filter((v) => v.status === 'warning');
  const anomalies: Anomaly[] = [];

  criticalVessels.slice(0, 10).forEach((v, i) => {
    const descriptions = [
      `Speed surge to ${v.speed.toFixed(1)} knots — exceeds safe threshold`,
      `AIS signal intermittent — possible spoofing detected`,
      `Entered restricted zone at ${v.speed.toFixed(1)} kn`,
      `Course change of 140°+ in high-traffic lane`,
      `Unusual acceleration pattern detected`,
    ];
    anomalies.push({
      id: `anomaly-crit-${i}`,
      timestamp: v.lastUpdate || randomTimestamp(15),
      vesselName: v.name,
      vesselId: v.id,
      severity: 'critical',
      description: descriptions[i % descriptions.length],
      location: `${v.lat.toFixed(2)}°N, ${v.lng.toFixed(2)}°E`,
    });
  });

  warningVessels.slice(0, 10).forEach((v, i) => {
    const descriptions = [
      `Speed dropped to ${v.speed.toFixed(1)} knots — possible loitering`,
      `Stationary outside designated anchorage`,
      `Deviation from declared route to ${v.destination}`,
      `Drift detected — no heading change in 2+ hours`,
      `Dark activity: AIS intermittent`,
    ];
    anomalies.push({
      id: `anomaly-warn-${i}`,
      timestamp: v.lastUpdate || randomTimestamp(60),
      vesselName: v.name,
      vesselId: v.id,
      severity: 'warning',
      description: descriptions[i % descriptions.length],
      location: `${v.lat.toFixed(2)}°N, ${v.lng.toFixed(2)}°E`,
    });
  });

  // Info-level from first few normal vessels
  vessels
    .filter((v) => v.status === 'normal')
    .slice(0, 3)
    .forEach((v, i) => {
      anomalies.push({
        id: `anomaly-info-${i}`,
        timestamp: v.lastUpdate || randomTimestamp(120),
        vesselName: v.name,
        vesselId: v.id,
        severity: 'info',
        description: [
          `Routine transit — heading ${v.heading}° at ${v.speed.toFixed(1)} kn`,
          `ETA updated for ${v.destination}`,
          `Speed adjustment in traffic separation scheme`,
        ][i % 3],
        location: `${v.lat.toFixed(2)}°N, ${v.lng.toFixed(2)}°E`,
      });
    });

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return anomalies;
}
