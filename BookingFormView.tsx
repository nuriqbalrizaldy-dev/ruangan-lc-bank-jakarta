import React, { useState } from 'react';
import { 
  Building2, 
  Clock, 
  Users, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { Booking, NavigationMenu, RoomLayout, Room, LayoutConfig } from '../types';
import { checkBookingCollision, validateBookingForm } from '../utils/validation';
import { getTodayDateString } from '../data/initialBookings';

interface BookingFormViewProps {
  bookings: Booking[];
  rooms: Room[];
  layouts: LayoutConfig[];
  onAddBooking: (booking: Omit<Booking, 'id'>) => number;
  onNavigate: (menu: NavigationMenu) => void;
  prefilledRoom?: string;
  prefilledTime?: string;
  prefilledDate?: string;
}

export const BookingFormView: React.FC<BookingFormViewProps> = ({
  bookings,
  rooms,
  layouts,
  onAddBooking,
  onNavigate,
  prefilledRoom,
  prefilledTime,
  prefilledDate
}) => {
  const initialRoom = prefilledRoom 
    ? rooms.find((r) => r.name === prefilledRoom) || rooms[0]
    : rooms[0];

  const [selectedFloor, setSelectedFloor] = useState<2 | 3>(initialRoom?.floor || 2);
  const [selectedRoomNames, setSelectedRoomNames] = useState<string[]>(() => {
    if (prefilledRoom) {
      return [prefilledRoom];
    }
    const defaultRoom = rooms.find((r) => r.floor === (initialRoom?.floor || 2));
    return defaultRoom ? [defaultRoom.name] : ['Think Room'];
  });
  const [bookingDate, setBookingDate] = useState<string>(prefilledDate || getTodayDateString(0));
  const [startTime, setStartTime] = useState<string>(prefilledTime || '09:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [bookerName, setBookerName] = useState<string>('');
  const [workUnit, setWorkUnit] = useState<string>('');
  const [roomLayout, setRoomLayout] = useState<RoomLayout>(layouts[0]?.name || 'Classroom');
  const [eventName, setEventName] = useState<string>('');
  const [participantCount, setParticipantCount] = useState<number>(10);

  // Validation feedback
  const [errors, setErrors] = useState<string[]>([]);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const floorRooms = rooms.filter((r) => r.floor === selectedFloor);
  const selectedRoomsList = floorRooms.filter((r) => selectedRoomNames.includes(r.name));
  
  // Total Kapasitas Gabungan dari semua ruangan terpilih di lantai yang sama
  const combinedCapacity = selectedRoomsList.reduce((acc, curr) => acc + curr.capacity, 0) || 20;
  const combinedRoomName = selectedRoomNames.join(' + ');

  const handleFloorChange = (floor: 2 | 3) => {
    setSelectedFloor(floor);
    const roomsOnNewFloor = rooms.filter((r) => r.floor === floor);
    if (roomsOnNewFloor.length > 0) {
      setSelectedRoomNames([roomsOnNewFloor[0].name]);
    } else {
      setSelectedRoomNames([]);
    }
  };

  const handleToggleRoom = (roomName: string) => {
    setSelectedRoomNames((prev) => {
      if (prev.includes(roomName)) {
        if (prev.length <= 1) {
          // Jangan biarkan kosong sama sekali
          return prev;
        }
        return prev.filter((name) => name !== roomName);
      } else {
        return [...prev, roomName];
      }
    });
  };

  const handleSelectAllFloorRooms = () => {
    setSelectedRoomNames(floorRooms.map((r) => r.name));
  };

  const handleResetToSingleRoom = (roomName?: string) => {
    setSelectedRoomNames([roomName || floorRooms[0]?.name || 'Think Room']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessBooking(null);

    if (selectedRoomNames.length === 0) {
      setErrors(['Silakan pilih minimal 1 ruangan di lantai yang ditentukan.']);
      return;
    }

    // 1. Validasi input dasar dengan kapasitas dinamis gabungan & layout aktif
    const allowedLayoutNames = layouts.map((l) => l.name);

    const formErrors = validateBookingForm(
      selectedRoomNames,
      bookingDate,
      startTime,
      endTime,
      bookerName,
      workUnit,
      eventName,
      participantCount,
      roomLayout,
      combinedCapacity,
      allowedLayoutNames
    );

    if (formErrors.length > 0) {
      setErrors(formErrors);
      return;
    }

    // 2. Validasi bentrok (Overlapping Collision Detection) pada seluruh ruangan terpilih
    const collisionCheck = checkBookingCollision(
      bookings,
      selectedRoomNames,
      bookingDate,
      startTime,
      endTime
    );

    if (collisionCheck.hasCollision) {
      setErrors([collisionCheck.errorMessage || 'Jadwal salah satu ruangan yang dipilih bentrok.']);
      return;
    }

    // 3. Simpan data peminjaman
    const newId = onAddBooking({
      room_name: combinedRoomName,
      room_names: selectedRoomNames,
      floor: selectedFloor,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      booker_name: bookerName.trim(),
      work_unit: workUnit.trim(),
      room_layout: roomLayout,
      event_name: eventName.trim(),
      participant_count: participantCount,
      created_at: new Date().toISOString()
    });

    const newBookingObject: Booking = {
      id: newId,
      room_name: combinedRoomName,
      room_names: selectedRoomNames,
      floor: selectedFloor,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      booker_name: bookerName.trim(),
      work_unit: workUnit.trim(),
      room_layout: roomLayout,
      event_name: eventName.trim(),
      participant_count: participantCount
    };

    setSuccessBooking(newBookingObject);

    setBookerName('');
    setWorkUnit('');
    setEventName('');
  };

  const handleCopyPass = () => {
    if (!successBooking) return;
    const isMulti = (successBooking.room_names && successBooking.room_names.length > 1) || successBooking.room_name.includes('+');
    const text = `BUKTI PEMINJAMAN RUANGAN - LEARNING CENTER\nNomor ID: #${successBooking.id}\nRuangan: ${successBooking.room_name} (Lantai ${successBooking.floor})${isMulti ? ' [Ruangan Gabungan / Partisi Dibuka]' : ''}\nTanggal: ${successBooking.booking_date}\nJam: ${successBooking.start_time} - ${successBooking.end_time} WIB\nAgenda: ${successBooking.event_name}\nPeminjam: ${successBooking.booker_name}\nUnit Kerja: ${successBooking.work_unit}\nLayout Ruangan: ${successBooking.room_layout}\nJumlah Peserta: ${successBooking.participant_count} Orang (Total Kapasitas: ${combinedCapacity})`;
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider font-mono">
            Reservasi Baru
          </span>
        </div>
        <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
          Formulir Peminjaman Ruangan
        </h2>
        <p className="text-sm text-zinc-600 mt-0.5">
          Reservasi ruangan pelatihan di Gedung Learning Center dengan proteksi bentrok jadwal otomatis.
        </p>
      </div>

      {/* Success Banner / Booking Pass */}
      {successBooking && (
        <div className="bg-orange-50/70 border border-orange-300 rounded-2xl p-6 shadow-xs animate-in fade-in slide-in-from-top-4 duration-200 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  Peminjaman Berhasil Dikonfirmasi! (ID #{successBooking.id})
                </h3>
                <p className="text-xs text-orange-800 font-medium">
                  Jadwal telah tersimpan di database SQLite dan kalender Learning Center.
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyPass}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 border border-orange-300 rounded-lg transition-colors shadow-2xs"
            >
              {copiedPass ? <Check className="w-3.5 h-3.5 text-orange-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-700" />}
              <span>{copiedPass ? 'Tersalin!' : 'Salin Bukti'}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 border border-orange-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs shadow-2xs">
            <div>
              <span className="text-zinc-500 block font-medium">Ruangan & Lokasi:</span>
              <span className="font-bold text-zinc-950 flex items-center gap-1.5 flex-wrap">
                {successBooking.room_name} (Lantai {successBooking.floor})
                {((successBooking.room_names && successBooking.room_names.length > 1) || successBooking.room_name.includes('+')) && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
                    🔗 Partisi Dibuka
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block font-medium">Tanggal & Jam:</span>
              <span className="font-mono font-bold text-red-600">
                {successBooking.booking_date} | {successBooking.start_time} - {successBooking.end_time} WIB
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block font-medium">Jumlah Peserta:</span>
              <span className="font-bold text-zinc-950">
                {successBooking.participant_count} Orang (Kapasitas: {combinedCapacity})
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-zinc-500 block font-medium">Nama Agenda:</span>
              <span className="font-bold text-zinc-950">{successBooking.event_name}</span>
            </div>
            <div>
              <span className="text-zinc-500 block font-medium">Peminjam:</span>
              <span className="font-bold text-zinc-950">{successBooking.booker_name}</span>
            </div>
            <div>
              <span className="text-zinc-500 block font-medium">Unit Kerja:</span>
              <span className="font-semibold text-orange-600">{successBooking.work_unit}</span>
            </div>
            <div>
              <span className="text-zinc-500 block font-medium">Layout Ruangan:</span>
              <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                {successBooking.room_layout}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-lg transition-colors shadow-sm"
            >
              <span>Lihat di Tabel Jadwal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-900">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Peminjaman Tidak Dapat Diproses:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-red-800 font-medium">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Booking Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 space-y-6">
        {/* Section 1: Lokasi & Ruangan */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 uppercase tracking-wider pb-2 border-b border-zinc-100">
            <Building2 className="w-4 h-4 text-red-600" />
            <span>1. Pemilihan Lokasi & Ruangan (Bisa Pilih 2+ Ruangan Sekaligus)</span>
          </div>

          {/* Lantai Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">
              Langkah 1: Pilih Lantai Gedung
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => handleFloorChange(2)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center cursor-pointer ${
                  selectedFloor === 2
                    ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/20'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                🏢 Lantai 2 (Think & Big Room)
              </button>
              <button
                type="button"
                onClick={() => handleFloorChange(3)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center cursor-pointer ${
                  selectedFloor === 3
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/20'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                🏢 Lantai 3 (Competent, People, Great, Character)
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              *Karena kondisi gedung kami, partisi dapat dibuka sehingga Anda bisa memilih 2 atau lebih ruangan di lantai yang sama untuk digabungkan.
            </p>
          </div>

          {/* Interactive Multi-Room Selection Cards on Chosen Floor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-900">
                Langkah 2: Pilih Ruangan di Lantai {selectedFloor} (Klik untuk memilih/menggabungkan):
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllFloorRooms}
                  className="font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                >
                  Pilih Semua ({floorRooms.length} Ruang)
                </button>
                <span className="text-zinc-300">|</span>
                <button
                  type="button"
                  onClick={() => handleResetToSingleRoom()}
                  className="font-semibold text-zinc-600 hover:text-zinc-900 hover:underline cursor-pointer"
                >
                  Pilih 1 Saja
                </button>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${floorRooms.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-3`}>
              {floorRooms.map((r) => {
                const isSelected = selectedRoomNames.includes(r.name);
                return (
                  <div
                    key={r.id}
                    onClick={() => handleToggleRoom(r.name)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      isSelected
                        ? 'border-red-600 bg-red-50/70 shadow-sm ring-1 ring-red-600'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-red-950 font-bold' : 'text-zinc-900'}`}>
                          {r.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRoom(r.name)}
                          className="w-4 h-4 rounded text-red-600 border-zinc-300 focus:ring-red-500 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-600 leading-snug line-clamp-2">
                        {r.description || 'Ruang pelatihan fleksibel dengan fasilitas lengkap.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-zinc-500">Kapasitas:</span>
                      <span className={`font-mono font-bold ${isSelected ? 'text-red-600' : 'text-zinc-800'}`}>
                        {r.capacity} Orang
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Combined Room Status Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            selectedRoomNames.length > 1
              ? 'bg-orange-50/80 border-orange-300 shadow-xs'
              : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedRoomNames.length > 1 ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500 text-white shadow-2xs">
                      🔗 Mode Ruangan Gabungan (Partisi Dibuka)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-200 text-zinc-800">
                      Ruangan Tunggal
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-zinc-500 font-mono">
                    Lantai {selectedFloor}
                  </span>
                </div>
                <h4 className="font-bold text-zinc-950 text-sm mt-1">
                  {combinedRoomName || 'Belum ada ruangan yang dipilih'}
                </h4>
                <p className="text-zinc-600 text-[11px] mt-0.5">
                  {selectedRoomNames.length > 1
                    ? `Partisi antar-ruangan dibuka sehingga ${selectedRoomNames.length} ruangan digabungkan menjadi satu aula luas.`
                    : selectedRoomsList[0]?.description}
                </p>
              </div>

              <div className="bg-white border border-zinc-200 font-bold px-3 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 flex flex-col items-end shadow-2xs">
                <span className="text-[10px] text-zinc-500 font-normal">Total Kapasitas Terbuka:</span>
                <span className="text-sm font-mono font-bold text-red-600 flex items-center gap-1">
                  <Users className="w-4 h-4 text-orange-500" />
                  Maks {combinedCapacity} Orang
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Waktu Pelaksanaan */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 uppercase tracking-wider pb-2 border-b border-zinc-100">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>2. Waktu Pelaksanaan Kegiatan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Tanggal Kegiatan:
              </label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Jam Mulai (WIB):
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white font-mono font-bold text-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Jam Selesai (WIB):
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white font-mono font-bold text-red-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Pemohon & Kegiatan */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-950 uppercase tracking-wider pb-2 border-b border-zinc-100">
            <User className="w-4 h-4 text-black" />
            <span>3. Data Peminjam & Agenda Acara</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Nama Lengkap Peminjam:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Unit Kerja / Divisi:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Divisi HRD / Departemen IT"
                value={workUnit}
                onChange={(e) => setWorkUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white font-medium"
              />
            </div>

            {/* Layout Ruangan Field */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center justify-between">
                <span>Layout Ruangan:</span>
                <button
                  type="button"
                  onClick={() => onNavigate('manage')}
                  className="text-[10px] text-red-600 hover:underline font-bold"
                >
                  + Kelola Layout
                </button>
              </label>
              <select
                value={roomLayout}
                onChange={(e) => setRoomLayout(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white font-semibold text-zinc-900"
              >
                {layouts.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name} {l.description ? `— ${l.description}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center justify-between">
                <span>Jumlah Peserta:</span>
                <span className="text-[10px] font-mono text-zinc-500 font-bold">
                  Maks {combinedCapacity} Orang {selectedRoomNames.length > 1 ? '(Gabungan)' : ''}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={1}
                  max={Math.max(100, combinedCapacity)}
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-xs bg-zinc-50 border rounded-lg focus:outline-none focus:ring-1 font-mono font-bold ${
                    participantCount > combinedCapacity
                      ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500'
                      : 'border-zinc-300 focus:ring-red-600 focus:bg-white text-zinc-900'
                  }`}
                />
              </div>
              {participantCount > combinedCapacity && (
                <p className="text-[11px] text-red-600 mt-1 font-bold">
                  ⚠️ Peringatan: Kapasitas maksimal {selectedRoomNames.length > 1 ? 'gabungan ruangan ini' : combinedRoomName} adalah {combinedCapacity} orang!
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Nama Agenda / Topik Kegiatan:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Workshop Leadership & AI Transformation"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Quick Visual Layout Cards Selection */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-zinc-500 block mb-2">
              Pratinjau & Pilihan Cepat Layout Ruangan:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRoomLayout('Classroom')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  roomLayout === 'Classroom'
                    ? 'border-red-600 bg-red-50/60 ring-1 ring-red-600'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900">🎓 Classroom</span>
                  {roomLayout === 'Classroom' && (
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600">
                  Meja & kursi berbaris menghadap proyektor/instruktur. Cocok untuk pelatihan teknis & sertifikasi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRoomLayout('U-Shape')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  roomLayout === 'U-Shape'
                    ? 'border-orange-600 bg-orange-50/60 ring-1 ring-orange-600'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900">🔄 U-Shape</span>
                  {roomLayout === 'U-Shape' && (
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600">
                  Formasi meja tapal kuda (U). Memfasilitasi interaksi dua arah, diskusi mendalam & coaching.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRoomLayout('Theater')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  roomLayout === 'Theater'
                    ? 'border-zinc-950 bg-zinc-100 ring-1 ring-zinc-950'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900">🎭 Theater (Teater)</span>
                  {roomLayout === 'Theater' && (
                    <span className="w-2 h-2 rounded-full bg-zinc-950"></span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600">
                  Hanya kursi berbaris tanpa meja. Optimal untuk seminar, presentasi umum & kapasitas maksimal.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>Validasi bentrok query SQLite aktif otomatis sebelum menyimpan.</span>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md shadow-red-600/30 active:scale-98"
          >
            Simpan & Konfirmasi Booking
          </button>
        </div>
      </form>
    </div>
  );
};
