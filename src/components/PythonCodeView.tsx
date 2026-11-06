import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  FileCode,
  Package
} from 'lucide-react';
import { PYTHON_APP_CODE } from '../data/pythonSource';
import { downloadPythonScript } from '../utils/csvExport';
import { downloadProjectZip } from '../utils/exportZip';

export const PythonCodeView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_APP_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadPythonScript(PYTHON_APP_CODE, 'app.py');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white font-mono">
              Python 3.8+ · Streamlit · SQLite3
            </span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Kode Utuh Python (app.py) & Panduan Terminal
          </h2>
          <p className="text-sm text-zinc-600 mt-0.5">
            File tunggal siap pakai yang dapat langsung diunduh dan dieksekusi di terminal komputer lokal Anda.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => downloadProjectZip()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            title="Unduh seluruh folder src, app.py, package.json, requirements.txt, dan README.md dalam 1 file ZIP"
          >
            <Package className="w-4 h-4 text-orange-500" />
            <span>Unduh File Proyek (ZIP GitHub)</span>
          </button>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-orange-600" /> : <Copy className="w-4 h-4 text-zinc-700" />}
            <span>{copied ? 'Kode Tersalin!' : 'Salin app.py'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-600/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh app.py</span>
          </button>
        </div>
      </div>

      {/* Terminal Instructions Card in Black with Red & Orange accents */}
      <div className="bg-black text-zinc-200 rounded-2xl p-6 shadow-md border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-500 tracking-wider uppercase font-mono">
          <Terminal className="w-4 h-4 text-red-500" />
          <span>Panduan Eksekusi di Terminal Komputer Lokal</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-mono">1</span>
              <span>Install Library Python</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Buka Command Prompt (Windows) atau Terminal (macOS/Linux), lalu jalankan:
            </p>
            <div className="bg-zinc-950 p-2.5 rounded-lg font-mono text-[11px] text-orange-400 select-all border border-zinc-800">
              pip install streamlit pandas
            </div>
            <p className="text-[10px] text-zinc-500">
              *Library <code className="text-zinc-300">sqlite3</code> sudah terpasang bawaan di Python.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[11px] font-mono">2</span>
              <span>Simpan & Buka Folder</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Simpan file sebagai <strong>app.py</strong>. Masuk ke folder tempat file tersebut disimpan:
            </p>
            <div className="bg-zinc-950 p-2.5 rounded-lg font-mono text-[11px] text-zinc-300 select-all border border-zinc-800">
              cd path/ke/folder_anda
            </div>
            <p className="text-[10px] text-zinc-500">
              Database SQLite (<code className="text-zinc-300">learning_center_rooms.db</code>) akan otomatis dibuat saat aplikasi dijalankan.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-mono">3</span>
              <span>Jalankan Aplikasi Web</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Ketik perintah berikut untuk menjalankan server lokal Streamlit:
            </p>
            <div className="bg-zinc-950 p-2.5 rounded-lg font-mono text-[11px] text-red-400 select-all border border-zinc-800 font-bold">
              streamlit run app.py
            </div>
            <p className="text-[10px] text-zinc-500">
              Browser terbuka di <strong>http://localhost:8501</strong> dan dapat diakses dari HP via Network URL.
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-lg">
        {/* Code Bar */}
        <div className="px-5 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-red-500" />
            <span className="font-mono text-white font-bold">app.py</span>
            <span className="text-[11px] text-zinc-500 font-mono">({PYTHON_APP_CODE.split('\n').length} baris kode)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 text-[11px] font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .py</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <pre className="p-5 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed max-h-[600px] selection:bg-red-900 selection:text-white">
          <code>{PYTHON_APP_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
