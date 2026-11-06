import { Booking } from '../types';

export function exportBookingsToCSV(bookings: Booking[], filename = 'jadwal_peminjaman_ruangan.csv'): void {
  const headers = ['ID', 'Ruangan', 'Lantai', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Peminjam', 'Unit Kerja', 'Layout Ruangan', 'Nama Kegiatan', 'Jumlah Peserta'];
  
  const rows = bookings.map((b) => [
    b.id,
    `"${b.room_name.replace(/"/g, '""')}"`,
    b.floor,
    b.booking_date,
    b.start_time,
    b.end_time,
    `"${b.booker_name.replace(/"/g, '""')}"`,
    `"${(b.work_unit || '').replace(/"/g, '""')}"`,
    `"${(b.room_layout || 'Classroom').replace(/"/g, '""')}"`,
    `"${b.event_name.replace(/"/g, '""')}"`,
    b.participant_count
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadPythonScript(pythonCode: string, filename = 'app.py'): void {
  const blob = new Blob([pythonCode], { type: 'text/x-python;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
