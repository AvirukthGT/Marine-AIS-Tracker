// Mock AIS data generator for the maritime tracking dashboard

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
  flag: string;
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

const VESSEL_NAMES = [
  'STAR PHOENIX', 'OCEAN MERIDIAN', 'GULF VOYAGER', 'PERSIAN DAWN',
  'RED SEA TITAN', 'ARABIAN SPIRIT', 'HORMUZ RUNNER', 'SUEZ GUARDIAN',
  'ADEN EXPLORER', 'MUSCAT TRADER', 'DUBAI CARRIER', 'QATAR PRIDE',
  'BAHRAIN WAVE', 'KUWAIT PEARL', 'OMAN SUNRISE', 'JEDDAH HAWK',
  'DJIBOUTI STAR', 'SOCOTRA WIND', 'MASIRAH POINT', 'FUJAIRAH EDGE',
  'AL KHOR', 'YANBU FORTUNE', 'RAS TANURA', 'BANDAR ABBAS',
  'CHABAHAR MOON', 'SALALAH BREEZE', 'MOKHA LEGACY', 'MASSAWA CREST',
  'ERITREA SUN', 'AQABA SENTINEL', 'EILAT SWIFT', 'PORT SUDAN',
  'MUKALLA DREAM', 'AL HUDAYDAH', 'JUBAIL CROWN', 'DAMMAM FORCE',
  'BASRA EXPRESS', 'BUSHEHR TIDE', 'KARACHI LION', 'MUMBAI VENTURE',
  'GOA MARINER', 'COCHIN GRACE', 'COLOMBO RANGER', 'MALDIVES ECHO',
  'SEYCHELLES RAY', 'MOGADISHU HOPE', 'MOMBASA KING', 'DAR SALAAM',
  'ZANZIBAR MIST', 'MADAGASCAR GALE',
];

const VESSEL_TYPES = [
  'Crude Oil Tanker', 'Container Ship', 'Bulk Carrier', 'LNG Carrier',
  'Chemical Tanker', 'General Cargo', 'VLCC', 'Product Tanker',
  'Car Carrier', 'Naval Vessel',
];

const DESTINATIONS = [
  'Jebel Ali, UAE', 'Ras Tanura, KSA', 'Fujairah, UAE', 'Muscat, Oman',
  'Jeddah, KSA', 'Aden, Yemen', 'Djibouti', 'Mumbai, India',
  'Karachi, Pakistan', 'Bandar Abbas, Iran', 'Kuwait City', 'Basra, Iraq',
  'Port Sudan', 'Salalah, Oman', 'Yanbu, KSA', 'Suez Canal',
];

const FLAGS = ['PA', 'LR', 'MH', 'SG', 'HK', 'MT', 'BS', 'CY', 'IM', 'GB'];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateMMSI(): string {
  return (
    Math.floor(Math.random() * 9 + 1).toString() +
    Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0')
  );
}

function randomTimestamp(minutesAgo: number): string {
  const now = new Date();
  const offset = Math.floor(Math.random() * minutesAgo);
  const ts = new Date(now.getTime() - offset * 60 * 1000);
  return ts.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

export function generateVessels(count: number = 50): Vessel[] {
  const vessels: Vessel[] = [];

  // Regions: Arabian Sea, Red Sea, Gulf of Aden, Persian Gulf, Indian Ocean
  const regions = [
    { latMin: 23, latMax: 27, lngMin: 50, lngMax: 56.5 },  // Persian Gulf
    { latMin: 12, latMax: 15, lngMin: 43, lngMax: 46 },     // Gulf of Aden / Bab-el-Mandeb
    { latMin: 15, latMax: 22, lngMin: 38, lngMax: 42 },     // Red Sea
    { latMin: 24, latMax: 28, lngMin: 34, lngMax: 38 },     // Northern Red Sea / Suez approach
    { latMin: 10, latMax: 20, lngMin: 56, lngMax: 68 },     // Arabian Sea
    { latMin: 18, latMax: 24, lngMin: 60, lngMax: 70 },     // NW Indian Ocean
  ];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const statusRoll = Math.random();
    let status: Vessel['status'] = 'normal';
    if (statusRoll > 0.85) status = 'critical';
    else if (statusRoll > 0.7) status = 'warning';

    vessels.push({
      id: `vessel-${i}`,
      mmsi: generateMMSI(),
      name: VESSEL_NAMES[i % VESSEL_NAMES.length],
      type: VESSEL_TYPES[Math.floor(Math.random() * VESSEL_TYPES.length)],
      lat: randomInRange(region.latMin, region.latMax),
      lng: randomInRange(region.lngMin, region.lngMax),
      speed: status === 'warning' ? randomInRange(0, 2) : randomInRange(8, 22),
      heading: Math.floor(randomInRange(0, 360)),
      status,
      destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
      flag: FLAGS[Math.floor(Math.random() * FLAGS.length)],
      lastUpdate: randomTimestamp(30),
    });
  }

  return vessels;
}

export function generateAnomalies(vessels: Vessel[]): Anomaly[] {
  const criticalVessels = vessels.filter((v) => v.status === 'critical');
  const warningVessels = vessels.filter((v) => v.status === 'warning');

  const anomalies: Anomaly[] = [];

  criticalVessels.forEach((v, i) => {
    const descriptions = [
      `U-turn detected in conflict zone — course reversed 178°`,
      `AIS signal lost for 47 minutes, re-appeared 12nm from last position`,
      `Entered restricted military zone near Strait of Hormuz`,
      `Transponder ID mismatch — broadcasting conflicting MMSI`,
      `Speed surge to ${Math.floor(randomInRange(24, 32))} knots in congested lane`,
    ];
    anomalies.push({
      id: `anomaly-crit-${i}`,
      timestamp: randomTimestamp(15),
      vesselName: v.name,
      vesselId: v.id,
      severity: 'critical',
      description: descriptions[i % descriptions.length],
      location: `${v.lat.toFixed(2)}°N, ${v.lng.toFixed(2)}°E`,
    });
  });

  warningVessels.forEach((v, i) => {
    const descriptions = [
      `Speed dropped to ${v.speed.toFixed(1)} knots — possible loitering`,
      `Anchored outside designated zone for 3+ hours`,
      `Deviation from declared route to ${v.destination}`,
      `Draft change detected — possible unreported cargo transfer`,
      `Dark activity: AIS intermittent over last 2 hours`,
    ];
    anomalies.push({
      id: `anomaly-warn-${i}`,
      timestamp: randomTimestamp(60),
      vesselName: v.name,
      vesselId: v.id,
      severity: 'warning',
      description: descriptions[i % descriptions.length],
      location: `${v.lat.toFixed(2)}°N, ${v.lng.toFixed(2)}°E`,
    });
  });

  // Add a few info-level anomalies
  for (let i = 0; i < 3; i++) {
    const v = vessels[Math.floor(Math.random() * vessels.length)];
    anomalies.push({
      id: `anomaly-info-${i}`,
      timestamp: randomTimestamp(120),
      vesselName: v.name,
      vesselId: v.id,
      severity: 'info',
      description: [
        `Entered Suez Canal northbound queue`,
        `Port arrival ETA updated — now ${Math.floor(randomInRange(2, 18))}h`,
        `Routine speed adjustment in traffic separation scheme`,
      ][i % 3],
      location: `${v.lat.toFixed(2)}°N, ${v.lng.toFixed(2)}°E`,
    });
  }

  // Sort by severity then timestamp
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return anomalies;
}

export function generateTrajectory(vessel: Vessel): [number, number][] {
  const points: [number, number][] = [];
  const numPoints = 40;
  let lat = vessel.lat;
  let lng = vessel.lng;

  // Build a trail going backwards from the current position
  const headingRad = ((vessel.heading + 180) * Math.PI) / 180;
  for (let i = 0; i < numPoints; i++) {
    points.unshift([lng, lat]);
    // Step backwards along roughly the reverse heading with some jitter
    const step = 0.04 + Math.random() * 0.02;
    lat += Math.cos(headingRad) * step + (Math.random() - 0.5) * 0.015;
    lng += Math.sin(headingRad) * step + (Math.random() - 0.5) * 0.015;
  }

  return points;
}
