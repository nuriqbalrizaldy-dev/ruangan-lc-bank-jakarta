# Learning Center Bank Jakarta — Sistem Peminjaman Ruangan

Aplikasi web modern untuk manajemen reservasi dan peminjaman ruangan pelatihan di Gedung Learning Center Bank Jakarta (Lantai 2 & Lantai 3). 

---

## 🌟 Fitur Utama
1. **Jadwal & Dashboard Real-Time**:
   - Ringkasan KPI: **Agenda Hari Ini**, **Agenda Besok**, dan **Ruangan Kosong/Available**.
   - Pemisahan nama peminjam dan unit kerja/divisi secara rapi.
   - Filter pencarian multifaset (berdasarkan tanggal, lantai, ruangan, dan layout).
   - Ekspor data jadwal ke format CSV.
   - Fitur pembatalan/penghapusan jadwal jika kegiatan batal.

2. **Booking Ruangan Fleksibel & Multi-Ruangan (Partisi Dibuka)**:
   - Mendukung pemilihan 1 atau beberapa ruangan sekaligus di lantai yang sama.
   - Kalkulasi otomatis total kapasitas kumulatif (contoh: *Think Room 20 + Big Room 20 = 40 orang*).
   - Pilihan layout ruangan: *Classroom*, *U-Shape*, *Theater*, dll.
   - Penerbitan Bukti Reservasi Digital (*Digital Booking Pass*) berlogo resmi Bank Jakarta lengkap dengan tombol salin.

3. **Proteksi Bentrok Jadwal (Collision Prevention)**:
   - Validasi bentrok otomatis: mencegah ruangan atau bagian dari ruangan gabungan dipesan pada jam yang bertubrukan.

4. **Timeline Ketersediaan Mingguan**:
   - Tampilan matriks mingguan (Senin s.d. Minggu).
   - Tombol navigasi (*Minggu Selanjutnya*, *Minggu Sebelumnya*, dan *Lompat Tanggal*).
   - Indikator ketersediaan ruangan per jam.

5. **Kelola Ruangan & Layout**:
   - Penyesuaian nama dan kapasitas maksimal ruangan.
   - Pendaftaran ruangan baru hasil renovasi/ekspansi gedung.
   - Pendaftaran tipe layout baru (*Boardroom, Round Table, Banquet, dll.*).

---

## 🚀 Panduan Publish ke GitHub & Vercel (Tampilan Persis Preview)

### Struktur File Penting:
- `src/` : Seluruh source code tampilan React, komponen, dan data.
- `public/assets/aistudio/` : Logo resmi Bank Jakarta.
- `index.html` : Entry point HTML dengan favicon Bank Jakarta.
- `package.json` : Daftar library (React 19, Tailwind CSS, Lucide Icons, Vite).
- `vercel.json` : Konfigurasi Vercel agar otomatis mendeteksi Vite & React.
- `.vercelignore` : Mencegah Vercel salah mendeteksi Python/Streamlit.
- `.npmrc` : Memastikan instalasi dependency di Vercel lancar tanpa konflik.

### Langkah Deploy di Vercel:
1. Push file proyek ini ke repositori GitHub Anda (`ruangan-lc-bank-jakarta`).
2. Buka dashboard [Vercel](https://vercel.com) dan pilih project Anda.
3. Vercel akan otomatis membaca file `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
4. Klik **Deploy** (atau Vercel akan otomatis melakukan redeploy jika terhubung ke branch `main`).
5. Web Anda akan online dengan tampilan yang **100% persis seperti di preview**!
