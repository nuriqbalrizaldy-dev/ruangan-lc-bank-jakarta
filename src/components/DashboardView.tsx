import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Copy,
  Check,
  X
} from 'lucide-react';
import { Booking, NavigationMenu, Room, LayoutConfig } from '../types';
import { exportBookingsToCSV } from '../utils/csvExport';
import { getTodayDateString } from '../data/initialBookings';
import { getRoomNamesList } from '../utils/validation';

interface DashboardViewProps {
  bookings: Booking[];
  rooms: Room[];
  layouts: LayoutConfig[];
  onDeleteBooking: (id: number) => void;
  onNavigate: (menu: NavigationMenu) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  rooms,
  layouts,
  onDeleteBooking,
  onNavigate
}) => {
  const [filterDateEnabled, setFilterDateEnabled] = useState(false);
  const [filterDate, setFilterDate] = useState(getTodayDateString(0));
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterLayout, setFilterLayout] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Filtered rooms options
  const availableRoomsForFilter = useMemo(() => {
    if (filterFloor === '2') {
      return rooms.filter((r) => r.floor === 2);
    }
    if (filterFloor === '3') {
      return rooms.filter((r) => r.floor === 3);
    }
    return rooms;
  }, [rooms, filterFloor]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filterDateEnabled && b.booking_date !== filterDate) {
        return false;
      }
      if (filterFloor !== 'all' && b.floor !== Number(filterFloor)) {
        return false;
      }
      if (filterRoom !== 'all') {
        const roomsList = b.room_names && b.room_names.length > 0 
          ? b.room_names 
          : getRoomNamesList(b.room_name);
        if (!roomsList.includes(filterRoom)) {
          return false;
        }
      }
      if (filterLayout !== 'all' && (b.room_layout || 'Classroom') !== filterLayout) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesBooker = b.booker_name.toLowerCase().includes(query);
        const matchesWorkUnit = (b.work_unit || '').toLowerCase().includes(query);
        const matchesLayout = (b.room_layout || '').toLowerCase().includes(query);
        const matchesEvent = b.event_name.toLowerCase().includes(query);
        const matchesRoom = b.room_name.toLowerCase().includes(query);
        if (!matchesBooker && !matchesWorkUnit && !matchesLayout && !matchesEvent && !matchesRoom) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, filterDateEnabled, filterDate, filterFloor, filterRoom, filterLayout, searchQuery]);

  const todayStr = getTodayDateString(0);
  const todayBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.booking_date === todayStr).length;
  }, [bookings, todayStr]);

  const handleExportCSV = () => {
    exportBookingsToCSV(filteredBookings, `jadwal_ruangan_learning_center_${todayStr}.csv`);
  };

  const handleCopyPass = (b: Booking) => {
    const text = `BUKTI PEMINJAMAN RUANGAN - LEARNING CENTER\nNomor ID: #${b.id}\nRuangan: ${b.room_name} (Lantai ${b.floor})\nTanggal: ${b.booking_date}\nJam: ${b.start_time} - ${b.end_time} WIB\nAgenda: ${b.event_name}\nPeminjam: ${b.booker_name}\nUnit Kerja: ${b.work_unit}\nLayout Ruangan: ${b.room_layout || 'Classroom'}\nJumlah Peserta: ${b.participant_count} Orang`;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider font-mono">
              Learning Center Dashboard
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Jadwal Peminjaman Ruangan
          </h2>
          <p className="text-sm text-zinc-600 mt-0.5">
            Pantau status penggunaan ruangan di Lantai 2 dan Lantai 3 Gedung Learning Center secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-zinc-700" />
            <span>Unduh CSV</span>
          </button>
          <button
            onClick={() => onNavigate('booking')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Booking Ruangan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Total Agenda Terdaftar</span>
            <Calendar className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 font-mono tabular-nums mt-2">
            {bookings.length} <span className="text-xs font-normal text-zinc-500">Kegiatan</span>
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Agenda Hari Ini</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 font-mono tabular-nums mt-2">
            {todayBookingsCount} <span className="text-xs font-normal text-zinc-500">Kegiatan</span>
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-black"></div>
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Total Ruangan</span>
            <Building2 className="w-4 h-4 text-black" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 font-mono tabular-nums mt-2">
            6 <span className="text-xs font-normal text-zinc-500">Ruang (Lt 2 & 3)</span>
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Batas Kapasitas</span>
            <Users className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 font-mono tabular-nums mt-2">
            Maks 20 <span className="text-xs font-normal text-zinc-500">Orang / Ruang</span>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
            <Filter className="w-4 h-4 text-red-600" />
            <span>Filter & Pencarian Jadwal</span>
          </div>
          {(filterDateEnabled || filterFloor !== 'all' || filterRoom !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFilterDateEnabled(false);
                setFilterFloor('all');
                setFilterRoom('all');
                setSearchQuery('');
              }}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
              Cari Peminjam / Agenda:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Ketik nama atau topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-zinc-700">
                Filter Tanggal:
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterDateEnabled}
                  onChange={(e) => setFilterDateEnabled(e.target.checked)}
                  className="rounded border-zinc-300 text-red-600 focus:ring-red-500 w-3 h-3"
                />
                <span>Aktifkan</span>
              </label>
            </div>
            <input
              type="date"
              disabled={!filterDateEnabled}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 disabled:opacity-50 disabled:bg-zinc-100 font-mono"
            />
          </div>

          {/* Floor Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
              Lantai:
            </label>
            <select
              value={filterFloor}
              onChange={(e) => {
                setFilterFloor(e.target.value);
                setFilterRoom('all');
              }}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Semua Lantai (Lantai 2 & 3)</option>
              <option value="2">Lantai 2 (Think, Big)</option>
              <option value="3">Lantai 3 (Competent, People, Great, Character)</option>
            </select>
          </div>

          {/* Room Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
              Ruangan:
            </label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Semua Ruangan</option>
              {availableRoomsForFilter.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} (Lt {r.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Layout Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
              Layout Ruangan:
            </label>
            <select
              value={filterLayout}
              onChange={(e) => setFilterLayout(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Semua Layout ({layouts.length} jenis)</option>
              {layouts.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
            <span>Daftar Jadwal ({filteredBookings.length} data ditemukan)</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Database SQLite: learning_center_rooms.db
          </span>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 mx-auto flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">
              Tidak ada jadwal yang cocok
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Tidak ditemukan data peminjaman dengan kriteria filter saat ini.
            </p>
            <button
              onClick={() => onNavigate('booking')}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jadwal Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100/80 text-zinc-700 border-b border-zinc-200 font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4">Ruangan</th>
                  <th className="py-3 px-3 text-center">Lantai</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Unit Kerja</th>
                  <th className="py-3 px-3 text-center">Layout</th>
                  <th className="py-3 px-4">Agenda Kegiatan</th>
                  <th className="py-3 px-3 text-center">Peserta</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-center text-zinc-500 font-bold">
                      #{b.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-zinc-950">
                          {b.room_name}
                        </span>
                        {((b.room_names && b.room_names.length > 1) || b.room_name.includes('+')) && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
                            🔗 Partisi Dibuka
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-100 text-zinc-800 font-mono">
                        Lt {b.floor}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-zinc-700 whitespace-nowrap">
                      {b.booking_date}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-red-600 whitespace-nowrap font-bold">
                      {b.start_time} - {b.end_time}
                    </td>
                    <td className="py-3 px-4 text-zinc-950 font-bold whitespace-nowrap">
                      {b.booker_name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-800 border border-orange-200 font-medium">
                        {b.work_unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        (b.room_layout || 'Classroom') === 'Classroom'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : (b.room_layout || 'Classroom') === 'U-Shape'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-zinc-100 text-zinc-900 border-zinc-300'
                      }`}>
                        {b.room_layout || 'Classroom'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-900 max-w-xs">
                      <span className="line-clamp-2" title={b.event_name}>
                        {b.event_name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-zinc-800">
                      {b.participant_count} Orang
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedBookingForDetail(b)}
                          title="Lihat Bukti Booking"
                          className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setBookingToDelete(b)}
                          title="Batalkan / Hapus"
                          className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Section via Dropdown Selector */}
      <div className="p-5 bg-white rounded-xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-zinc-950">
            Fitur Batal / Hapus Jadwal Kegiatan
          </h3>
        </div>
        <p className="text-xs text-zinc-600 mb-3">
          Jika suatu kegiatan pelatihan dibatalkan, silakan pilih nomor ID booking di bawah ini untuk menghapusnya dari sistem.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            id="quick-delete-select"
            className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 max-w-xl font-medium"
            defaultValue=""
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const found = bookings.find((b) => b.id === Number(val));
                if (found) setBookingToDelete(found);
              }
            }}
          >
            <option value="" disabled>-- Pilih Jadwal yang Ingin Dibatalkan --</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                ID #{b.id} - {b.room_name} ({b.booking_date} {b.start_time}-{b.end_time}) | {b.event_name} oleh {b.booker_name} [{b.work_unit}] - Layout: {b.room_layout || 'Classroom'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detail Modal / Digital Booking Pass */}
      {selectedBookingForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header in Red-Orange Gradient */}
            <div className="bg-gradient-to-r from-red-600 via-red-600 to-orange-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-white" />
                <div>
                  <h4 className="font-bold text-base leading-tight">Digital Booking Pass</h4>
                  <p className="text-xs text-orange-100 font-medium">Gedung Learning Center</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForDetail(null)}
                className="text-white/80 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex justify-between items-center font-mono">
                <span className="text-xs text-zinc-500 font-semibold">ID PEMINJAMAN</span>
                <span className="text-sm font-bold text-red-600">#{selectedBookingForDetail.id}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Ruangan:</span>
                  <span className="font-bold text-zinc-950">{selectedBookingForDetail.room_name} (Lantai {selectedBookingForDetail.floor})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Tanggal:</span>
                  <span className="font-mono font-medium text-zinc-900">{selectedBookingForDetail.booking_date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Jam Peminjaman:</span>
                  <span className="font-mono font-bold text-red-600">{selectedBookingForDetail.start_time} - {selectedBookingForDetail.end_time} WIB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Peminjam:</span>
                  <span className="font-bold text-zinc-950">{selectedBookingForDetail.booker_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Unit Kerja:</span>
                  <span className="font-semibold text-orange-600">{selectedBookingForDetail.work_unit}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Layout Ruangan:</span>
                  <span className="font-bold text-red-600">{selectedBookingForDetail.room_layout || 'Classroom'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Agenda Kegiatan:</span>
                  <span className="font-medium text-zinc-900 text-right max-w-[220px]">{selectedBookingForDetail.event_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Jumlah Peserta:</span>
                  <span className="font-bold text-zinc-950">{selectedBookingForDetail.participant_count} Orang (Maks 20)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleCopyPass(selectedBookingForDetail)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  {copiedId ? <Check className="w-4 h-4 text-orange-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId ? 'Tersalin!' : 'Salin Bukti'}</span>
                </button>
                <button
                  onClick={() => setSelectedBookingForDetail(null)}
                  className="py-2 px-4 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-zinc-950">
                Konfirmasi Pembatalan Jadwal
              </h4>
              <p className="text-xs text-zinc-600 mt-1">
                Apakah Anda yakin ingin membatalkan peminjaman ini? Data yang dihapus tidak dapat dipulihkan.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-1">
              <p className="font-bold text-zinc-950">
                ID #{bookingToDelete.id} - {bookingToDelete.room_name}
              </p>
              <p className="text-zinc-600">
                {bookingToDelete.booking_date} | {bookingToDelete.start_time} - {bookingToDelete.end_time} WIB
              </p>
              <p className="text-zinc-800 font-medium truncate">
                Agenda: {bookingToDelete.event_name}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setBookingToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={() => {
                  onDeleteBooking(bookingToDelete.id);
                  setBookingToDelete(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
