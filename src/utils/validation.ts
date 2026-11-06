import { Booking } from '../types';

export interface CollisionResult {
  hasCollision: boolean;
  conflictingBookings: Booking[];
  errorMessage?: string;
}

/**
 * Memecah string nama ruangan gabungan (contoh "Think Room + Big Room")
 * atau array menjadi daftar nama ruangan individual.
 */
export function getRoomNamesList(roomNameOrNames: string | string[]): string[] {
  if (Array.isArray(roomNameOrNames)) return roomNameOrNames;
  if (!roomNameOrNames) return [];
  return roomNameOrNames
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Validasi bentrok (Overlapping Collision Detection)
 * Mendukung peminjaman 1 ruangan maupun 2+ ruangan gabungan dalam 1 lantai.
 * Dua interval waktu [start_a, end_a) dan [start_b, end_b) bertubrukan jika:
 * start_a < end_b AND end_a > start_b
 */
export function checkBookingCollision(
  bookings: Booking[],
  roomNameOrNames: string | string[],
  bookingDate: string,
  startTime: string,
  endTime: string,
  excludeId?: number
): CollisionResult {
  const targetRooms = getRoomNamesList(roomNameOrNames);

  const conflicting = bookings.filter((b) => {
    if (excludeId !== undefined && b.id === excludeId) {
      return false;
    }
    if (b.booking_date !== bookingDate) {
      return false;
    }

    // Periksa apakah ada irisan ruangan antara targetRooms dan ruangan yang sudah dipesan b
    const existingRooms = b.room_names && b.room_names.length > 0 
      ? b.room_names 
      : getRoomNamesList(b.room_name);
      
    const hasCommonRoom = targetRooms.some((r) => existingRooms.includes(r));
    if (!hasCommonRoom) {
      return false;
    }

    // Irisan waktu
    const isOverlap = startTime < b.end_time && endTime > b.start_time;
    return isOverlap;
  });

  if (conflicting.length > 0) {
    const details = conflicting
      .map(
        (c) =>
          `"${c.event_name}" di ${c.room_name} oleh ${c.booker_name} [${c.work_unit || 'Unit Kerja'}] (${c.start_time} - ${c.end_time} WIB)`
      )
      .join(', ');

    const roomLabel = Array.isArray(roomNameOrNames) 
      ? roomNameOrNames.join(' + ') 
      : roomNameOrNames;

    return {
      hasCollision: true,
      conflictingBookings: conflicting,
      errorMessage: `⛔ JADWAL BENTROK: Ruangan "${roomLabel}" (atau bagian dari ruangan yang digabungkan ini) sudah dipesan pada tanggal ${bookingDate} untuk agenda: ${details}. Silakan pilih jam atau ruangan lain.`
    };
  }

  return {
    hasCollision: false,
    conflictingBookings: []
  };
}

export function validateBookingForm(
  roomNameOrNames: string | string[],
  bookingDate: string,
  startTime: string,
  endTime: string,
  bookerName: string,
  workUnit: string,
  eventName: string,
  participantCount: number,
  roomLayout?: string,
  maxCapacity: number = 20,
  allowedLayouts?: string[]
): string[] {
  const errors: string[] = [];

  const roomsList = getRoomNamesList(roomNameOrNames);
  if (roomsList.length === 0) {
    errors.push('Silakan pilih minimal satu ruangan yang ingin dipinjam.');
  }

  if (!bookingDate) {
    errors.push('Tanggal peminjaman wajib diisi.');
  }

  if (!startTime) {
    errors.push('Jam mulai kegiatan wajib ditentukan.');
  }

  if (!endTime) {
    errors.push('Jam selesai kegiatan wajib ditentukan.');
  }

  if (startTime && endTime && startTime >= endTime) {
    errors.push(`Jam selesai (${endTime}) harus lebih lambat dari jam mulai (${startTime}).`);
  }

  if (!bookerName.trim()) {
    errors.push('Nama peminjam wajib diisi.');
  }

  if (!workUnit.trim()) {
    errors.push('Unit kerja / divisi peminjam wajib diisi.');
  }

  if (!eventName.trim()) {
    errors.push('Nama agenda atau topik kegiatan wajib diisi.');
  }

  if (roomLayout) {
    if (allowedLayouts && allowedLayouts.length > 0) {
      if (!allowedLayouts.includes(roomLayout)) {
        errors.push(`Pilihan layout "${roomLayout}" tidak valid. Pilihan yang tersedia: ${allowedLayouts.join(', ')}.`);
      }
    }
  }

  if (participantCount < 1) {
    errors.push('Jumlah peserta minimal 1 orang.');
  }

  const roomDisplay = roomsList.join(' + ');
  if (participantCount > maxCapacity) {
    errors.push(
      `Jumlah peserta (${participantCount} orang) melebihi batas kapasitas maksimal ${roomDisplay || 'ruangan'} (maksimal ${maxCapacity} orang).`
    );
  }

  return errors;
}
