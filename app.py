"""
Sistem Manajemen Peminjaman Ruangan Gedung Learning Center
Framework: Streamlit & SQLite
Dibuat oleh: Senior Python Developer
Fitur Lengkap: Booking, Anti-Bentrok, Timeline Mingguan, Kelola Ruangan & Kapasitas, Tambah Layout Baru
"""

import sqlite3
from datetime import datetime, time, date, timedelta
import pandas as pd
import streamlit as st

# ==========================================
# 1. KONFIGURASI HALAMAN STREAMLIT
# ==========================================
st.set_page_config(
    page_title="Peminjaman Ruangan - Learning Center",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS untuk tampilan modern, bersih, bertema Merah, Orange, Hitam & Putih
st.markdown("""
<style>
    .main-header {
        font-size: 1.85rem;
        font-weight: 700;
        color: #dc2626;
        margin-bottom: 0.25rem;
    }
    .sub-header {
        font-size: 0.95rem;
        color: #52525b;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #ffffff;
        border: 1px solid #e4e4e7;
        border-top: 3px solid #dc2626;
        border-radius: 10px;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .stButton>button {
        border-radius: 8px;
        font-weight: 700;
        transition: all 0.2s ease;
    }
    .dataframe {
        font-size: 0.9rem !important;
    }
</style>
""", unsafe_allow_html=True)

DB_PATH = "learning_center_rooms.db"

# ==========================================
# 2. INISIALISASI & FUNGSI DATABASE (SQLITE)
# ==========================================
def get_db_connection():
    """Membuka koneksi ke database SQLite."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inisialisasi tabel bookings, rooms, dan layouts jika belum ada."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Tabel Bookings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_name TEXT NOT NULL,
                floor INTEGER NOT NULL,
                booking_date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                booker_name TEXT NOT NULL,
                work_unit TEXT NOT NULL,
                room_layout TEXT NOT NULL DEFAULT 'Classroom',
                event_name TEXT NOT NULL,
                participant_count INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Migrasi kolom bookings jika belum ada
        cursor.execute("PRAGMA table_info(bookings)")
        columns = [row[1] for row in cursor.fetchall()]
        if "work_unit" not in columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN work_unit TEXT DEFAULT ''")
        if "room_layout" not in columns:
            cursor.execute("ALTER TABLE bookings ADD COLUMN room_layout TEXT DEFAULT 'Classroom'")

        # 2. Tabel Rooms (Master Ruangan & Kapasitas Dinamis)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                floor INTEGER NOT NULL,
                capacity INTEGER NOT NULL DEFAULT 20,
                description TEXT DEFAULT ''
            )
        """)

        # Seed data awal rooms jika tabel masih kosong
        cursor.execute("SELECT COUNT(*) FROM rooms")
        if cursor.fetchone()[0] == 0:
            initial_rooms = [
                ("Think Room", 2, 20, "Ruang diskusi intensif, perumusan ide, dan brainstorming tim inovasi."),
                ("Big Room", 2, 20, "Ruang pelatihan utama dengan tata ruang fleksibel untuk workshop dan presentasi."),
                ("Competent Room", 3, 20, "Ruang sertifikasi kompetensi, pelatihan asesmen, dan uji keterampilan profesional."),
                ("People Room", 3, 20, "Ruang pelatihan interpersonal skill, sesi coaching, dan pelatihan human capital."),
                ("Great Room", 3, 20, "Ruang seminar eksekutif, rapat koordinasi pimpinan, dan briefing strategis."),
                ("Character Room", 3, 20, "Ruang pembinaan budaya kerja, program orientasi pegawai, dan focus group.")
            ]
            cursor.executemany("INSERT INTO rooms (name, floor, capacity, description) VALUES (?, ?, ?, ?)", initial_rooms)

        # 3. Tabel Layouts (Master Layout Dinamis)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS layouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT DEFAULT ''
            )
        """)

        # Seed data awal layouts jika tabel masih kosong
        cursor.execute("SELECT COUNT(*) FROM layouts")
        if cursor.fetchone()[0] == 0:
            initial_layouts = [
                ("Classroom", "Meja dan kursi menghadap panggung/layar (cocok untuk materi teknis & ujian)"),
                ("U-Shape", "Meja melingkar tapal kuda (cocok untuk diskusi terbuka & workshop interaktif)"),
                ("Theater", "Susunan kursi tanpa meja menghadap panggung (kapasitas audiens maksimal)")
            ]
            cursor.executemany("INSERT INTO layouts (name, description) VALUES (?, ?)", initial_layouts)

        conn.commit()

# Helper queries master data
def get_all_rooms(floor_filter=None):
    """Mengambil daftar ruangan dari database."""
    with get_db_connection() as conn:
        if floor_filter:
            df = pd.read_sql_query("SELECT * FROM rooms WHERE floor = ? ORDER BY floor ASC, id ASC", conn, params=[int(floor_filter)])
        else:
            df = pd.read_sql_query("SELECT * FROM rooms ORDER BY floor ASC, id ASC", conn)
        return df

def get_all_layouts():
    """Mengambil daftar layout ruangan dari database."""
    with get_db_connection() as conn:
        df = pd.read_sql_query("SELECT * FROM layouts ORDER BY id ASC", conn)
        return df

def update_room(room_id, new_name, new_capacity, new_desc, cascade_to_bookings=True):
    """Mengedit nama ruangan, kapasitas, dan deskripsi."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM rooms WHERE id = ?", (room_id,))
        old_row = cursor.fetchone()
        if not old_row:
            return False, "Ruangan tidak ditemukan."
        old_name = old_row[0]

        cursor.execute("""
            UPDATE rooms 
            SET name = ?, capacity = ?, description = ? 
            WHERE id = ?
        """, (new_name, new_capacity, new_desc, room_id))

        if cascade_to_bookings and old_name != new_name:
            cursor.execute("UPDATE bookings SET room_name = ? WHERE room_name = ?", (new_name, old_name))

        conn.commit()
        return True, f"Ruangan '{new_name}' (Kapasitas: {new_capacity} orang) berhasil diperbarui."

def add_new_room(name, floor, capacity, description=""):
    """Menambahkan ruangan baru ke database (misal pasca renovasi gedung)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO rooms (name, floor, capacity, description) 
                VALUES (?, ?, ?, ?)
            """, (name, floor, capacity, description))
            conn.commit()
            return True, f"Ruangan baru '{name}' (Lantai {floor}, Kapasitas: {capacity} orang) berhasil didaftarkan!"
        except sqlite3.IntegrityError:
            return False, f"Ruangan dengan nama '{name}' sudah ada."

def add_new_layout(name, description=""):
    """Menambahkan layout baru ke database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO layouts (name, description) VALUES (?, ?)", (name, description))
            conn.commit()
            return True, f"Layout baru '{name}' berhasil didaftarkan."
        except sqlite3.IntegrityError:
            return False, f"Layout '{name}' sudah ada sebelumnya."

def delete_layout(layout_name):
    """Menghapus layout jika tidak sedang digunakan."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Cek apakah layout sedang digunakan di agenda booking
        cursor.execute("SELECT COUNT(*) FROM bookings WHERE room_layout = ?", (layout_name,))
        usage = cursor.fetchone()[0]
        if usage > 0:
            return False, f"Layout '{layout_name}' sedang digunakan pada {usage} agenda booking yang terdaftar. Hapus atau ubah agenda tersebut terlebih dahulu."

        cursor.execute("DELETE FROM layouts WHERE name = ?", (layout_name,))
        conn.commit()
        return True, f"Layout '{layout_name}' berhasil dihapus."

def get_room_names_list(room_name_or_list):
    """Memecah string atau list ruangan gabungan menjadi list nama ruangan individual."""
    if isinstance(room_name_or_list, list):
        return room_name_or_list
    if not room_name_or_list:
        return []
    return [r.strip() for r in str(room_name_or_list).split("+") if r.strip()]

def check_collision(room_names, booking_date: str, start_time: str, end_time: str, exclude_id: int = None):
    """Validasi bentrok (Overlapping Collision Detection) untuk 1 atau beberapa ruangan gabungan."""
    target_rooms = get_room_names_list(room_names)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT id, room_name, booker_name, work_unit, room_layout, event_name, start_time, end_time
            FROM bookings
            WHERE booking_date = ?
              AND (? < end_time AND ? > start_time)
        """
        params = [booking_date, start_time, end_time]
        if exclude_id is not None:
            query += " AND id != ?"
            params.append(exclude_id)
            
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        conflicts = []
        for row in rows:
            existing_rooms = get_room_names_list(row["room_name"])
            if any(r in existing_rooms for r in target_rooms):
                conflicts.append(row)
        return conflicts

def insert_booking(room_name: str, floor: int, booking_date: str, start_time: str, end_time: str, booker_name: str, work_unit: str, room_layout: str, event_name: str, participant_count: int):
    """Menyimpan data peminjaman baru ke database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO bookings (room_name, floor, booking_date, start_time, end_time, booker_name, work_unit, room_layout, event_name, participant_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (room_name, floor, booking_date, start_time, end_time, booker_name, work_unit, room_layout, event_name, participant_count))
        conn.commit()
        return cursor.lastrowid

def delete_booking(booking_id: int):
    """Menghapus peminjaman berdasarkan ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
        conn.commit()

def fetch_bookings(filter_date=None, filter_room=None, filter_floor=None, filter_layout=None):
    """Mengambil daftar jadwal peminjaman dengan filter fleksibel."""
    with get_db_connection() as conn:
        query = "SELECT * FROM bookings WHERE 1=1"
        params = []
        if filter_date:
            query += " AND booking_date = ?"
            params.append(str(filter_date))
        if filter_room and filter_room != "Semua Ruangan":
            query += " AND (room_name = ? OR room_name LIKE ?)"
            params.extend([filter_room, f"%{filter_room}%"])
        if filter_floor and filter_floor != "Semua Lantai":
            query += " AND floor = ?"
            params.append(int(filter_floor))
        if filter_layout and filter_layout != "Semua Layout":
            query += " AND room_layout = ?"
            params.append(filter_layout)
            
        query += " ORDER BY booking_date ASC, start_time ASC"
        df = pd.read_sql_query(query, conn, params=params)
        return df

# Jalankan inisialisasi tabel saat pertama kali modul dimuat
init_db()

# ==========================================
# 3. SIDEBAR NAVIGASI
# ==========================================
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80", use_container_width=True)
    st.title("Gedung Learning Center")
    st.caption("Sistem Peminjaman Ruangan Terpadu")
    st.divider()

    menu = st.radio(
        "Pilih Menu Navigasi:",
        options=[
            "📅 Jadwal & Dashboard", 
            "📝 Booking Ruangan Baru", 
            "📊 Timeline Ketersediaan", 
            "⚙️ Kelola Ruangan & Layout",
            "ℹ️ Informasi Ruangan"
        ],
        index=0
    )
    
    st.divider()
    st.info("""
    **Ketentuan Reservasi:**
    - Kapasitas ruangan dapat dikonfigurasi melalui menu **Kelola Ruangan**.
    - Pilihan layout dapat ditambah sesuai kebutuhan acara.
    - Jam operasional: **07:30 - 18:00 WIB**.
    """)

# ==========================================
# 4. HALAMAN 1: DASHBOARD & JADWAL
# ==========================================
if menu == "📅 Jadwal & Dashboard":
    st.markdown('<div class="main-header">Jadwal Peminjaman Ruangan</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Pantau status penggunaan ruangan di Lantai 2 dan Lantai 3 secara real-time.</div>', unsafe_allow_html=True)

    df_rooms_all = get_all_rooms()
    df_layouts_all = get_all_layouts()

    # Filter pencarian 4 kolom (Tanggal, Lantai, Ruangan, Layout)
    col_f1, col_f2, col_f3, col_f4 = st.columns([1.3, 1.1, 1.3, 1.3])
    with col_f1:
        use_date_filter = st.checkbox("Filter Berdasarkan Tanggal", value=False)
        selected_date = st.date_input("Pilih Tanggal Kegiatan", value=date.today()) if use_date_filter else None
    
    with col_f2:
        floor_options = ["Semua Lantai", "2", "3"]
        selected_floor = st.selectbox("Filter Lantai", options=floor_options)
        
    with col_f3:
        if selected_floor == "Semua Lantai":
            room_options = ["Semua Ruangan"] + df_rooms_all["name"].tolist()
        else:
            room_options = ["Semua Ruangan"] + df_rooms_all[df_rooms_all["floor"] == int(selected_floor)]["name"].tolist()
        selected_room = st.selectbox("Filter Ruangan", options=room_options)

    with col_f4:
        layout_options = ["Semua Layout"] + df_layouts_all["name"].tolist()
        selected_layout = st.selectbox("Filter Layout", options=layout_options)

    # Mengambil data peminjaman
    df_bookings = fetch_bookings(
        filter_date=selected_date if use_date_filter else None,
        filter_room=selected_room,
        filter_floor=selected_floor,
        filter_layout=selected_layout
    )

    # Ringkasan KPI singkat
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Total Agenda Terdaftar", f"{len(df_bookings)} Kegiatan")
    with m2:
        hari_ini_count = len(fetch_bookings(filter_date=date.today()))
        st.metric("Agenda Hari Ini", f"{hari_ini_count} Kegiatan")
    with m3:
        st.metric("Total Ruangan", f"{len(df_rooms_all)} Ruang")
    with m4:
        st.metric("Pilihan Layout", f"{len(df_layouts_all)} Jenis Layout")

    st.write("")

    if df_bookings.empty:
        st.info("ℹ️ Belum ada jadwal peminjaman yang cocok dengan kriteria filter yang dipilih.")
    else:
        # Tampilkan tabel utama
        display_df = df_bookings.copy()
        display_df.rename(columns={
            "id": "ID",
            "room_name": "Ruangan",
            "floor": "Lantai",
            "booking_date": "Tanggal",
            "start_time": "Mulai",
            "end_time": "Selesai",
            "booker_name": "Peminjam",
            "work_unit": "Unit Kerja",
            "room_layout": "Layout Ruangan",
            "event_name": "Nama Kegiatan",
            "participant_count": "Peserta"
        }, inplace=True)

        cols_to_show = ["ID", "Ruangan", "Lantai", "Tanggal", "Mulai", "Selesai", "Peminjam", "Unit Kerja", "Layout Ruangan", "Nama Kegiatan", "Peserta"]
        st.dataframe(display_df[cols_to_show], use_container_width=True, hide_index=True)

        # Opsi Ekspor CSV
        csv_data = display_df[cols_to_show].to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Unduh Data Jadwal (CSV)",
            data=csv_data,
            file_name=f"jadwal_ruangan_{date.today().strftime('%Y%m%d')}.csv",
            mime="text/csv",
            help="Klik untuk mengekspor jadwal saat ini ke file CSV."
        )

        st.divider()

        # Mekanisme Pembatalan / Hapus Jadwal
        st.subheader("🗑️ Batalkan / Hapus Peminjaman")
        st.caption("Jika suatu kegiatan dibatalkan, silakan pilih ID peminjaman di bawah ini untuk menghapusnya dari sistem.")
        
        col_del1, col_del2 = st.columns([3, 1])
        with col_del1:
            booking_options = {
                row["ID"]: f"ID #{row['ID']} - {row['Ruangan']} ({row['Tanggal']} {row['Mulai']}-{row['Selesai']}) | {row['Nama Kegiatan']} oleh {row['Peminjam']} [{row['Unit Kerja']}] (Layout: {row.get('Layout Ruangan', 'Classroom')})"
                for _, row in display_df.iterrows()
            }
            selected_del_id = st.selectbox(
                "Pilih Jadwal yang Ingin Dibatalkan:",
                options=list(booking_options.keys()),
                format_func=lambda x: booking_options[x]
            )
        with col_del2:
            st.write("")
            st.write("")
            if st.button("Hapus Jadwal", type="primary"):
                delete_booking(selected_del_id)
                st.success(f"✅ Jadwal peminjaman ID #{selected_del_id} berhasil dibatalkan dan dihapus.")
                st.rerun()

# ==========================================
# 5. HALAMAN 2: FORM BOOKING RUANGAN BARU
# ==========================================
elif menu == "📝 Booking Ruangan Baru":
    st.markdown('<div class="main-header">Formulir Peminjaman Ruangan</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Silakan isi detail kegiatan untuk melakukan reservasi ruangan di Gedung Learning Center.</div>', unsafe_allow_html=True)

    df_rooms = get_all_rooms()
    df_layouts = get_all_layouts()

    with st.form(key="form_booking", clear_on_submit=False):
        st.subheader("1. Pemilihan Lokasi & Ruangan")
        st.caption("💡 Gedung Learning Center memiliki partisi fleksibel. Anda dapat memilih 2 atau lebih ruangan di lantai yang sama untuk digabungkan.")
        col_r1, col_r2 = st.columns([1, 2])
        with col_r1:
            pilih_lantai = st.selectbox("Pilih Lantai Gedung:", options=[2, 3], format_func=lambda x: f"Lantai {x}")
        
        with col_r2:
            rooms_on_floor = df_rooms[df_rooms["floor"] == pilih_lantai]
            ruangan_tersedia = rooms_on_floor["name"].tolist()
            pilih_ruangan = st.multiselect(
                "Pilih Ruangan di Lantai Ini (Bisa pilih 2 atau lebih untuk digabungkan):", 
                options=ruangan_tersedia,
                default=[ruangan_tersedia[0]] if ruangan_tersedia else []
            )

        # Hitung kapasitas gabungan dinamis
        if not pilih_ruangan:
            st.warning("⚠️ Silakan pilih minimal satu ruangan.")
            total_room_capacity = 20
            combined_room_name = ""
        else:
            selected_rooms_df = rooms_on_floor[rooms_on_floor["name"].isin(pilih_ruangan)]
            total_room_capacity = int(selected_rooms_df["capacity"].sum())
            combined_room_name = " + ".join(pilih_ruangan)

            if len(pilih_ruangan) > 1:
                st.info(f"🔗 **Mode Ruangan Gabungan Aktif (Partisi Dibuka):** Menggabungkan **{len(pilih_ruangan)} ruangan** ({combined_room_name}) dengan Total Kapasitas: **{total_room_capacity} orang**.")
            else:
                room_row = selected_rooms_df.iloc[0]
                st.caption(f"📌 **Info Ruangan:** {combined_room_name} (Lantai {room_row['floor']}) — Kapasitas Maksimal: **{total_room_capacity} orang** | {room_row['description']}.")

        st.divider()
        st.subheader("2. Waktu Pelaksanaan")
        col_t1, col_t2, col_t3 = st.columns(3)
        with col_t1:
            input_tanggal = st.date_input("Tanggal Booking:", value=date.today(), min_value=date.today())
        with col_t2:
            input_jam_mulai = st.time_input("Jam Mulai:", value=time(9, 0), step=900)
        with col_t3:
            input_jam_selesai = st.time_input("Jam Selesai:", value=time(11, 0), step=900)

        st.divider()
        st.subheader("3. Data Pemohon & Agenda Acara")
        col_d1, col_d2, col_d3 = st.columns([1.5, 1.5, 1.2])
        with col_d1:
            input_nama_peminjam = st.text_input("Nama Lengkap Peminjam:", placeholder="Contoh: Budi Santoso")
        with col_d2:
            input_unit_kerja = st.text_input("Unit Kerja / Divisi:", placeholder="Contoh: Divisi HRD / Departemen IT")
        with col_d3:
            list_layout_names = df_layouts["name"].tolist()
            input_layout = st.selectbox(
                "Layout Ruangan:",
                options=list_layout_names
            )

        col_d4, col_d5 = st.columns([1, 2])
        with col_d4:
            input_jumlah_peserta = st.number_input(
                f"Jumlah Peserta (Maks {total_room_capacity} Orang):", 
                min_value=1, 
                max_value=max(200, total_room_capacity), 
                value=min(10, total_room_capacity), 
                step=1
            )
        with col_d5:
            input_nama_agenda = st.text_input("Nama Agenda Kegiatan:", placeholder="Contoh: Workshop Leadership & AI Transformation")

        st.caption(f"ℹ️ **Kapasitas Terbuka:** {combined_room_name or 'Ruangan terpilih'} memiliki batas maksimal **{total_room_capacity} orang**.")

        submit_btn = st.form_submit_button("Simpan & Konfirmasi Booking", type="primary", use_container_width=True)

    if submit_btn:
        # VALIDASI INPUT
        errors = []

        if not pilih_ruangan:
            errors.append("Silakan pilih minimal 1 ruangan.")
        if not input_nama_peminjam.strip():
            errors.append("Nama peminjam wajib diisi.")
        if not input_unit_kerja.strip():
            errors.append("Unit kerja / divisi peminjam wajib diisi.")
        if not input_nama_agenda.strip():
            errors.append("Nama agenda kegiatan wajib diisi.")

        # Validasi Kapasitas Dinamis Ruangan Gabungan
        if input_jumlah_peserta > total_room_capacity:
            errors.append(f"Jumlah peserta ({input_jumlah_peserta} orang) melebihi kapasitas maksimal {combined_room_name} ({total_room_capacity} orang).")

        # Validasi Rentang Jam
        str_mulai = input_jam_mulai.strftime("%H:%M")
        str_selesai = input_jam_selesai.strftime("%H:%M")
        str_tanggal = input_tanggal.strftime("%Y-%m-%d")

        if input_jam_mulai >= input_jam_selesai:
            errors.append(f"Jam selesai ({str_selesai}) harus lebih besar daripada jam mulai ({str_mulai}).")

        # Periksa BENTROK JADWAL di Database
        if not errors:
            bentrok = check_collision(
                room_names=pilih_ruangan,
                booking_date=str_tanggal,
                start_time=str_mulai,
                end_time=str_selesai
            )

            if bentrok:
                detail_bentrok = ", ".join([f"'{b['event_name']}' di {b['room_name']} oleh {b['booker_name']} [{b['work_unit']}] ({b['start_time']} - {b['end_time']})" for b in bentrok])
                errors.append(
                    f"⛔ JADWAL BENTROK: Ruangan {combined_room_name} (atau salah satu bagian dari ruangan yang digabungkan) sudah dibooking pada tanggal {str_tanggal} untuk kegiatan {detail_bentrok}. Silakan pilih jam atau ruangan lain."
                )

        if errors:
            for err in errors:
                st.error(err)
        else:
            new_id = insert_booking(
                room_name=combined_room_name,
                floor=pilih_lantai,
                booking_date=str_tanggal,
                start_time=str_mulai,
                end_time=str_selesai,
                booker_name=input_nama_peminjam.strip(),
                work_unit=input_unit_kerja.strip(),
                room_layout=input_layout,
                event_name=input_nama_agenda.strip(),
                participant_count=int(input_jumlah_peserta)
            )
            st.success(f"🎉 Peminjaman Ruangan Berhasil Didaftarkan! (Nomor Booking: #{new_id})")
            
            # Kartu Konfirmasi Digital
            is_combined_pass = len(pilih_ruangan) > 1
            combined_tag = '<p style="margin: 4px 0; color: #ea580c;"><strong>Status:</strong> 🔗 Ruangan Gabungan (Partisi Dibuka)</p>' if is_combined_pass else ''
            st.markdown(f"""
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-top: 12px;">
                <h4 style="color: #166534; margin: 0 0 8px 0;">Bukti Peminjaman Ruangan (Digital Pass)</h4>
                <p style="margin: 4px 0; color: #1e293b;"><strong>ID Booking:</strong> #{new_id}</p>
                <p style="margin: 4px 0; color: #1e293b;"><strong>Ruangan:</strong> {combined_room_name} (Lantai {pilih_lantai})</p>
                {combined_tag}
                <p style="margin: 4px 0; color: #1e293b;"><strong>Waktu:</strong> {str_tanggal} | {str_mulai} - {str_selesai} WIB</p>
                <p style="margin: 4px 0; color: #1e293b;"><strong>Agenda:</strong> {input_nama_agenda}</p>
                <p style="margin: 4px 0; color: #1e293b;"><strong>Peminjam:</strong> {input_nama_peminjam}</p>
                <p style="margin: 4px 0; color: #1e293b;"><strong>Unit Kerja:</strong> {input_unit_kerja}</p>
                <p style="margin: 4px 0; color: #1e293b;"><strong>Layout Ruangan:</strong> {input_layout}</p>
                <p style="margin: 4px 0; color: #1e293b;"><strong>Peserta:</strong> {input_jumlah_peserta} orang (Total Kapasitas: {total_room_capacity})</p>
            </div>
            """, unsafe_allow_html=True)
            st.info("💡 Anda dapat melihat jadwal ini di menu **Jadwal & Dashboard**.")

# ==========================================
# 6. HALAMAN 3: VISUAL TIMELINE KETERSEDIAAN (MINGGUAN)
# ==========================================
elif menu == "📊 Timeline Ketersediaan":
    st.markdown('<div class="main-header">Timeline Ketersediaan Mingguan</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Peta visual ketersediaan ruangan disajikan per minggu penuh (Senin s.d. Minggu). Gunakan tombol untuk berpindah ke minggu selanjutnya atau sebelumnya.</div>', unsafe_allow_html=True)

    if "timeline_week_offset" not in st.session_state:
        st.session_state.timeline_week_offset = 0

    col_nav1, col_nav2, col_nav3 = st.columns([1.5, 1.2, 1.8])
    with col_nav1:
        if st.button("⬅ Minggu Sebelumnya", use_container_width=True):
            st.session_state.timeline_week_offset -= 1
            st.rerun()
    with col_nav2:
        is_current_week = (st.session_state.timeline_week_offset == 0)
        if st.button("🔄 Minggu Ini", use_container_width=True, disabled=is_current_week):
            st.session_state.timeline_week_offset = 0
            st.rerun()
    with col_nav3:
        if st.button("Minggu Selanjutnya ➡", type="primary", use_container_width=True):
            st.session_state.timeline_week_offset += 1
            st.rerun()

    today = date.today()
    this_monday = today - timedelta(days=today.weekday())
    start_of_week = this_monday + timedelta(weeks=st.session_state.timeline_week_offset)
    end_of_week = start_of_week + timedelta(days=6)

    days = [start_of_week + timedelta(days=i) for i in range(7)]
    
    nama_hari_id = {"Mon": "Senin", "Tue": "Selasa", "Wed": "Rabu", "Thu": "Kamis", "Fri": "Jumat", "Sat": "Sabtu", "Sun": "Minggu"}
    str_periode = f"{nama_hari_id.get(start_of_week.strftime('%a'), start_of_week.strftime('%a'))}, {start_of_week.strftime('%d %b %Y')} s.d. {nama_hari_id.get(end_of_week.strftime('%a'), end_of_week.strftime('%a'))}, {end_of_week.strftime('%d %b %Y')}"
    
    st.info(f"📅 **Periode 1 Minggu Aktif:** {str_periode} ({'Minggu Berjalan' if is_current_week else f'Offset: {st.session_state.timeline_week_offset:+d} Minggu'})")

    with get_db_connection() as conn:
        min_date = days[0].strftime("%Y-%m-%d")
        max_date = days[-1].strftime("%Y-%m-%d")
        query = "SELECT * FROM bookings WHERE booking_date BETWEEN ? AND ? ORDER BY booking_date ASC, start_time ASC"
        df_range = pd.read_sql_query(query, conn, params=[min_date, max_date])

    st.markdown("""
    <div style="display: flex; gap: 20px; align-items: center; margin: 10px 0 16px 0; font-size: 0.88rem;">
        <span><span style="display:inline-block; width:12px; height:12px; background-color:#22c55e; border-radius:3px;"></span> <strong>🟢 Kosong</strong>: Bebas seharian</span>
        <span><span style="display:inline-block; width:12px; height:12px; background-color:#f59e0b; border-radius:3px;"></span> <strong>🟡 1 Agenda</strong>: Terisi sebagian</span>
        <span><span style="display:inline-block; width:12px; height:12px; background-color:#ef4444; border-radius:3px;"></span> <strong>🔴 Padat</strong>: Terisi 2+ agenda</span>
    </div>
    """, unsafe_allow_html=True)

    df_rooms_timeline = get_all_rooms()

    for f in [2, 3]:
        st.markdown(f"#### 🏢 Lantai {f}")
        rooms_in_floor = df_rooms_timeline[df_rooms_timeline["floor"] == f]
        
        matrix_data = []
        for _, r in rooms_in_floor.iterrows():
            row_dict = {"Ruangan": f"{r['name']} (Maks {r['capacity']})"}
            for d in days:
                d_str = d.strftime("%Y-%m-%d")
                day_label = nama_hari_id.get(d.strftime("%a"), d.strftime("%a"))
                col_name = f"{day_label}, {d.strftime('%d %b')}"
                
                if not df_range.empty:
                    day_r_bookings = df_range[
                        (df_range["booking_date"] == d_str) & 
                        (df_range["room_name"].apply(lambda rn: r["name"] in [x.strip() for x in str(rn).split("+")]))
                    ]
                else:
                    day_r_bookings = pd.DataFrame()
                
                count = len(day_r_bookings)
                if count == 0:
                    row_dict[col_name] = "🟢 Kosong"
                elif count == 1:
                    b_row = day_r_bookings.iloc[0]
                    layout_val = b_row['room_layout'] if 'room_layout' in b_row else 'Classroom'
                    row_dict[col_name] = f"🟡 1 Agenda ({b_row['start_time']}-{b_row['end_time']} | {layout_val})"
                else:
                    row_dict[col_name] = f"🔴 {count} Agenda"
                    
            matrix_data.append(row_dict)
            
        df_matrix = pd.DataFrame(matrix_data)
        st.dataframe(df_matrix, use_container_width=True, hide_index=True)

# ==========================================
# 7. HALAMAN 4: KELOLA RUANGAN & LAYOUT (FITUR BARU)
# ==========================================
elif menu == "⚙️ Kelola Ruangan & Layout":
    st.markdown('<div class="main-header">Kelola Ruangan & Layout Gedung</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Ubah nama ruangan, sesuaikan kapasitas maksimal peserta, dan daftarkan tipe layout baru sesuai kebutuhan Learning Center.</div>', unsafe_allow_html=True)

    tab_rooms, tab_layouts = st.tabs(["🏢 1. Edit Nama Ruangan & Kapasitas", "📐 2. Tambah & Kelola Layout Baru"])

    # TAB 1: EDIT RUANGAN & KAPASITAS
    with tab_rooms:
        df_all_rooms = get_all_rooms()
        st.subheader("Edit Spesifikasi Ruangan")
        
        col_sel_room, col_edit_form = st.columns([1.5, 2.5])
        with col_sel_room:
            st.markdown("**Pilih Ruangan yang Ingin Diedit:**")
            room_choice_dict = {
                r["id"]: f"Lantai {r['floor']} — {r['name']} (Maks {r['capacity']} org)"
                for _, r in df_all_rooms.iterrows()
            }
            selected_room_id = st.radio(
                "Daftar Ruangan:",
                options=list(room_choice_dict.keys()),
                format_func=lambda x: room_choice_dict[x]
            )

            st.divider()

            # TAMBAHKAN RUANGAN BARU (Di bawah pilihan ruangan)
            st.markdown("#### ➕ Tambahkan Ruangan Baru")
            st.caption("Daftarkan ruangan tambahan hasil renovasi gedung atau ekspansi fasilitas.")
            with st.form(key="form_add_new_room"):
                input_new_room_name = st.text_input("Nama Ruangan Baru:", placeholder="Contoh: Innovation Studio / Podcast Hub")
                col_fl, col_cap = st.columns(2)
                with col_fl:
                    input_new_room_floor = st.selectbox("Lantai:", options=[2, 3], format_func=lambda x: f"Lantai {x}")
                with col_cap:
                    input_new_room_cap = st.number_input("Kapasitas Maksimal:", min_value=1, max_value=200, value=20, step=1)
                input_new_room_desc = st.text_area("Fungsi / Deskripsi Ruangan:", placeholder="Contoh: Ruang kolaborasi terpadu & multimedia...")
                submit_add_room = st.form_submit_button("Daftarkan Ruangan Baru", type="primary", use_container_width=True)

            if submit_add_room:
                if not input_new_room_name.strip():
                    st.error("Nama ruangan baru tidak boleh kosong.")
                else:
                    success, msg = add_new_room(
                        input_new_room_name.strip(),
                        int(input_new_room_floor),
                        int(input_new_room_cap),
                        input_new_room_desc.strip()
                    )
                    if success:
                        st.success(msg)
                        st.rerun()
                    else:
                        st.error(msg)

        selected_room_row = df_all_rooms[df_all_rooms["id"] == selected_room_id].iloc[0]

        with col_edit_form:
            with st.form(key=f"edit_room_form_{selected_room_id}"):
                st.markdown(f"#### Konfigurasi: **{selected_room_row['name']}** (Lantai {selected_room_row['floor']})")
                
                new_room_name = st.text_input("Nama Ruangan:", value=selected_room_row["name"])
                new_capacity = st.number_input(
                    "Kapasitas Maksimal Peserta (Orang):", 
                    min_value=1, 
                    max_value=200, 
                    value=int(selected_room_row["capacity"]), 
                    step=1
                )
                new_description = st.text_area("Deskripsi / Fungsi Ruangan:", value=selected_room_row["description"], rows=3)
                
                cascade_check = st.checkbox(
                    "Otomatis perbarui nama pada seluruh jadwal peminjaman yang sudah terdaftar", 
                    value=True,
                    help="Jika dicentang, agenda yang sebelumnya menggunakan nama lama akan diperbarui ke nama baru."
                )

                save_room_btn = st.form_submit_button("Simpan Perubahan Ruangan", type="primary")

            if save_room_btn:
                if not new_room_name.strip():
                    st.error("Nama ruangan tidak boleh kosong.")
                else:
                    success, msg = update_room(
                        selected_room_id, 
                        new_room_name.strip(), 
                        int(new_capacity), 
                        new_description.strip(),
                        cascade_to_bookings=cascade_check
                    )
                    if success:
                        st.success(msg)
                        st.rerun()
                    else:
                        st.error(msg)

    # TAB 2: TAMBAH & KELOLA LAYOUT BARU
    with tab_layouts:
        st.subheader("Daftar & Penambahan Layout Ruangan")
        col_lay_form, col_lay_list = st.columns([1.5, 2])

        with col_lay_form:
            st.markdown("#### ➕ Tambah Layout Baru")
            with st.form(key="form_add_layout"):
                new_layout_name = st.text_input("Nama Layout Baru:", placeholder="Contoh: Boardroom / Banquet / Round Table")
                new_layout_desc = st.text_area("Deskripsi / Peruntukan:", placeholder="Contoh: Meja rapat besar tunggal di tengah untuk rapat pimpinan...")
                submit_layout = st.form_submit_button("Tambahkan Layout", type="primary", use_container_width=True)

            if submit_layout:
                if not new_layout_name.strip():
                    st.error("Nama layout tidak boleh kosong.")
                else:
                    success, msg = add_new_layout(new_layout_name.strip(), new_layout_desc.strip())
                    if success:
                        st.success(msg)
                        st.rerun()
                    else:
                        st.error(msg)

        with col_lay_list:
            st.markdown("#### 📋 Layout Terdaftar Saat Ini")
            df_curr_layouts = get_all_layouts()
            for _, lay in df_curr_layouts.iterrows():
                with st.container():
                    st.markdown(f"**📐 {lay['name']}**")
                    if lay["description"]:
                        st.caption(lay["description"])
                    st.divider()

# ==========================================
# 8. HALAMAN 5: INFORMASI RUANGAN (MASTER DATA)
# ==========================================
elif menu == "ℹ️ Informasi Ruangan":
    st.markdown('<div class="main-header">Master Data Ruangan Gedung Learning Center</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Daftar lengkap kapasitas dan fasilitas ruangan pelatihan per lantai.</div>', unsafe_allow_html=True)

    df_info_rooms = get_all_rooms()
    df_info_layouts = get_all_layouts()

    layout_names_str = ", ".join(df_info_layouts["name"].tolist())

    col_l2, col_l3 = st.columns(2)
    with col_l2:
        st.subheader("🏢 Lantai 2")
        for _, room in df_info_rooms[df_info_rooms["floor"] == 2].iterrows():
            st.markdown(f"""
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:12px;">
                <h4 style="margin:0 0 4px 0; color:#dc2626;">{room['name']}</h4>
                <p style="margin:2px 0; font-size:0.9rem; color:#475569;">Kapasitas Maksimal: <strong>{room['capacity']} Orang</strong></p>
                <p style="margin:2px 0; font-size:0.85rem; color:#64748b;">Fungsi: {room['description']}</p>
                <p style="margin:2px 0; font-size:0.8rem; color:#0284c7;">Layout yang Didukung: {layout_names_str}</p>
            </div>
            """, unsafe_allow_html=True)

    with col_l3:
        st.subheader("🏢 Lantai 3")
        for _, room in df_info_rooms[df_info_rooms["floor"] == 3].iterrows():
            st.markdown(f"""
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:12px;">
                <h4 style="margin:0 0 4px 0; color:#dc2626;">{room['name']}</h4>
                <p style="margin:2px 0; font-size:0.9rem; color:#475569;">Kapasitas Maksimal: <strong>{room['capacity']} Orang</strong></p>
                <p style="margin:2px 0; font-size:0.85rem; color:#64748b;">Fungsi: {room['description']}</p>
                <p style="margin:2px 0; font-size:0.8rem; color:#0284c7;">Layout yang Didukung: {layout_names_str}</p>
            </div>
            """, unsafe_allow_html=True)

# Footer catatan developer
st.markdown("---")
st.caption("Sistem Manajemen Peminjaman Ruangan Gedung Learning Center | Python Streamlit & SQLite")
