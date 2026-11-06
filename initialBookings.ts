import { Booking } from '../types';

export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function generateInitialBookings(): Booking[] {
  const today = getTodayDateString(0);
  const tomorrow = getTodayDateString(1);
  const dayAfter = getTodayDateString(2);

  return [
    {
      id: 1,
      room_name: 'Think Room',
      floor: 2,
      booking_date: today,
      start_time: '09:00',
      end_time: '11:30',
      booker_name: 'Budi Santoso',
      work_unit: 'Divisi HRD',
      room_layout: 'U-Shape',
      event_name: 'Rapat Perencanaan Kurikulum Onboarding 2026',
      participant_count: 14,
      created_at: '2026-11-01 08:30:00'
    },
    {
      id: 2,
      room_name: 'Big Room',
      floor: 2,
      booking_date: today,
      start_time: '13:00',
      end_time: '16:00',
      booker_name: 'Dewi Lestari',
      work_unit: 'Departemen IT',
      room_layout: 'Classroom',
      event_name: 'Workshop Implementasi Cloud & AI Infrastructure',
      participant_count: 18,
      created_at: '2026-11-01 09:15:00'
    },
    {
      id: 3,
      room_name: 'Competent Room',
      floor: 3,
      booking_date: today,
      start_time: '08:30',
      end_time: '11:00',
      booker_name: 'Ahmad Fauzi',
      work_unit: 'Bagian Asesmen',
      room_layout: 'Classroom',
      event_name: 'Ujian Sertifikasi Keahlian Pegawai Tingkat Lanjut',
      participant_count: 15,
      created_at: '2026-11-01 10:00:00'
    },
    {
      id: 4,
      room_name: 'People Room',
      floor: 3,
      booking_date: today,
      start_time: '14:00',
      end_time: '16:30',
      booker_name: 'Siti Rahmawati',
      work_unit: 'Manajemen Talenta',
      room_layout: 'U-Shape',
      event_name: 'Sesi Coaching & Mentoring Calon Branch Manager',
      participant_count: 12,
      created_at: '2026-11-02 11:20:00'
    },
    {
      id: 5,
      room_name: 'Great Room',
      floor: 3,
      booking_date: tomorrow,
      start_time: '09:30',
      end_time: '12:00',
      booker_name: 'Hendra Wijaya',
      work_unit: 'Sekretariat Direksi',
      room_layout: 'Theater',
      event_name: 'Rapat Koordinasi Evaluasi Program Kerja Q4',
      participant_count: 20,
      created_at: '2026-11-02 13:45:00'
    },
    {
      id: 6,
      room_name: 'Character Room',
      floor: 3,
      booking_date: tomorrow,
      start_time: '13:00',
      end_time: '15:30',
      booker_name: 'Rian Kurniawan',
      work_unit: 'Budaya Perusahaan',
      room_layout: 'U-Shape',
      event_name: 'Internalisasi Core Values & Kode Etik Karyawan',
      participant_count: 16,
      created_at: '2026-11-02 14:10:00'
    },
    {
      id: 7,
      room_name: 'Think Room',
      floor: 2,
      booking_date: dayAfter,
      start_time: '10:00',
      end_time: '12:00',
      booker_name: 'Nadia Putri',
      work_unit: 'Unit Inovasi Digital',
      room_layout: 'Classroom',
      event_name: 'Design Sprint Desain Modul E-Learning',
      participant_count: 10,
      created_at: '2026-11-02 16:00:00'
    }
  ];
}
