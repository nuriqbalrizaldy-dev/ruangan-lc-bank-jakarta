import React from 'react';
import { 
  CalendarDays, 
  PlusCircle, 
  BarChart3, 
  Building2, 
  FileCode2, 
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { NavigationMenu } from '../types';

interface SidebarProps {
  currentMenu: NavigationMenu;
  onSelectMenu: (menu: NavigationMenu) => void;
  bookingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  bookingCount
}) => {
  const menuItems: { id: NavigationMenu; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Jadwal & Dashboard',
      icon: <CalendarDays className="w-4 h-4" />,
      badge: bookingCount
    },
    {
      id: 'booking',
      label: 'Booking Ruangan Baru',
      icon: <PlusCircle className="w-4 h-4" />
    },
    {
      id: 'timeline',
      label: 'Timeline Ketersediaan',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      id: 'manage',
      label: 'Kelola Ruangan & Layout',
      icon: <Sliders className="w-4 h-4" />
    },
    {
      id: 'rooms',
      label: 'Informasi Ruangan',
      icon: <Building2 className="w-4 h-4" />
    },
    {
      id: 'python_code',
      label: 'Kode Python (app.py)',
      icon: <FileCode2 className="w-4 h-4" />
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-black text-white flex flex-col shrink-0 border-r border-zinc-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-red-600/30 shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-white tracking-tight truncate">
            Learning Center
          </h1>
          <p className="text-xs text-orange-400 font-medium truncate">
            Sistem Peminjaman Ruangan
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-zinc-400 tracking-wider">
          MENU UTAMA
        </p>
        {menuItems.map((item) => {
          const isActive = currentMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectMenu(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-600/20'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={isActive ? 'text-white' : 'text-zinc-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-black text-orange-300' : 'bg-zinc-800 text-orange-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rules Notice */}
      <div className="p-4 m-3 bg-zinc-900/90 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-2">
          <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />
          <span>Aturan Reservasi</span>
        </div>
        <ul className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
          <li>• Kapasitas maks <strong className="text-zinc-200">20 orang</strong> per ruang.</li>
          <li>• Validasi anti-bentrok aktif otomatis.</li>
          <li>• Jam operasional <strong className="text-zinc-200">07:30 - 18:00 WIB</strong>.</li>
        </ul>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
        <span className="font-mono text-zinc-400">Streamlit · SQLite</span>
        <span className="text-orange-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
          Ready
        </span>
      </div>
    </aside>
  );
};
