import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CalendarDays, 
  PlusCircle, 
  BarChart3, 
  FileCode2, 
  RotateCcw,
  Menu,
  X,
  CheckCircle2,
  Download,
  Sliders,
  Package
} from 'lucide-react';
import { Booking, NavigationMenu, Room, LayoutConfig, ROOMS_MASTER, INITIAL_LAYOUTS_CONFIG } from './types';
import { generateInitialBookings } from './data/initialBookings';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BookingFormView } from './components/BookingFormView';
import { TimelineView } from './components/TimelineView';
import { RoomsInfoView } from './components/RoomsInfoView';
import { ManageRoomsView } from './components/ManageRoomsView';
import { PythonCodeView } from './components/PythonCodeView';
import { downloadPythonScript } from './utils/csvExport';
import { downloadProjectZip } from './utils/exportZip';
import { PYTHON_APP_CODE } from './data/pythonSource';

const LOCAL_STORAGE_BOOKINGS_KEY = 'lc_room_bookings_v2';
const LOCAL_STORAGE_ROOMS_KEY = 'lc_rooms_master_v2';
const LOCAL_STORAGE_LAYOUTS_KEY = 'lc_layouts_master_v2';

export default function App() {
  // 1. State Bookings
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => ({
            ...item,
            room_layout: item.room_layout || 'Classroom'
          }));
        }
      }
    } catch {
      // fallback
    }
    return generateInitialBookings();
  });

  // 2. State Rooms Master Data (bisa diedit nama & kapasitasnya)
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ROOMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.error('Failed to save bookings to localStorage', e);
    }
  }, [bookings]);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAddBooking = (newBookingData: Omit<Booking, 'id'>): number => {
    const nextId = bookings.length > 0 ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;
    const newBooking: Booking = {
      ...newBookingData,
      id: nextId
    };
    setBookings((prev) => [newBooking, ...prev]);
    showToast(`Peminjaman #${nextId} (${newBooking.room_name}) berhasil disimpan!`);
    return nextId;
  };

  const handleDeleteBooking = (id: number) => {
    const target = bookings.find((b) => b.id === id);
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

    // Jika nama berubah dan user memilih cascade ke existing bookings
    if (updateExistingBookings && oldName !== newName) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.room_name === oldName) {
            return {
              ...b,
              room_name: newName
            };
          }
          return b;
        })
      );
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

  // Handler: Reset semua master data ke default awal
  const handleResetToDefaults = () => {
    setRooms(ROOMS_MASTER);
    setLayouts(INITIAL_LAYOUTS_CONFIG);
    showToast('Nama ruangan, kapasitas (20 orang), dan layout telah dikembalikan ke default.');
  };

  const handleResetData = () => {
    const fresh = generateInitialBookings();
    setBookings(fresh);
    showToast('Data peminjaman direset ke contoh jadwal awal.');
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

      {/* Mobile Top Header in Black with Red Logo */}
      <header className="md:hidden bg-black text-white px-4 py-3 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold leading-tight">Learning Center</h1>
            <p className="text-[10px] text-orange-400 font-medium">Peminjaman Ruangan</p>
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
          <button
            onClick={() => {
              setCurrentMenu('manage');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-left ${
              currentMenu === 'manage' ? 'bg-red-600 text-white' : 'text-zinc-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Kelola Ruangan & Layout</span>
          </button>
          <button
            onClick={() => {
              setCurrentMenu('rooms');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-left ${
              currentMenu === 'rooms' ? 'bg-red-600 text-white' : 'text-zinc-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Informasi Ruangan</span>
          </button>
          <button
            onClick={() => {
              setCurrentMenu('python_code');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-left ${
              currentMenu === 'python_code' ? 'bg-red-600 text-white' : 'text-zinc-300'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Kode Python app.py</span>
          </button>
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
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span className="text-zinc-950 font-bold">Gedung Learning Center</span>
            <span>/</span>
            <span className="capitalize text-red-600 font-bold">
              {currentMenu === 'dashboard' && 'Jadwal & Dashboard'}
              {currentMenu === 'booking' && 'Booking Ruangan Baru'}
              {currentMenu === 'timeline' && 'Timeline Ketersediaan'}
              {currentMenu === 'manage' && 'Kelola Ruangan & Layout'}
              {currentMenu === 'rooms' && 'Master Data Ruangan'}
              {currentMenu === 'python_code' && 'Kode Python app.py'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetData}
              title="Reset ke Jadwal Contoh"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Reset Data</span>
            </button>
            <button
              onClick={() => {
                downloadProjectZip();
                showToast('Mengunduh ZIP Proyek (src, app.py, package.json, requirements.txt, README.md)...');
              }}
              title="Unduh seluruh folder src, app.py, package.json, requirements.txt, dan README.md dalam 1 file ZIP"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-orange-500" />
              <span>Unduh Proyek (ZIP GitHub)</span>
            </button>
            <button
              onClick={() => downloadPythonScript(PYTHON_APP_CODE, 'app.py')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs shadow-red-600/30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh app.py</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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

          {currentMenu === 'manage' && (
            <ManageRoomsView
              rooms={rooms}
              layouts={layouts}
              bookings={bookings}
              onUpdateRoom={handleUpdateRoom}
              onAddRoom={handleAddRoom}
              onDeleteRoom={handleDeleteRoom}
              onAddLayout={handleAddLayout}
              onDeleteLayout={handleDeleteLayout}
              onResetToDefaults={handleResetToDefaults}
            />
          )}

          {currentMenu === 'rooms' && (
            <RoomsInfoView
              rooms={rooms}
              onSelectRoomToBook={handleSelectRoomToBook}
              onNavigateToManage={() => setCurrentMenu('manage')}
            />
          )}

          {currentMenu === 'python_code' && (
            <PythonCodeView />
          )}
        </div>
      </main>
    </div>
  );
}
