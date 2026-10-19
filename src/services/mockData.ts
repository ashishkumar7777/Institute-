export type SubjectType = 'Mathematics' | 'Physics' | 'Chemistry';

export interface Institute {
  id: string;
  name: string;
  primaryColor: string;
  logo: string;
}

export interface User {
  id: string;
  name: string;
  role: 'owner' | 'teacher' | 'student';
  phone: string;
  subject?: SubjectType; // For teachers
  enrolledSubjects?: SubjectType[]; // For students: only these subjects appear on their dashboard & library
  assignedTeacherId?: string;
  feeStatus?: 'PAID' | 'UNPAID';
  attendanceRate?: number;
}

export interface Chapter {
  id: string;
  subject: SubjectType;
  chapterNumber: number;
  title: string;
  totalPages: number;
  pdfUrl: string;
  isUnlocked: boolean; // Unlocked by teacher to allow student access
}

export const currentInstitute: Institute = {
  id: 'inst_apex_01',
  name: 'Apex Academy',
  primaryColor: '#2563eb', // blue-600
  logo: 'https://placehold.co/180x60?text=Apex+Academy',
};

export const mockUsers: User[] = [
  // 1 Owner
  {
    id: 'owner_1',
    name: 'Dr. Suresh Verma',
    role: 'owner',
    phone: '9876543210',
  },
  // 3 Teachers
  {
    id: 'tech_math',
    name: 'Rajesh Sharma',
    role: 'teacher',
    subject: 'Mathematics',
    phone: '9811122233',
  },
  {
    id: 'tech_phy',
    name: 'Anjali Gupta',
    role: 'teacher',
    subject: 'Physics',
    phone: '9822233344',
  },
  {
    id: 'tech_chem',
    name: 'Vikram Mehta',
    role: 'teacher',
    subject: 'Chemistry',
    phone: '9833344455',
  },
  // 10 Students with specific enrolled subjects
  {
    id: 'std_01',
    name: 'Aarav Patel',
    role: 'student',
    phone: '9900011101',
    assignedTeacherId: 'tech_math',
    enrolledSubjects: ['Mathematics'], // Only Math
    feeStatus: 'PAID',
    attendanceRate: 92,
  },
  {
    id: 'std_02',
    name: 'Sneha Rao',
    role: 'student',
    phone: '9900011102',
    assignedTeacherId: 'tech_math',
    enrolledSubjects: ['Mathematics', 'Physics'], // Math + Physics
    feeStatus: 'UNPAID',
    attendanceRate: 85,
  },
  {
    id: 'std_03',
    name: 'Rohan Deshmukh',
    role: 'student',
    phone: '9900011103',
    assignedTeacherId: 'tech_math',
    enrolledSubjects: ['Mathematics'], // Only Math
    feeStatus: 'PAID',
    attendanceRate: 78,
  },
  {
    id: 'std_04',
    name: 'Pooja Iyer',
    role: 'student',
    phone: '9900011104',
    assignedTeacherId: 'tech_phy',
    enrolledSubjects: ['Physics'], // Only Physics
    feeStatus: 'PAID',
    attendanceRate: 96,
  },
  {
    id: 'std_05',
    name: 'Karan Malhotra',
    role: 'student',
    phone: '9900011105',
    assignedTeacherId: 'tech_phy',
    enrolledSubjects: ['Physics', 'Chemistry'], // Physics + Chemistry
    feeStatus: 'UNPAID',
    attendanceRate: 64,
  },
  {
    id: 'std_06',
    name: 'Ananya Roy',
    role: 'student',
    phone: '9900011106',
    assignedTeacherId: 'tech_phy',
    enrolledSubjects: ['Physics'], // Only Physics
    feeStatus: 'PAID',
    attendanceRate: 88,
  },
  {
    id: 'std_07',
    name: 'Aditya Singh',
    role: 'student',
    phone: '9900011107',
    assignedTeacherId: 'tech_chem',
    enrolledSubjects: ['Chemistry'], // Only Chemistry
    feeStatus: 'PAID',
    attendanceRate: 94,
  },
  {
    id: 'std_08',
    name: 'Meera Nair',
    role: 'student',
    phone: '9900011108',
    assignedTeacherId: 'tech_chem',
    enrolledSubjects: ['Mathematics', 'Chemistry'], // Math + Chemistry
    feeStatus: 'UNPAID',
    attendanceRate: 70,
  },
  {
    id: 'std_09',
    name: 'Varun Joshi',
    role: 'student',
    phone: '9900011109',
    assignedTeacherId: 'tech_chem',
    enrolledSubjects: ['Chemistry'], // Only Chemistry
    feeStatus: 'PAID',
    attendanceRate: 82,
  },
  {
    id: 'std_10',
    name: 'Ishita Kapoor',
    role: 'student',
    phone: '9900011110',
    assignedTeacherId: 'tech_math',
    enrolledSubjects: ['Mathematics', 'Physics', 'Chemistry'], // All 3 Subjects
    feeStatus: 'PAID',
    attendanceRate: 90,
  },
];

const mathChapters = [
  'Sets & Relations', 'Functions', 'Complex Numbers', 'Quadratic Equations',
  'Matrices', 'Determinants', 'Permutations & Combinations', 'Binomial Theorem',
  'Sequences & Series', 'Limits & Continuity', 'Differentiability', 'Applications of Derivatives',
  'Indefinite Integrals', 'Definite Integrals', 'Differential Equations', 'Straight Lines',
  'Conic Sections', '3D Geometry', 'Vectors', 'Probability',
];

const physicsChapters = [
  'Units & Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion',
  'Work, Energy & Power', 'Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids',
  'Fluid Mechanics', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory',
  'Oscillations', 'Waves', 'Electrostatics', 'Current Electricity',
  'Magnetic Effects of Current', 'Electromagnetic Induction', 'Ray Optics', 'Wave Optics',
];

const chemChapters = [
  'Basic Concepts of Chemistry', 'Structure of Atom', 'Periodic Classification', 'Chemical Bonding',
  'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions',
  'Hydrogen', 's-Block Elements', 'p-Block Elements', 'Organic Chemistry Basics',
  'Hydrocarbons', 'Solid State', 'Solutions', 'Electrochemistry',
  'Chemical Kinetics', 'Surface Chemistry', 'Coordination Compounds', 'Biomolecules',
];

export const mockChapters: Chapter[] = [
  ...mathChapters.map((title, i) => ({
    id: `m_${i + 1}`,
    subject: 'Mathematics' as const,
    chapterNumber: i + 1,
    title,
    totalPages: 45 + ((i * 3) % 15),
    pdfUrl: 'https://pdfobject.com/pdf/sample.pdf',
    isUnlocked: i < 3, // First 3 chapters unlocked by default
  })),
  ...physicsChapters.map((title, i) => ({
    id: `p_${i + 1}`,
    subject: 'Physics' as const,
    chapterNumber: i + 1,
    title,
    totalPages: 40 + ((i * 4) % 15),
    pdfUrl: 'https://pdfobject.com/pdf/sample.pdf',
    isUnlocked: i < 3, // First 3 chapters unlocked by default
  })),
  ...chemChapters.map((title, i) => ({
    id: `c_${i + 1}`,
    subject: 'Chemistry' as const,
    chapterNumber: i + 1,
    title,
    totalPages: 48 + ((i * 2) % 12),
    pdfUrl: 'https://pdfobject.com/pdf/sample.pdf',
    isUnlocked: i < 3, // First 3 chapters unlocked by default
  })),
];