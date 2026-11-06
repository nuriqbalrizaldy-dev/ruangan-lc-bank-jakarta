import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { Room, Booking, LayoutConfig, DEFAULT_LAYOUTS } from '../types';

interface ManageRoomsViewProps {
  rooms: Room[];
  layouts: LayoutConfig[];
  bookings: Booking[];
  onUpdateRoom: (roomId: string, newName: string, newCapacity: number, newDescription: string, updateExistingBookings: boolean) => void;
  onAddRoom: (newRoom: Omit<Room, 'id'>) => { success: boolean; message: string };
  onDeleteRoom?: (roomId: string) => { success: boolean; message: string };
  onAddLayout: (name: string, description: string) => boolean;
  onDeleteLayout: (layoutId: string) => { success: boolean; message: string };
  onResetToDefaults: () => void;
}

export const ManageRoomsView: React.FC<ManageRoomsViewProps> = ({
  rooms,
  layouts,
  bookings,
  onUpdateRoom,
  onAddRoom,
  onDeleteRoom,
  onAddLayout,
  onDeleteLayout,
  onResetToDefaults
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'layouts'>('rooms');
  
  // State form edit ruangan
  const [editingRoomId, setEditingRoomId] = useState<string>(rooms[0]?.id || '');
  const selectedRoom = rooms.find((r) => r.id === editingRoomId) || rooms[0];

  const [editName, setEditName] = useState<string>(selectedRoom?.name || '');
  const [editCapacity, setEditCapacity] = useState<number>(selectedRoom?.capacity || 20);
  const [editDescription, setEditDescription] = useState<string>(selectedRoom?.description || '');
  const [cascadeToBookings, setCascadeToBookings] = useState<boolean>(true);

  // State form tambah ruangan baru
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomFloor, setNewRoomFloor] = useState<2 | 3>(2);
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(20);
  const [newRoomDescription, setNewRoomDescription] = useState<string>('');
  const [newRoomFacilities, setNewRoomFacilities] = useState<string>('AC Sentral, Smart TV / Proyektor, High-Speed Wi-Fi');
  const [newRoomFeedback, setNewRoomFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State form tambah layout baru
  const [newLayoutName, setNewLayoutName] = useState<string>('');
  const [newLayoutDesc, setNewLayoutDesc] = useState<string>('');
  const [layoutFeedback, setLayoutFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Status feedback umum
  const [roomFeedback, setRoomFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Ketika berpindah ruangan yang diedit
  const handleSelectRoomForEdit = (r: Room) => {
    setEditingRoomId(r.id);
    setEditName(r.name);
    setEditCapacity(r.capacity);
    setEditDescription(r.description);
    setRoomFeedback(null);
  };

  // Simpan perubahan ruangan yang sedang diedit
  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (!editName.trim()) {
      setRoomFeedback({ type: 'error', message: 'Nama ruangan tidak boleh kosong.' });
      return;
    }

    if (editCapacity < 1 || editCapacity > 200) {
      setRoomFeedback({ type: 'error', message: 'Kapasitas harus antara 1 sampai 200 orang.' });
      return;
    }

    // Cek duplikasi nama jika nama diganti
    const isDuplicate = rooms.some(
      (r) => r.id !== selectedRoom.id && r.name.trim().toLowerCase() === editName.trim().toLowerCase()
    );
    if (isDuplicate) {
      setRoomFeedback({ type: 'error', message: `Nama ruangan "${editName}" sudah digunakan oleh ruangan lain.` });
      return;
    }

    onUpdateRoom(
      selectedRoom.id,
      editName.trim(),
      editCapacity,
      editDescription.trim(),
      cascadeToBookings
    );

    setRoomFeedback({
      type: 'success',
      message: `Data ruangan "${editName.trim()}" (Kapasitas: ${editCapacity} orang) berhasil disimpan!`
    });

    setTimeout(() => {
      setRoomFeedback(null);
    }, 4000);
  };

  // Hapus ruangan yang dipilih (hanya jika tidak ada booking)
  const handleDeleteSelectedRoom = () => {
    if (!selectedRoom || !onDeleteRoom) return;

    const hasBookings = bookings.some((b) => b.room_name === selectedRoom.name);
    if (hasBookings) {
      alert(`Ruangan "${selectedRoom.name}" sedang memiliki jadwal peminjaman. Hapus atau pindahkan jadwal tersebut sebelum menghapus ruangan.`);
      return;
    }

    if (rooms.length <= 1) {
      alert('Sistem harus memiliki setidaknya 1 ruangan terdaftar.');
      return;
    }

    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus ruangan "${selectedRoom.name}"?`);
    if (!confirmDelete) return;

    const res = onDeleteRoom(selectedRoom.id);
    if (res.success) {
      const remaining = rooms.filter((r) => r.id !== selectedRoom.id);
      if (remaining.length > 0) {
        handleSelectRoomForEdit(remaining[0]);
      }
    } else {
      setRoomFeedback({ type: 'error', message: res.message });
    }
  };

  // Simpan ruangan baru (Fitur Tambahkan Ruangan Baru pasca renovasi gedung)
  const handleSaveNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setNewRoomFeedback(null);

    const trimmedName = newRoomName.trim();
    if (!trimmedName) {
      setNewRoomFeedback({ type: 'error', message: 'Nama ruangan baru wajib diisi.' });
      return;
    }

    if (newRoomCapacity < 1 || newRoomCapacity > 200) {
      setNewRoomFeedback({ type: 'error', message: 'Kapasitas ruangan harus antara 1 sampai 200 orang.' });
      return;
    }

    const facArray = newRoomFacilities
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const res = onAddRoom({
      name: trimmedName,
      floor: newRoomFloor,
      capacity: newRoomCapacity,
      description: newRoomDescription.trim() || `Ruangan pelatihan serbaguna di Lantai ${newRoomFloor} Gedung Learning Center.`,
      facilities: facArray.length > 0 ? facArray : ['AC Sentral', 'High-Speed Wi-Fi', 'Smart TV / Proyektor']
    });

    if (res.success) {
      setNewRoomFeedback({
        type: 'success',
        message: `Ruangan "${trimmedName}" (Lantai ${newRoomFloor}, Kapasitas: ${newRoomCapacity} orang) berhasil ditambahkan!`
      });
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomCapacity(20);
    } else {
      setNewRoomFeedback({
        type: 'error',
        message: res.message
      });
    }

    setTimeout(() => {
      setNewRoomFeedback(null);
    }, 4500);
  };

  // Simpan layout baru
  const handleSaveNewLayout = (e: React.FormEvent) => {
    e.preventDefault();
    setLayoutFeedback(null);

    if (!newLayoutName.trim()) {
      setLayoutFeedback({ type: 'error', message: 'Nama layout ruangan wajib diisi.' });
      return;
    }

    const success = onAddLayout(newLayoutName.trim(), newLayoutDesc.trim());
    if (success) {
      setLayoutFeedback({
        type: 'success',
        message: `Layout baru "${newLayoutName.trim()}" berhasil ditambahkan dan siap digunakan di form booking!`
      });
      setNewLayoutName('');
      setNewLayoutDesc('');
    } else {
      setLayoutFeedback({
        type: 'error',
        message: `Layout "${newLayoutName.trim()}" sudah ada sebelumnya.`
      });
    }

    setTimeout(() => {
      setLayoutFeedback(null);
    }, 4000);
  };

  const handleDeleteLayoutClick = (layout: LayoutConfig) => {
    if (DEFAULT_LAYOUTS.includes(layout.name)) {
      alert(`Layout bawaan "${layout.name}" adalah layout standar sistem dan tidak disarankan untuk dihapus.`);
      return;
    }

    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus layout "${layout.name}"?`);
    if (!confirmDelete) return;

    const res = onDeleteLayout(layout.id);
    if (res.success) {
      setLayoutFeedback({ type: 'success', message: res.message });
    } else {
      setLayoutFeedback({ type: 'error', message: res.message });
    }

    setTimeout(() => {
      setLayoutFeedback(null);
    }, 4000);
  };

  const floor2Rooms = rooms.filter((r) => r.floor === 2);
  const floor3Rooms = rooms.filter((r) => r.floor === 3);

  // Hitung berapa agenda terkait ruangan saat ini
  const bookingsForCurrentRoom = bookings.filter((b) => b.room_name === selectedRoom?.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider font-mono">
              Konfigurasi Master Data
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Kelola Ruangan & Layout Gedung
          </h2>
          <p className="text-sm text-zinc-600 mt-0.5">
            Ubah nama ruangan, perbarui kapasitas maksimal peserta, tambahkan ruangan baru hasil renovasi, dan daftarkan tipe layout baru.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Kembalikan semua nama ruangan, kapasitas (20 orang), dan layout ke default sistem?')) {
              onResetToDefaults();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
          <span>Reset ke Default Sistem</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-px">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'rooms'
              ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-lg'
              : 'border-transparent text-zinc-600 hover:text-black hover:border-zinc-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Edit Nama Ruangan & Kapasitas ({rooms.length} Ruang)</span>
        </button>
        <button
          onClick={() => setActiveTab('layouts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'layouts'
              ? 'border-red-600 text-red-600 bg-red-50/50 rounded-t-lg'
              : 'border-transparent text-zinc-600 hover:text-black hover:border-zinc-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Tambah & Kelola Layout Baru ({layouts.length})</span>
        </button>
      </div>

      {/* TAB 1: EDIT RUANGAN & KAPASITAS + TAMBAH RUANGAN BARU */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Pilih Ruangan untuk Diedit & Form Tambah Ruangan Baru di Bawahnya */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card 1: Pilihan Ruangan untuk Diedit */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono mb-3 flex items-center justify-between">
                <span>Pilih Ruangan untuk Diedit:</span>
                <span className="text-[11px] text-zinc-500 font-normal">Klik untuk memilih</span>
              </h3>

              {/* Lantai 2 */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block font-mono">
                  LANTAI 2 ({floor2Rooms.length} Ruang)
                </span>
                <div className="space-y-1.5">
                  {floor2Rooms.map((r) => {
                    const isSelected = r.id === selectedRoom?.id;
                    const bookingCount = bookings.filter((b) => b.room_name === r.name).length;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectRoomForEdit(r)}
                        className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/80 border-red-500 shadow-xs ring-1 ring-red-500'
                            : 'bg-zinc-50/60 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                            <span>{r.name}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            Kapasitas: <strong className="text-zinc-900">{r.capacity} Orang</strong>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {bookingCount} agenda
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lantai 3 */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-block font-mono">
                  LANTAI 3 ({floor3Rooms.length} Ruang)
                </span>
                <div className="space-y-1.5">
                  {floor3Rooms.map((r) => {
                    const isSelected = r.id === selectedRoom?.id;
                    const bookingCount = bookings.filter((b) => b.room_name === r.name).length;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectRoomForEdit(r)}
                        className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/80 border-red-500 shadow-xs ring-1 ring-red-500'
                            : 'bg-zinc-50/60 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                            <span>{r.name}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            Kapasitas: <strong className="text-zinc-900">{r.capacity} Orang</strong>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {bookingCount} agenda
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 2: TAMBAHKAN RUANGAN BARU (Tepat di bawah pilihan ruangan sesuai permintaan) */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
              
              <div className="border-b border-zinc-100 pb-3 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Ekspansi Fasilitas Gedung</span>
                </div>
                <h3 className="text-base font-bold text-zinc-950 mt-0.5 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-red-600" />
                  <span>Tambahkan Ruangan Baru</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Gunakan form ini untuk mendaftarkan ruangan baru apabila ada renovasi gedung, penambahan sekat, atau studio baru.
                </p>
              </div>

              {newRoomFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4 ${
                    newRoomFeedback.type === 'success'
                      ? 'bg-green-50 text-green-900 border border-green-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {newRoomFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{newRoomFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveNewRoom} className="space-y-3.5">
                {/* 1. Nama Ruangan Baru */}
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Nama Ruangan Baru:
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Contoh: Innovation Studio, Synergy Room, Podcast Hub"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                    required
                  />
                  {/* Rekomendasi Nama Ruangan Cepat */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-zinc-400">Ide nama:</span>
                    {['Innovation Lab', 'Studio Podcast', 'Synergy Room', 'Focus Room', 'Co-Working Area'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setNewRoomName(sug)}
                        className="text-[10px] px-1.5 py-0.5 bg-zinc-100 hover:bg-red-50 hover:text-red-700 text-zinc-700 rounded border border-zinc-200 transition-colors cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Pilihan Lantai & Kapasitas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Lokasi Lantai:
                    </label>
                    <select
                      value={newRoomFloor}
                      onChange={(e) => setNewRoomFloor(Number(e.target.value) as 2 | 3)}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                    >
                      <option value={2}>Lantai 2</option>
                      <option value={3}>Lantai 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Kapasitas Maksimal:
                    </label>
                    <div className="flex items-center bg-white border border-zinc-300 rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setNewRoomCapacity((prev) => Math.max(1, prev - 1))}
                        className="px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 font-bold border-r border-zinc-200 text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={newRoomCapacity}
                        onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                        className="w-full text-center py-1.5 text-xs font-bold text-zinc-950 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setNewRoomCapacity((prev) => Math.min(200, prev + 1))}
                        className="px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 font-bold border-l border-zinc-200 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Deskripsi / Fungsi Ruangan */}
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Fungsi & Deskripsi Ruangan:
                  </label>
                  <textarea
                    rows={2}
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    placeholder="Contoh: Ruang kolaborasi terpadu dengan perlengkapan multimedia dan smartboard..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* 4. Fasilitas Ruangan */}
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Fasilitas Ruangan (Pisahkan Koma):
                  </label>
                  <input
                    type="text"
                    value={newRoomFacilities}
                    onChange={(e) => setNewRoomFacilities(e.target.value)}
                    placeholder="Contoh: AC Sentral, Smart TV 75 inci, High-Speed Wi-Fi"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Tombol Submit Daftarkan Ruangan */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Ruangan Baru</span>
                </button>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Form Edit Ruangan Terpilih */}
          <div className="lg:col-span-7">
            {selectedRoom ? (
              <form
                onSubmit={handleSaveRoom}
                className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs space-y-5"
              >
                <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">
                      Edit Spesifikasi: <span className="text-red-600">{selectedRoom.name}</span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Lantai {selectedRoom.floor} Gedung Learning Center
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 text-[11px] font-mono font-bold">
                      ID: {selectedRoom.id}
                    </span>
                    {onDeleteRoom && bookingsForCurrentRoom.length === 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedRoom}
                        title="Hapus ruangan ini"
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {roomFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      roomFeedback.type === 'success'
                        ? 'bg-green-50 text-green-900 border border-green-200'
                        : 'bg-red-50 text-red-900 border border-red-200'
                    }`}
                  >
                    {roomFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{roomFeedback.message}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Input 1: Nama Ruangan */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Nama Ruangan:
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                      placeholder="Contoh: Think Room"
                      required
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Nama ini akan ditampilkan pada seluruh menu jadwal, timeline, dan bukti booking.
                    </p>
                  </div>

                  {/* Input 2: Kapasitas Maksimal Peserta */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Kapasitas Maksimal Peserta (Orang):
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white border border-zinc-300 rounded-lg overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setEditCapacity((prev) => Math.max(1, prev - 1))}
                          className="px-3 py-2 text-zinc-600 hover:bg-zinc-100 font-bold border-r border-zinc-200"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={editCapacity}
                          onChange={(e) => setEditCapacity(Number(e.target.value))}
                          className="w-24 text-center py-2 text-sm font-bold text-zinc-950 focus:outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setEditCapacity((prev) => Math.min(200, prev + 1))}
                          className="px-3 py-2 text-zinc-600 hover:bg-zinc-100 font-bold border-l border-zinc-200"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-zinc-600 font-medium">
                        Orang per sesi agenda
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Sistem validasi form booking akan otomatis membatasi input jumlah peserta sesuai angka ini.
                    </p>
                  </div>

                  {/* Input 3: Deskripsi / Fungsi Ruangan */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1">
                      Fungsi & Deskripsi Ruangan:
                    </label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Jelaskan fungsi utama dan karakteristik ruangan..."
                    />
                  </div>

                  {/* Opsi Sinkronisasi jika nama berubah */}
                  {editName.trim() !== selectedRoom.name && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cascadeToBookings}
                          onChange={(e) => setCascadeToBookings(e.target.checked)}
                          className="mt-0.5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <div className="text-xs text-orange-950">
                          <strong className="block font-bold">
                            Perbarui Nama pada {bookingsForCurrentRoom.length} Jadwal yang Sudah Terdaftar
                          </strong>
                          <span className="text-[11px] text-orange-800/80">
                            Secara otomatis memperbarui jadwal yang sebelumnya menggunakan nama &quot;{selectedRoom.name}&quot; menjadi &quot;{editName}&quot;.
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div className="text-[11px] text-zinc-500">
                    Perubahan langsung berlaku di seluruh sistem.
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Ruangan</span>
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: TAMBAH & KELOLA LAYOUT BARU */}
      {activeTab === 'layouts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Form Tambah Layout Baru */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSaveNewLayout}
              className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4"
            >
              <div className="border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Tambah Jenis Layout</span>
                </div>
                <h3 className="text-base font-bold text-zinc-950 mt-0.5">
                  Pendaftaran Layout Baru
                </h3>
                <p className="text-xs text-zinc-500">
                  Daftarkan variasi tata letak meja/kursi baru untuk dipilih saat booking.
                </p>
              </div>

              {layoutFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    layoutFeedback.type === 'success'
                      ? 'bg-green-50 text-green-900 border border-green-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {layoutFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{layoutFeedback.message}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Nama Layout:
                  </label>
                  <input
                    type="text"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    placeholder="Contoh: Boardroom, Banquet, Round Table"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                    required
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-zinc-400">Rekomendasi:</span>
                    {['Boardroom', 'Round Table', 'Banquet', 'Hollow Square', 'Cluster'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setNewLayoutName(sug)}
                        className="text-[10px] px-1.5 py-0.5 bg-zinc-100 hover:bg-red-50 hover:text-red-700 text-zinc-700 rounded border border-zinc-200 transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Deskripsi / Petunjuk Penggunaan:
                  </label>
                  <textarea
                    rows={3}
                    value={newLayoutDesc}
                    onChange={(e) => setNewLayoutDesc(e.target.value)}
                    placeholder="Contoh: Meja rapat besar di tengah ruangan untuk koordinasi intensif pimpinan..."
                    className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Layout Baru</span>
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Daftar Layout yang Terdaftar */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
                <h3 className="text-sm font-bold text-zinc-950">
                  Daftar Layout Aktif ({layouts.length})
                </h3>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Semua layout ini otomatis tampil pada dropdown form booking
                </span>
              </div>

              <div className="divide-y divide-zinc-100">
                {layouts.map((l) => {
                  const isDefault = DEFAULT_LAYOUTS.includes(l.name);
                  const usageCount = bookings.filter((b) => (b.room_layout || 'Classroom') === l.name).length;

                  return (
                    <div key={l.id} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-950 font-mono">
                            {l.name}
                          </span>
                          {isDefault ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                              Bawaan Sistem
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                              Layout Kustom
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400">
                            • Digunakan di {usageCount} agenda
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                          {l.description || 'Tidak ada keterangan khusus.'}
                        </p>
                      </div>

                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLayoutClick(l)}
                          title="Hapus layout ini"
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
