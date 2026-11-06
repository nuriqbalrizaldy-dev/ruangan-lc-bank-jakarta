# Sistem Manajemen Peminjaman Ruangan - Gedung Learning Center

Aplikasi web modern untuk manajemen reservasi dan peminjaman ruangan pelatihan di Gedung Learning Center (Lantai 2 & Lantai 3). Dilengkapi dengan sistem anti-bentrok jadwal otomatis, visual timeline mingguan, pemisahan unit kerja peminjam, konfigurasi tipe layout ruangan, serta dukungan penggabungan ruangan (multi-room) dengan partisi fleksibel.

---

## 🌟 Fitur Utama
1. **Jadwal & Dashboard Real-Time**:
   - Pemantauan seluruh agenda peminjaman ruangan.
   - Pemisahan nama peminjam dan unit kerja/divisi secara rapi.
   - Filter pencarian multifaset (berdasarkan tanggal, lantai, ruangan, dan layout).
   - Ekspor data jadwal ke format CSV.
   - Pembatalan/penghapusan jadwal jika kegiatan batal.

2. **Booking Ruangan Fleksibel & Multi-Ruangan**:
   - Mendukung pemilihan 1 atau beberapa ruangan sekaligus di lantai yang sama (partisi dibuka).
   - Kalkulasi otomatis total kapasitas kumulatif (contoh: *Think Room 20 + Big Room 20 = 40 orang*).
   - Pilihan layout ruangan: *Classroom*, *U-Shape*, *Theater*, dan layout kustom.
   - Penerbitan Bukti Reservasi Digital (*Digital Booking Pass*) lengkap dengan tombol salin.

3. **Proteksi Bentrok Jadwal (Collision Prevention)**:
   - Validasi bentrok otomatis: mencegah ruangan atau bagian dari ruangan gabungan dipesan pada jam yang bertubrukan.

4. **Timeline Ketersediaan Mingguan**:
   - Tampilan matriks mingguan (Senin s.d. Minggu).
   - Tombol navigasi mudah (*Minggu Selanjutnya*, *Minggu Sebelumnya*, dan *Lompat Tanggal*).
   - Indikator status warna: Putih (Kosong), Kuning/Orange (1 Agenda), dan Merah (2+ Agenda).

5. **Kelola Ruangan & Layout**:
   - Penyesuaian nama dan kapasitas maksimal ruangan.
   - Pendaftaran ruangan baru hasil renovasi/ekspansi gedung.
   - Pendaftaran tipe layout baru (*Boardroom, Round Table, Banquet, dll.*).

---

## 🛠️ Stack Teknologi
Aplikasi ini menyediakan 2 versi implementasi yang saling tersinkronisasi:
1. **Frontend Web SPA**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
2. **Backend / Desktop Script**: Python 3, Streamlit, Pandas, SQLite (`learning_center_rooms.db`).

---

## 🚀 Cara Menjalankan

### Versi 1: Web React (Vite)
```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev

# 3. Build untuk produksi
npm run build
```

### Versi 2: Python Streamlit
```bash
# 1. Install library Python
pip install -r requirements.txt

# 2. Jalankan aplikasi Streamlit
streamlit run app.py
```

---

## 🌐 Cara Publish & Deploy ke Cloud (Gratis)

### 1. Deploy Versi Web (React) via Vercel / Netlify
1. Hubungkan akun GitHub Anda ke [Vercel](https://vercel.com) atau [Netlify](https://netlify.com).
2. Pilih repository GitHub ini.
3. Klik **Deploy** (Pengaturan build Vite otomatis terdeteksi: `npm run build`, output: `dist`).

### 2. Deploy Versi Python via Streamlit Community Cloud
1. Masuk ke [share.streamlit.io](https://share.streamlit.io/) dengan akun GitHub Anda.
2. Klik **New app**.
3. Pilih repository ini dan arahkan file utama ke `app.py`.
4. Klik **Deploy!** Aplikasi langsung online dan dapat diakses publik.
