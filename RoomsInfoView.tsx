import React from 'react';
import { 
  Building2, 
  Users, 
  Check, 
  ArrowRight,
  Sliders
} from 'lucide-react';
import { Room, ROOMS_MASTER } from '../types';

interface RoomsInfoViewProps {
  rooms?: Room[];
  onSelectRoomToBook: (roomName: string) => void;
  onNavigateToManage?: () => void;
}

export const RoomsInfoView: React.FC<RoomsInfoViewProps> = ({
  rooms,
  onSelectRoomToBook,
  onNavigateToManage
}) => {
  const activeRooms = rooms || ROOMS_MASTER;
  const floor2Rooms = activeRooms.filter((r) => r.floor === 2);
  const floor3Rooms = activeRooms.filter((r) => r.floor === 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider font-mono">
              Spesifikasi Gedung
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Master Data Ruangan Gedung Learning Center
          </h2>
          <p className="text-sm text-zinc-600 mt-0.5">
            Spesifikasi kapasitas dan fasilitas ruangan pelatihan di Lantai 2 dan Lantai 3.
          </p>
        </div>

        {onNavigateToManage && (
          <button
            onClick={onNavigateToManage}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-lg transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-orange-400" />
            <span>Edit Ruangan & Layout</span>
          </button>
        )}
      </div>

      {/* Lantai 2 Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-bold font-mono shadow-xs">
            LANTAI 2
          </div>
          <h3 className="text-base font-bold text-zinc-950">
            Ruang Diskusi & Workshop Utama
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {floor2Rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between hover:border-red-500 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-base font-bold text-zinc-950">{room.name}</h4>
                    <span className="text-xs text-zinc-500 font-medium">Lantai {room.floor} Gedung Learning Center</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 text-white text-xs font-bold">
                    <Users className="w-3.5 h-3.5 text-orange-400" />
                    <span>Maks {room.capacity} Orang</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                  {room.description}
                </p>

                <div className="mb-4">
                  <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-2 font-mono">
                    Fasilitas Ruangan:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-50 text-zinc-800 border border-zinc-200"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectRoomToBook(room.name)}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-black hover:bg-red-600 rounded-lg transition-colors shadow-2xs"
              >
                <span>Pesan Ruangan Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lantai 3 Section */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-md bg-orange-600 text-white text-xs font-bold font-mono shadow-xs">
            LANTAI 3
          </div>
          <h3 className="text-base font-bold text-zinc-950">
            Ruang Pelatihan, Sertifikasi & Rapat Eksekutif
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {floor3Rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between hover:border-orange-500 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-base font-bold text-zinc-950">{room.name}</h4>
                    <span className="text-xs text-zinc-500 font-medium">Lantai {room.floor} Gedung Learning Center</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 text-white text-xs font-bold">
                    <Users className="w-3.5 h-3.5 text-orange-400" />
                    <span>Maks {room.capacity} Orang</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                  {room.description}
                </p>

                <div className="mb-4">
                  <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-2 font-mono">
                    Fasilitas Ruangan:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-50 text-zinc-800 border border-zinc-200"
                      >
                        <Check className="w-3 h-3 text-orange-600" />
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectRoomToBook(room.name)}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-black hover:bg-orange-600 rounded-lg transition-colors shadow-2xs"
              >
                <span>Pesan Ruangan Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
