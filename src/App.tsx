import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarDays, 
  PlusCircle, 
  BarChart3, 
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Download
} from 'lucide-react';
import { Booking, NavigationMenu, Room, LayoutConfig, ROOMS_MASTER, INITIAL_LAYOUTS_CONFIG } from './types';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BookingFormView } from './components/BookingFormView';
import { TimelineView } from './components/TimelineView';
import { checkBookingCollision } from './utils/validation';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Booking sekarang disimpan di Supabase (dibagi ke semua pengguna).
// Data ruangan & layout masih disimpan per-browser seperti sebelumnya.
const LOCAL_STORAGE_ROOMS_KEY = 'lc_rooms_master_v2';
const LOCAL_STORAGE_LAYOUTS_KEY = 'lc_layouts_master_v2';

// Memecah "Think Room + Big Room" menjadi ["Think Room", "Big Room"]
function splitRoomNames(roomName: string): string[] {
  return (roomName || '')
    .split('+')
    .map((n) => n.trim())
    .filter(Boolean);
}

// Mengubah satu baris dari tabel Supabase menjadi objek Booking milik aplikasi
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBooking(row: any): Booking {
  const roomName: string = row.room_name ?? '';
  return {
    id: Number(row.id),
    room_name: roomName,
    room_names: splitRoomNames(roomName),
    floor: Number(row.floor),
    booking_date: row.booking_date,
    start_time: row.start_time,
    end_time: row.end_time,
    booker_name: row.booker_name,
    work_unit: row.work_unit ?? '',
    room_layout: row.room_layout || 'Classroom',
    event_name: row.event_name,
    participant_count: Number(row.participant_count),
    created_at: row.created_at
  } as Booking;
}

export default function App() {
  // 1. State Bookings (diambil dari Supabase)
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 2. State Rooms Master Data (kapasitas lantai 2 & 3: 25 orang, lantai 1: meeting 1 = 8, meeting 2 = 4)
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ROOMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasFloor1 = parsed.some((r: Room) => r.floor === 1);
          let currentList = parsed;
          if (!hasFloor1) {
            const floor1Rooms = ROOMS_MASTER.filter((r) => r.floor === 1);
            currentList = [...floor1Rooms, ...parsed];
          }
          // Perbarui kapasitas lantai 2 dan 3 menjadi 25 orang sesuai konfigurasi master
          return currentList.map((r: Room) => {
            if (r.floor === 2 || r.floor === 3) {
              return { ...r, capacity: 25 };
            }
            return r;
          });
        }
      }
    } catch {
      // fallback
    }
    return ROOMS_MASTER;
  });

  // 3. State Layouts Master Data (bisa ditambahkan layout baru)
  const [layouts, setLayouts] = useState<LayoutConfig[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_LAYOUTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_LAYOUTS_CONFIG;
  });

  const [currentMenu, setCurrentMenu] = useState<NavigationMenu>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prefilledRoom, setPrefilledRoom] = useState<string | undefined>(undefined);
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>(undefined);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Ambil seluruh booking terbaru dari Supabase
  const fetchBookings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoadError(
        'Konfigurasi database belum terbaca. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY sudah diisi di Vercel, lalu Redeploy.'
      );
      setLoadingBookings(false);
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Gagal memuat booking dari Supabase', error);
      setLoadError('Tidak dapat memuat jadwal dari database. Periksa koneksi internet Anda.');
    } else {
      setLoadError(null);
      setBookings((data ?? []).map(rowToBooking));
    }
    setLoadingBookings(false);
  }, []);

  // Muat data saat aplikasi dibuka, lalu dengarkan perubahan secara langsung (realtime).
  // Polling 30 detik dipasang sebagai cadangan kalau koneksi realtime terputus.
  useEffect(() => {
    fetchBookings();

    if (!isSupabaseConfigured) {
      return undefined;
    }

    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    const timer = setInterval(fetchBookings, 30000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  // Sync rooms & layouts ke localStorage (per-browser)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.error('Failed to save rooms to localStorage', e);
    }
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LAYOUTS_KEY, JSON.stringify(layouts));
    } catch (e) {
      console.error('Failed to save layouts to localStorage', e);
    }
  }, [layouts]);

  // Simpan booking baru ke Supabase. Mengembalikan ID baru, atau null jika gagal.
  const handleAddBooking = async (newBookingData: Omit<Booking, 'id'>): Promise<number | null> => {
    // Cek ulang bentrok terhadap data TERBARU di database (kalau ada orang lain
    // yang baru saja memesan ruangan yang sama beberapa detik lalu).
    const { data: latest, error: latestError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', newBookingData.booking_date);

    if (latestError) {
      console.error('Gagal memeriksa jadwal terbaru', latestError);
      showToast('Gagal terhubung ke database. Booking belum tersimpan, silakan coba lagi.');
      return null;
    }

    const roomNames =
      newBookingData.room_names && newBookingData.room_names.length > 0
        ? newBookingData.room_names
        : splitRoomNames(newBookingData.room_name);

    const collision = checkBookingCollision(
      (latest ?? []).map(rowToBooking),
      roomNames,
      newBookingData.booking_date,
      newBookingData.start_time,
      newBookingData.end_time
    );

    if (collision.hasCollision) {
      showToast(collision.errorMessage || 'Jadwal bentrok dengan booking lain yang baru saja masuk.');
      fetchBookings();
      return null;
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        room_name: newBookingData.room_name,
        floor: newBookingData.floor,
        booking_date: newBookingData.booking_date,
        start_time: newBookingData.start_time,
        end_time: newBookingData.end_time,
        booker_name: newBookingData.booker_name,
        work_unit: newBookingData.work_unit,
        room_layout: newBookingData.room_layout || 'Classroom',
        event_name: newBookingData.event_name,
        participant_count: newBookingData.participant_count
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Gagal menyimpan booking ke Supabase', error);
      showToast('Gagal menyimpan booking ke database. Silakan coba lagi.');
      return null;
    }

    const saved = rowToBooking(data);
    setBookings((prev) => (prev.some((b) => b.id === saved.id) ? prev : [saved, ...prev]));
    showToast(`Peminjaman #${saved.id} (${saved.room_name}) berhasil disimpan!`);
    return saved.id;
  };

  const handleDeleteBooking = async (id: number) => {
    const target = bookings.find((b) => b.id === id);

    const { error } = await supabase.from('bookings').delete().eq('id', id);

    if (error) {
      console.error('Gagal menghapus booking dari Supabase', error);
      showToast('Gagal membatalkan peminjaman. Silakan coba lagi.');
      return;
    }

    setBookings((prev) => prev.filter((b) => b.id !== id));
    showToast(`Peminjaman ID #${id} ${target ? `(${target.room_name})` : ''} telah dibatalkan.`);
  };

  // Handler: Update Nama Ruangan & Kapasitas Maksimal
  const handleUpdateRoom = (
    roomId: string, 
    newName: string, 
    newCapacity: number, 
    newDescription: string,
    updateExistingBookings: boolean
  ) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;

    const oldName = targetRoom.name;

    // Update rooms list
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            name: newName,
            capacity: newCapacity,
            description: newDescription
          };
        }
        return r;
      })
    );

    // Jika nama berubah dan user memilih cascade ke existing bookings (di database)
    if (updateExistingBookings && oldName !== newName) {
      supabase
        .from('bookings')
        .update({ room_name: newName })
        .eq('room_name', oldName)
        .then(({ error }) => {
          if (error) {
            console.error('Gagal memperbarui nama ruangan pada booking', error);
            showToast('Nama ruangan pada jadwal gagal diperbarui di database.');
          }
          fetchBookings();
        });
    }

    showToast(`Ruangan "${newName}" berhasil diperbarui (Kapasitas: ${newCapacity} orang).`);
  };

  // Handler: Tambah Ruangan Baru
  const handleAddRoom = (newRoomData: Omit<Room, 'id'>): { success: boolean; message: string } => {
    const trimmedName = newRoomData.name.trim();
    if (!trimmedName) {
      return { success: false, message: 'Nama ruangan wajib diisi.' };
    }

    const isDuplicate = rooms.some(
      (r) => r.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      return { success: false, message: `Ruangan dengan nama "${trimmedName}" sudah ada.` };
    }

    const roomId = `room-${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newRoom: Room = {
      ...newRoomData,
      id: roomId,
      name: trimmedName,
      capacity: Number(newRoomData.capacity) || 20,
      facilities: newRoomData.facilities && newRoomData.facilities.length > 0 
        ? newRoomData.facilities 
        : ['AC Sentral', 'High-Speed Wi-Fi', 'Smart TV / Proyektor']
    };

    setRooms((prev) => [...prev, newRoom]);
    showToast(`Ruangan baru "${trimmedName}" (Lantai ${newRoom.floor}) berhasil ditambahkan!`);
    return { success: true, message: `Ruangan "${trimmedName}" berhasil didaftarkan!` };
  };

  // Handler: Hapus Ruangan (jika tidak ada booking)
  const handleDeleteRoom = (roomId: string): { success: boolean; message: string } => {
    const target = rooms.find((r) => r.id === roomId);
    if (!target) return { success: false, message: 'Ruangan tidak ditemukan.' };

    const isUsed = bookings.some((b) => b.room_name === target.name);
    if (isUsed) {
      return {
        success: false,
        message: `Ruangan "${target.name}" tidak dapat dihapus karena masih ada riwayat jadwal booking. Batalkan jadwal terkait terlebih dahulu.`
      };
    }

    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    showToast(`Ruangan "${target.name}" telah dihapus.`);
    return { success: true, message: `Ruangan "${target.name}" berhasil dihapus.` };
  };

  // Handler: Tambah Layout Baru
  const handleAddLayout = (name: string, description: string): boolean => {
    const normalizedName = name.trim();
    const exists = layouts.some((l) => l.name.toLowerCase() === normalizedName.toLowerCase());
    if (exists) return false;

    const newLayout: LayoutConfig = {
      id: `layout-${Date.now()}`,
      name: normalizedName,
      description: description.trim(),
      isCustom: true
    };

    setLayouts((prev) => [...prev, newLayout]);
    showToast(`Layout baru "${normalizedName}" berhasil ditambahkan!`);
    return true;
  };

  // Handler: Hapus Layout Kustom
  const handleDeleteLayout = (layoutId: string): { success: boolean; message: string } => {
    const target = layouts.find((l) => l.id === layoutId);
    if (!target) return { success: false, message: 'Layout tidak ditemukan.' };

    // Cek apakah ada booking yang sedang menggunakan layout ini
    const isUsed = bookings.some((b) => (b.room_layout || 'Classroom') === target.name);
    if (isUsed) {
      return {
        success: false,
        message: `Layout "${target.name}" sedang digunakan oleh agenda booking yang terdaftar. Harap ganti layout agenda tersebut terlebih dahulu.`
      };
    }

    setLayouts((prev) => prev.filter((l) => l.id !== layoutId));
    showToast(`Layout "${target.name}" telah dihapus.`);
    return { success: true, message: `Layout "${target.name}" berhasil dihapus.` };
  };

  // Handler: Reset master data ruangan & layout ke default awal (hanya di browser ini)
  const handleResetToDefaults = () => {
    setRooms(ROOMS_MASTER);
    setLayouts(INITIAL_LAYOUTS_CONFIG);
    showToast('Nama ruangan, kapasitas (20 orang), dan layout telah dikembalikan ke default.');
  };

  const handleNavigateToBookingWithPrefill = (roomName: string, time: string, date?: string) => {
    setPrefilledRoom(roomName);
    setPrefilledTime(time);
    setPrefilledDate(date);
    setCurrentMenu('booking');
  };

  const handleSelectRoomToBook = (roomName: string) => {
    setPrefilledRoom(roomName);
    setPrefilledTime('09:00');
    setPrefilledDate(undefined);
    setCurrentMenu('booking');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-100/70 text-zinc-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-zinc-700">
          <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Top Header with Bank Jakarta Logo */}
      <header className="md:hidden bg-black text-white px-4 py-3 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-zinc-700 shadow-sm">
            <img 
              src="/assets/aistudio/Logo_Bank_Jakarta_new_OK_Logogram_6854f423.png" 
              alt="Bank Jakarta Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 block leading-tight">
              BANK JAKARTA
            </span>
            <h1 className="text-xs font-bold leading-tight text-white">Learning Center</h1>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-zinc-400 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-b border-zinc-800 px-4 py-3 space-y-1 z-40">
          <button
            onClick={() => {
              setCurrentMenu('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-left ${
              currentMenu === 'dashboard' ? 'bg-red-600 text-white' : 'text-zinc-300'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Jadwal & Dashboard</span>
          </button>
          <button
            onClick={() => {
              setCurrentMenu('booking');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-left ${
              currentMenu === 'booking' ? 'bg-red-600 text-white' : 'text-zinc-300'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Booking Ruangan Baru</span>
          </button>
          <button
            onClick={() => {
              setCurrentMenu('timeline');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-left ${
              currentMenu === 'timeline' ? 'bg-red-600 text-white' : 'text-zinc-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Timeline Ketersediaan</span>
          </button>
          <a
            href="/ruangan-lc-bank-jakarta.zip"
            download="ruangan-lc-bank-jakarta.zip"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-left bg-zinc-900 text-orange-400 border border-zinc-700"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Download Semua File (.ZIP)</span>
          </a>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          currentMenu={currentMenu}
          onSelectMenu={(menu) => {
            setCurrentMenu(menu);
            if (menu !== 'booking') {
              setPrefilledRoom(undefined);
              setPrefilledTime(undefined);
              setPrefilledDate(undefined);
            }
          }}
          bookingCount={bookings.length}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white border-b border-zinc-200 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-zinc-500 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white border border-zinc-200 p-0.5 flex items-center justify-center shadow-2xs">
                <img 
                  src="/assets/aistudio/Logo_Bank_Jakarta_new_OK_Logogram_6854f423.png" 
                  alt="Bank Jakarta" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-zinc-950 font-bold tracking-tight">Bank Jakarta</span>
            </div>
            <span className="text-zinc-300 font-normal">/</span>
            <span className="text-zinc-700 font-semibold">Gedung Learning Center</span>
            <span className="text-zinc-300 font-normal">/</span>
            <span className="capitalize text-red-600 font-bold">
              {currentMenu === 'dashboard' && 'Jadwal & Dashboard'}
              {currentMenu === 'booking' && 'Booking Ruangan Baru'}
              {currentMenu === 'timeline' && 'Timeline Ketersediaan'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/ruangan-lc-bank-jakarta.zip"
              download="ruangan-lc-bank-jakarta.zip"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs shadow-red-600/30 cursor-pointer"
              title="Download seluruh file proyek (.ZIP) siap upload ke GitHub"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Proyek (.ZIP)</span>
            </a>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loadError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="flex-1 font-bold">{loadError}</span>
              <button
                onClick={fetchBookings}
                className="font-bold text-red-700 hover:underline shrink-0"
              >
                Coba lagi
              </button>
            </div>
          )}

          {loadingBookings && !loadError && (
            <div className="mb-4 text-xs font-semibold text-zinc-500">
              Memuat jadwal dari database...
            </div>
          )}

          {currentMenu === 'dashboard' && (
            <DashboardView
              bookings={bookings}
              rooms={rooms}
              layouts={layouts}
              onDeleteBooking={handleDeleteBooking}
              onNavigate={(menu) => setCurrentMenu(menu)}
            />
          )}

          {currentMenu === 'booking' && (
            <BookingFormView
              bookings={bookings}
              rooms={rooms}
              layouts={layouts}
              onAddBooking={handleAddBooking}
              onNavigate={(menu) => setCurrentMenu(menu)}
              prefilledRoom={prefilledRoom}
              prefilledTime={prefilledTime}
              prefilledDate={prefilledDate}
            />
          )}

          {currentMenu === 'timeline' && (
            <TimelineView
              bookings={bookings}
              rooms={rooms}
              onNavigateToBookingWithPrefill={handleNavigateToBookingWithPrefill}
            />
          )}
        </div>
      </main>
    </div>
  );
}
