// Classification engine
// Automatically assigns department, category, priority, and SLA from complaint text

export interface ClassificationResult {
  department: string;
  category: string;
  priority: string;
  slaHours: number;
}

// Keyword map: keyword → department
const DEPARTMENT_KEYWORDS: Record<string, string> = {
  // WATER
  water: 'WATER', pipe: 'WATER', leak: 'WATER', flood: 'WATER',
  tap: 'WATER', plumbing: 'WATER', drainage: 'WATER', sewage: 'WATER',

  // ELECTRICITY
  electricity: 'ELECTRICITY', power: 'ELECTRICITY', light: 'ELECTRICITY',
  blackout: 'ELECTRICITY', outage: 'ELECTRICITY', electric: 'ELECTRICITY',
  generator: 'ELECTRICITY', transformer: 'ELECTRICITY', wiring: 'ELECTRICITY',

  // ROADS
  road: 'ROADS', pothole: 'ROADS', street: 'ROADS', traffic: 'ROADS',
  pavement: 'ROADS', highway: 'ROADS', bridge: 'ROADS', sidewalk: 'ROADS',
  asphalt: 'ROADS', construction: 'ROADS',

  // HEALTH
  hospital: 'HEALTH', clinic: 'HEALTH', medical: 'HEALTH', health: 'HEALTH',
  doctor: 'HEALTH', nurse: 'HEALTH', medicine: 'HEALTH', ambulance: 'HEALTH',
  disease: 'HEALTH', epidemic: 'HEALTH',

  // SANITATION
  garbage: 'SANITATION', trash: 'SANITATION', waste: 'SANITATION',
  sanitation: 'SANITATION', pollution: 'SANITATION', dirty: 'SANITATION',
  smell: 'SANITATION', rubbish: 'SANITATION', dump: 'SANITATION',

  // EDUCATION
  school: 'EDUCATION', teacher: 'EDUCATION', student: 'EDUCATION',
  classroom: 'EDUCATION', education: 'EDUCATION', university: 'EDUCATION',
  college: 'EDUCATION', library: 'EDUCATION',

  // SECURITY
  crime: 'SECURITY', theft: 'SECURITY', robbery: 'SECURITY', police: 'SECURITY',
  security: 'SECURITY', danger: 'SECURITY', unsafe: 'SECURITY', violence: 'SECURITY',
  attack: 'SECURITY', emergency: 'SECURITY',
};

// Priority keywords that escalate urgency
const HIGH_PRIORITY_KEYWORDS = [
  'urgent', 'emergency', 'critical', 'dangerous', 'immediately',
  'death', 'injury', 'fire', 'flood', 'collapse', 'explosion',
];

const CRITICAL_PRIORITY_KEYWORDS = [
  'life', 'dying', 'dead', 'hospital', 'ambulance', 'catastrophic',
];

// SLA hours per department per priority
const SLA_MATRIX: Record<string, Record<string, number>> = {
  SECURITY:    { CRITICAL: 2,  HIGH: 4,  MEDIUM: 12, LOW: 24 },
  HEALTH:      { CRITICAL: 2,  HIGH: 6,  MEDIUM: 24, LOW: 48 },
  ELECTRICITY: { CRITICAL: 4,  HIGH: 8,  MEDIUM: 24, LOW: 72 },
  WATER:       { CRITICAL: 4,  HIGH: 8,  MEDIUM: 24, LOW: 72 },
  ROADS:       { CRITICAL: 8,  HIGH: 24, MEDIUM: 72, LOW: 168 },
  SANITATION:  { CRITICAL: 8,  HIGH: 24, MEDIUM: 48, LOW: 96 },
  EDUCATION:   { CRITICAL: 24, HIGH: 48, MEDIUM: 96, LOW: 168 },
  OTHER:       { CRITICAL: 8,  HIGH: 24, MEDIUM: 72, LOW: 168 },
};

export function classifyComplaint(
  title: string,
  description: string,
  departmentOverride?: string,
): ClassificationResult {
  const text = `${title} ${description}`.toLowerCase();
  const words = text.split(/\s+/);

  // --- Department detection ---
  let department = departmentOverride || 'OTHER';
  const scores: Record<string, number> = {};

  for (const word of words) {
    const dept = DEPARTMENT_KEYWORDS[word];
    if (dept) {
      scores[dept] = (scores[dept] || 0) + 1;
    }
  }

  if (!departmentOverride && Object.keys(scores).length > 0) {
    department = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }

  // --- Priority detection ---
  let priority = 'MEDIUM';

  for (const keyword of CRITICAL_PRIORITY_KEYWORDS) {
    if (text.includes(keyword)) {
      priority = 'CRITICAL';
      break;
    }
  }

  if (priority !== 'CRITICAL') {
    for (const keyword of HIGH_PRIORITY_KEYWORDS) {
      if (text.includes(keyword)) {
        priority = 'HIGH';
        break;
      }
    }
  }

  // --- Category (more human-readable sub-label) ---
  const categoryMap: Record<string, string> = {
    WATER: 'Water Supply Issue',
    ELECTRICITY: 'Power Supply Issue',
    ROADS: 'Road Infrastructure',
    HEALTH: 'Healthcare Issue',
    SANITATION: 'Waste & Sanitation',
    EDUCATION: 'Education Issue',
    SECURITY: 'Public Safety',
    OTHER: 'General Complaint',
  };

  const category = categoryMap[department] || 'General Complaint';

  // --- SLA hours ---
  const slaHours =
    parseFloat(process.env.SLA_HOURS || '0') ||
    SLA_MATRIX[department]?.[priority] ||
    72;

  return { department, category, priority, slaHours };
}
