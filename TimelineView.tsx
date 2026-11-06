import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Info,
  Calendar,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Booking, Room, ROOMS_MASTER } from '../types';
import { getTodayDateString } from '../data/initialBookings';
import { getRoomNamesList } from '../utils/validation';

interface TimelineViewProps {
  bookings: Booking[];
  rooms?: Room[];
  onNavigateToBookingWithPrefill: (roomName: string, time: string, date?: string) => void;
}

// Helper untuk selalu mendapatkan hari Senin dari tanggal acuan
function getMonday(dateInput: Date | string): Date {
  const d = new Date(dateInput);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  bookings,
  rooms,
  onNavigateToBookingWithPrefill
}) => {
  // Selalu diinisialisasi pada hari Senin dari minggu saat ini
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedFloorTab, setSelectedFloorTab] = useState<'all' | '2' | '3'>('all');
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ room: string; date: string; bookings: Booking[] } | null>(null);

  // Buat 7 hari persis per-minggu (Senin s.d. Minggu)
  const daysList = useMemo(() => {
    const list: { dateStr: string; dayName: string; formattedDate: string; isToday: boolean }[] = [];
    const todayStr = getTodayDateString(0);

    const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long' });
    const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });

    for (let i = 0; i < 7; i++) {
      const current = new Date(currentMonday);
      current.setDate(currentMonday.getDate() + i);
      const dateStr = formatDateToYMD(current);

      list.push({
        dateStr,
        dayName: dayFormatter.format(current),
        formattedDate: dateFormatter.format(current),
        isToday: dateStr === todayStr
      });
    }
    return list;
  }, [currentMonday]);

  // Rentang teks mingguan
  const weekLabel = useMemo(() => {
    if (daysList.length < 7) return '';
    const start = daysList[0];
    const end = daysList[6];
    return `${start.dayName}, ${start.formattedDate} — ${end.dayName}, ${end.formattedDate}`;
  }, [daysList]);

  // Cek apakah minggu yang sedang dilihat adalah minggu ini
  const isCurrentWeek = useMemo(() => {
    const thisMonday = getMonday(new Date());
    return formatDateToYMD(thisMonday) === formatDateToYMD(currentMonday);
  }, [currentMonday]);

  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleResetToThisWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  const handleDateSelect = (val: string) => {
    if (!val) return;
    const selected = new Date(val);
    setCurrentMonday(getMonday(selected));
  };

  const allRooms = rooms || ROOMS_MASTER;
  const roomsToShow = useMemo(() => {
    if (selectedFloorTab === '2') return allRooms.filter((r) => r.floor === 2);
    if (selectedFloorTab === '3') return allRooms.filter((r) => r.floor === 3);
    return allRooms;
  }, [allRooms, selectedFloorTab]);

  const getRoomBookingsForDay = (roomName: string, dateStr: string) => {
    return bookings.filter((b) => {
      if (b.booking_date !== dateStr) return false;
      const roomsList = b.room_names && b.room_names.length > 0
        ? b.room_names
        : getRoomNamesList(b.room_name);
      return roomsList.includes(roomName);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Utama */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Tampilan Mingguan (Senin — Minggu)
            </span>
            {isCurrentWeek ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                Minggu Berjalan
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">
                Arsip / Terjadwal
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Timeline Ketersediaan Mingguan
          </h2>
          <p className="text-sm text-zinc-600 mt-0.5">
            Jadwal ketersediaan ruangan disajikan per minggu penuh (Senin s.d. Minggu). Gunakan tombol untuk berpindah ke minggu selanjutnya.
          </p>
        </div>

        {/* Navigation Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Minggu Sebelumnya */}
          <button
            onClick={handlePrevWeek}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 hover:text-black transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Lihat 1 minggu sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-600" />
            <span className="hidden sm:inline">Minggu Sebelumnya</span>
            <span className="sm:hidden">Sebelumnya</span>
          </button>

          {/* Tombol Reset Minggu Ini */}
          <button
            onClick={handleResetToThisWeek}
            disabled={isCurrentWeek}
            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
              isCurrentWeek
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
            }`}
            title="Kembali ke minggu saat ini"
          >
            Minggu Ini
          </button>

          {/* Tombol Utama: Minggu Selanjutnya */}
          <button
            onClick={handleNextWeek}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg transition-all shadow-sm shadow-red-500/20 active:scale-95 cursor-pointer"
            title="Buka jadwal minggu berikutnya"
          >
            <span>Minggu Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Pilih Tanggal Bebas untuk Melompat ke Minggunya */}
          <div className="flex items-center bg-white border border-zinc-300 rounded-lg px-2 py-1 shadow-2xs">
            <span className="text-[10px] text-zinc-400 font-mono mr-1">Lompat:</span>
            <input
              type="date"
              value={formatDateToYMD(currentMonday)}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="text-xs font-mono font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer"
              title="Pilih tanggal acuan untuk membuka minggunya"
            />
          </div>
        </div>
      </div>

      {/* Week Banner & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
        {/* Left: Active Week Period Details */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Periode 1 Minggu Aktif:</div>
            <div className="text-sm font-bold text-zinc-950 font-mono flex items-center gap-2">
              <span>{weekLabel}</span>
              <span className="text-[11px] font-normal text-zinc-500">
                ({daysList[0]?.dateStr} s.d. {daysList[6]?.dateStr})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-700 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-zinc-50 border border-zinc-400 inline-block shadow-2xs"></span>
            <span>Bebas / Kosong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-orange-500 inline-block shadow-2xs"></span>
            <span>Terisi (1 Agenda)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-red-600 inline-block shadow-2xs"></span>
            <span>Padat (2+ Agenda)</span>
          </div>
        </div>
      </div>

      {/* Floor Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-600">Filter Lantai:</span>
        <div className="inline-flex p-1 bg-zinc-100 rounded-lg">
          <button
            onClick={() => setSelectedFloorTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              selectedFloorTab === 'all'
                ? 'bg-black text-white shadow-2xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Semua Lantai (6 Ruang)
          </button>
          <button
            onClick={() => setSelectedFloorTab('2')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              selectedFloorTab === '2'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            🏢 Lantai 2 (2 Ruang)
          </button>
          <button
            onClick={() => setSelectedFloorTab('3')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              selectedFloorTab === '3'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            🏢 Lantai 3 (4 Ruang)
          </button>
        </div>
      </div>

      {/* Weekly Matrix Table (Senin - Minggu) */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900">
              Jadwal Mingguan:
            </span>
            <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              {daysList[0].dateStr} s.d. {daysList[6].dateStr}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-[11px] font-medium hidden md:inline">
              *Klik kartu ruangan di tanggal terkait untuk detail atau reservasi
            </span>
            <button
              onClick={handleNextWeek}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              Lihat Minggu Selanjutnya <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100/90 border-b border-zinc-200 text-zinc-700">
                <th className="py-3.5 px-4 text-left font-bold w-52 sticky left-0 bg-zinc-100 z-10 border-r border-zinc-200 shadow-2xs">
                  Nama Ruangan
                </th>
                {daysList.map((day) => (
                  <th 
                    key={day.dateStr} 
                    className={`py-3 px-3 text-center min-w-[135px] border-r border-zinc-200 ${
                      day.isToday ? 'bg-orange-100/60 text-orange-950 font-bold' : 'font-semibold'
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-wider text-zinc-600 font-mono font-bold">
                      {day.dayName}
                    </div>
                    <div className="text-xs font-bold text-zinc-950 mt-0.5">
                      {day.formattedDate}
                    </div>
                    {day.isToday ? (
                      <span className="inline-block mt-1 px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-bold rounded">
                        Hari Ini
                      </span>
                    ) : (
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {day.dateStr.slice(5)}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {roomsToShow.map((room) => (
                <tr key={room.id} className="hover:bg-zinc-50/50 transition-colors">
                  {/* Sticky Room Column */}
                  <td className="py-4 px-4 font-bold text-zinc-950 sticky left-0 bg-white z-10 border-r border-zinc-200 shadow-2xs">
                    <div>
                      <div className="text-xs font-bold text-zinc-950">{room.name}</div>
                      <div className="text-[10px] text-zinc-500 font-normal">
                        Lantai {room.floor} · Maks {room.capacity} Orang
                      </div>
                    </div>
                  </td>

                  {/* 7 Daily Cells for this room */}
                  {daysList.map((day) => {
                    const roomDayBookings = getRoomBookingsForDay(room.name, day.dateStr);
                    const bookingCount = roomDayBookings.length;

                    // 1. Ruangan Kosong
                    if (bookingCount === 0) {
                      return (
                        <td key={day.dateStr} className="p-2 border-r border-zinc-100 align-top">
                          <button
                            onClick={() => onNavigateToBookingWithPrefill(room.name, '09:00', day.dateStr)}
                            className="w-full min-h-[74px] p-2 rounded-lg bg-zinc-50/80 hover:bg-orange-50/80 border border-zinc-200 hover:border-orange-300 text-left transition-all group flex flex-col justify-between cursor-pointer"
                            title={`Ruangan ${room.name} kosong pada ${day.dayName}, ${day.formattedDate}. Klik untuk booking.`}
                          >
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-600 group-hover:text-orange-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:bg-orange-500"></span>
                                Kosong
                              </span>
                              <p className="text-[10px] text-zinc-500 group-hover:text-orange-800 mt-0.5">
                                Bebas seharian
                              </p>
                            </div>
                            <span className="text-[10px] text-zinc-500 group-hover:text-orange-700 font-bold inline-flex items-center gap-0.5">
                              <Plus className="w-3 h-3 text-orange-600" /> Booking
                            </span>
                          </button>
                        </td>
                      );
                    }

                    // 2. Ruangan Terisi 1 Agenda
                    if (bookingCount === 1) {
                      const b = roomDayBookings[0];
                      return (
                        <td key={day.dateStr} className="p-2 border-r border-zinc-100 align-top">
                          <div
                            onClick={() => setSelectedDayDetails({ room: room.name, date: day.dateStr, bookings: roomDayBookings })}
                            className="w-full min-h-[74px] p-2 rounded-lg bg-orange-50/90 hover:bg-orange-100 border border-orange-200 text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                            title="Klik untuk melihat rincian agenda atau sisa jam kosong"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-orange-950">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                  1 Agenda
                                </span>
                                <span className="font-mono text-red-600 font-bold">{b.start_time}-{b.end_time}</span>
                              </div>
                              <p className="text-[10px] text-zinc-900 font-semibold truncate mt-1" title={b.event_name}>
                                {b.event_name}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-orange-900/80 truncate mt-1">
                              <span>Oleh: {b.booker_name}</span>
                              <span className="font-mono font-bold text-zinc-700 bg-white/80 px-1 rounded">
                                {b.room_layout || 'Classroom'}
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // 3. Ruangan Terisi 2+ Agenda (Padat)
                    return (
                      <td key={day.dateStr} className="p-2 border-r border-zinc-100 align-top">
                        <div
                          onClick={() => setSelectedDayDetails({ room: room.name, date: day.dateStr, bookings: roomDayBookings })}
                          className="w-full min-h-[74px] p-2 rounded-lg bg-red-50 hover:bg-red-100/90 border border-red-200 text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                          title="Klik untuk melihat detail jam agenda yang sudah terisi"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-red-900">
                              <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                Padat ({bookingCount} Agenda)
                              </span>
                            </div>
                            <div className="space-y-0.5 mt-1">
                              {roomDayBookings.slice(0, 2).map((b) => (
                                <p key={b.id} className="text-[9px] text-zinc-900 truncate font-mono">
                                  • {b.start_time}-{b.end_time}: {b.event_name}
                                </p>
                              ))}
                              {bookingCount > 2 && (
                                <p className="text-[9px] text-red-700 font-bold">
                                  +{bookingCount - 2} agenda lainnya...
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-[9px] text-red-700 font-bold underline mt-1">
                            Rincian Agenda
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Bar Matrix: Tombol Navigasi Cepat ke Minggu Selanjutnya */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-zinc-600">
            Sedang menampilkan jadwal 7 hari: <strong className="text-zinc-900">{weekLabel}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              ◀ Minggu Sebelumnya
            </button>
            <button
              onClick={handleNextWeek}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <span>Minggu Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Rincian Hari */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h4 className="text-base font-bold text-zinc-950">
                  Rincian Jadwal: {selectedDayDetails.room}
                </h4>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Tanggal: <span className="font-mono font-bold text-red-600">{selectedDayDetails.date}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="text-zinc-600 hover:text-black text-xs font-bold py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {selectedDayDetails.bookings.map((b) => (
                <div key={b.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-950 text-sm">{b.event_name}</span>
                    <span className="font-mono text-red-600 font-bold bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {b.start_time} - {b.end_time} WIB
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-zinc-700 pt-1">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Peminjam:</span>
                      <strong className="text-zinc-950">{b.booker_name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Unit Kerja:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-900 border border-orange-200 inline-block">
                        {b.work_unit || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-1 text-[11px] text-zinc-600 font-mono">
                    <span>Peserta: {b.participant_count} Orang</span>
                    <span className="font-bold text-zinc-800 bg-zinc-200/90 px-2 py-0.5 rounded">
                      Layout: {b.room_layout || 'Classroom'}
                    </span>
                  </div>
                  {((b.room_names && b.room_names.length > 1) || b.room_name.includes('+')) && (
                    <div className="text-[10px] text-orange-800 bg-orange-100/70 border border-orange-200 px-2 py-0.5 rounded font-semibold">
                      🔗 Ruangan Gabungan: {b.room_name} (Partisi Dibuka)
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
              <span className="text-[11px] text-zinc-500 font-medium">
                Masih ada jam kosong di hari ini?
              </span>
              <button
                onClick={() => {
                  const room = selectedDayDetails.room;
                  const date = selectedDayDetails.date;
                  setSelectedDayDetails(null);
                  onNavigateToBookingWithPrefill(room, '09:00', date);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-600/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Booking di Tanggal Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Card Petunjuk */}
      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-zinc-900">Petunjuk Navigasi Timeline Mingguan:</p>
          <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
            - Tampilan diformat eksklusif <strong>per minggu (Senin s.d. Minggu)</strong>.<br />
            - Gunakan tombol <strong>&quot;Minggu Selanjutnya ▶&quot;</strong> untuk melihat ketersediaan minggu depan, atau <strong>&quot;◀ Minggu Sebelumnya&quot;</strong> untuk melihat riwayat minggu lalu.<br />
            - Indikator warna: <strong>Putih</strong> (Kosong bebas), <strong>Orange</strong> (Terisi 1 agenda), dan <strong>Merah</strong> (Terisi 2+ agenda/padat).
          </p>
        </div>
      </div>
    </div>
  );
};
