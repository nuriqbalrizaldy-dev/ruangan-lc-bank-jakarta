/**
 * Type definitions and Master Data for Learning Center Room Booking System
 */

export interface Room {
  id: string;
  name: string;
  floor: 2 | 3;
  capacity: number;
  description: string;
  facilities: string[];
}

export type RoomLayout = string;

export const DEFAULT_LAYOUTS: string[] = ['Classroom', 'U-Shape', 'Theater'];

export interface LayoutConfig {
  id: string;
  name: string;
  description?: string;
  isCustom?: boolean;
}

export const INITIAL_LAYOUTS_CONFIG: LayoutConfig[] = [
  { id: 'classroom', name: 'Classroom', description: 'Meja dan kursi menghadap panggung/layar (cocok untuk materi teknis & ujian)' },
  { id: 'u-shape', name: 'U-Shape', description: 'Meja melingkar tapal kuda (cocok untuk diskusi terbuka & workshop interaktif)' },
  { id: 'theater', name: 'Theater', description: 'Susunan kursi tanpa meja menghadap panggung (kapasitas audiens maksimal)' }
];

export interface Booking {
  id: number;
  room_name: string;
  room_names?: string[];
  floor: number;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:MM
  end_time: string;     // HH:MM
  booker_name: string;
  work_unit: string;
  room_layout: RoomLayout;
  event_name: string;
  participant_count: number;
  created_at?: string;
}

export const ROOMS_MASTER: Room[] = [
  // Lantai 2
  {
    id: 'think-room',
    name: 'Think Room',
    floor: 2,
    capacity: 20,
    description: 'Ruang diskusi intensif, perumusan ide, dan brainstorming tim inovasi.',
    facilities: ['Smart TV 65"', 'Whiteboard Kaca', 'Video Conference Cam', 'AC Sentral', 'High-Speed Wi-Fi']
  },
  {
    id: 'big-room',
    name: 'Big Room',
    floor: 2,
    capacity: 20,
    description: 'Ruang pelatihan utama dengan tata ruang fleksibel untuk workshop dan presentasi teknis.',
    facilities: ['Proyektor HD Laser', 'Sound System & Mic Wireless', 'Flipchart', 'AC Sentral', 'Power Outlet per Meja']
  },
  // Lantai 3
  {
    id: 'competent-room',
    name: 'Competent Room',
    floor: 3,
    capacity: 20,
    description: 'Ruang sertifikasi kompetensi, pelatihan asesmen, dan uji keterampilan profesional.',
    facilities: ['Proyektor Full HD', 'Podium Pengajar', 'Dual Screen Display', 'AC Sentral', 'Ergonomic Chairs']
  },
  {
    id: 'people-room',
    name: 'People Room',
    floor: 3,
    capacity: 20,
    description: 'Ruang pelatihan interpersonal skill, sesi coaching, dan pelatihan human capital.',
    facilities: ['Smart Board Interaktif', 'Microphone Condenser', 'Sofa & Roundtable Area', 'AC Sentral']
  },
  {
    id: 'great-room',
    name: 'Great Room',
    floor: 3,
    capacity: 20,
    description: 'Ruang seminar eksekutif, rapat koordinasi pimpinan, dan briefing strategis.',
    facilities: ['Video Wall 4K', 'Boundary Microphone System', 'Executive Leather Seats', 'AC Sentral']
  },
  {
    id: 'character-room',
    name: 'Character Room',
    floor: 3,
    capacity: 20,
    description: 'Ruang pembinaan budaya kerja, program orientasi pegawai baru, dan sesi konseling.',
    facilities: ['Projector Screen', 'Circle Discussion Layout', 'Whiteboard Wall', 'AC Sentral']
  }
];

export type NavigationMenu = 'dashboard' | 'booking' | 'timeline' | 'rooms' | 'manage' | 'python_code';
