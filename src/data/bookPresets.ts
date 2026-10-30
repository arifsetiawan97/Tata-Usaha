import { LibraryBookItem, LibraryBookCategory, LibraryProcurementSource, LibraryMemberItem } from '../types';

export interface BookTemplatePreset {
  id: string;
  name: string;
  description: string;
  category: LibraryBookCategory;
  sumberPengadaan: LibraryProcurementSource;
  books: Array<{
    judul: string;
    penulis: string;
    penerbit: string;
    tahunTerbit: number;
    ddcKlasifikasi: string;
    kategoriBuku: LibraryBookCategory;
    jumlahDefault: number;
    hargaSatuanDefault?: number;
    lokasiRakDefault: string;
    isbnDefault?: string;
  }>;
}

export const BOOK_TEMPLATE_PRESETS: BookTemplatePreset[] = [
  {
    id: 'kurikulum-merdeka-kelas7',
    name: 'Paket Buku Teks Utama Kurikulum Merdeka (Kelas VII SMP)',
    description: 'Buku teks pelajaran wajib siswa Kurikulum Merdeka diterbitkan Kemendikbudristek untuk tahun ajaran baru.',
    category: 'Buku Teks Utama',
    sumberPengadaan: 'BOS Reguler',
    books: [
      {
        judul: 'Bahasa Indonesia: Nusantara Bertutur untuk SMP Kelas VII',
        penulis: 'Rakhma Subarna, dkk.',
        penerbit: 'Pusat Kurikulum dan Perbukuan Kemendikbudristek',
        tahunTerbit: 2024,
        ddcKlasifikasi: '410 - Bahasa Indonesia',
        kategoriBuku: 'Buku Teks Utama',
        jumlahDefault: 60,
        hargaSatuanDefault: 24500,
        lokasiRakDefault: 'Rak Teks Utama A1',
        isbnDefault: '978-602-244-300-1'
      },
      {
        judul: 'Matematika untuk Sekolah Menengah Pertama Kelas VII',
        penulis: 'Tim Gakko Tosho',
        penerbit: 'Pusat Kurikulum dan Perbukuan Kemendikbudristek',
        tahunTerbit: 2024,
        ddcKlasifikasi: '510 - Matematika',
        kategoriBuku: 'Buku Teks Utama',
        jumlahDefault: 60,
        hargaSatuanDefault: 26000,
        lokasiRakDefault: 'Rak Teks Utama A1',
        isbnDefault: '978-602-244-515-9'
      },
      {
        judul: 'Ilmu Pengetahuan Alam (IPA) untuk SMP Kelas VII',
        penulis: 'Victoriani Inabuy, dkk.',
        penerbit: 'Pusat Perbukuan Badan Standar, Kurikulum Kemdikbud',
        tahunTerbit: 2024,
        ddcKlasifikasi: '500 - Ilmu Alam / Sains',
        kategoriBuku: 'Buku Teks Utama',
        jumlahDefault: 60,
        hargaSatuanDefault: 27500,
        lokasiRakDefault: 'Rak Teks Utama A2',
        isbnDefault: '978-602-244-383-4'
      },
      {
        judul: 'Ilmu Pengetahuan Sosial (IPS) untuk SMP Kelas VII',
        penulis: 'M. Nursa\'ban, Supardi, dkk.',
        penerbit: 'Pusat Kurikulum dan Perbukuan Kemendikbudristek',
        tahunTerbit: 2024,
        ddcKlasifikasi: '300 - Ilmu Sosial',
        kategoriBuku: 'Buku Teks Utama',
        jumlahDefault: 60,
        hargaSatuanDefault: 25000,
        lokasiRakDefault: 'Rak Teks Utama A2',
        isbnDefault: '978-602-244-307-0'
      },
      {
        judul: 'Pendidikan Pancasila untuk SMP/MTs Kelas VII',
        penulis: 'Zaim Uchrowi, Ruslinawati',
        penerbit: 'Pusat Kurikulum dan Perbukuan Kemendikbudristek',
        tahunTerbit: 2024,
        ddcKlasifikasi: '320 - Ilmu Politik / Pancasila',
        kategoriBuku: 'Buku Teks Utama',
        jumlahDefault: 60,
        hargaSatuanDefault: 23000,
        lokasiRakDefault: 'Rak Teks Utama A3',
        isbnDefault: '978-602-244-311-7'
      },
      {
        judul: 'English for Nusantara untuk SMP/MTs Kelas VII',
        penulis: 'Ika Lestari Damayanti, dkk.',
        penerbit: 'Pusat Perbukuan Kemendikbudristek',
        tahunTerbit: 2024,
        ddcKlasifikasi: '420 - Bahasa Inggris',
        kategoriBuku: 'Buku Teks Utama',
        jumlahDefault: 60,
        hargaSatuanDefault: 25500,
        lokasiRakDefault: 'Rak Teks Utama A3',
        isbnDefault: '978-602-244-885-3'
      },
      {
        judul: 'Pendidikan Agama Islam dan Budi Pekerti SMP Kelas VII',
        penulis: 'Muhammad Ahsan, Sumiyati',
        penerbit: 'Pusat Kurikulum dan Perbukuan Kemendikbudristek',
        tahunTerbit: 2024,
        ddcKlasifikasi: '297 - Agama Islam',
        kategoriBuku: 'Agama & Budi Pekerti',
        jumlahDefault: 60,
        hargaSatuanDefault: 26000,
        lokasiRakDefault: 'Rak Teks Utama A4',
        isbnDefault: '978-602-244-313-1'
      }
    ]
  },
  {
    id: 'fiksi-literasi-siswa',
    name: 'Paket Bahan Bacaan Fiksi & Literasi Siswa (GLS)',
    description: 'Buku novel edukatif, cerita anak nusantara, dan bacaan pengayaan literasi 15 menit sebelum belajar.',
    category: 'Fiksi / Cerita',
    sumberPengadaan: 'BOS Reguler',
    books: [
      {
        judul: 'Laskar Pelangi (Edisi Khusus Remaja Pelajar)',
        penulis: 'Andrea Hirata',
        penerbit: 'Bentang Pustaka',
        tahunTerbit: 2023,
        ddcKlasifikasi: '813 - Novel Indonesia',
        kategoriBuku: 'Fiksi / Cerita',
        jumlahDefault: 15,
        hargaSatuanDefault: 75000,
        lokasiRakDefault: 'Rak Fiksi B1',
        isbnDefault: '978-602-291-001-5'
      },
      {
        judul: 'Si Anak Pintar: Serial Anak Nusantara',
        penulis: 'Tere Liye',
        penerbit: 'Republika Penerbit',
        tahunTerbit: 2023,
        ddcKlasifikasi: '813 - Fiksi Remaja',
        kategoriBuku: 'Fiksi / Cerita',
        jumlahDefault: 15,
        hargaSatuanDefault: 78000,
        lokasiRakDefault: 'Rak Fiksi B1',
        isbnDefault: '978-623-96003-2-7'
      },
      {
        judul: 'Negeri 5 Menara: Man Jadda Wajada',
        penulis: 'A. Fuadi',
        penerbit: 'Gramedia Pustaka Utama',
        tahunTerbit: 2022,
        ddcKlasifikasi: '813 - Fiksi Inspirasi',
        kategoriBuku: 'Fiksi / Cerita',
        jumlahDefault: 10,
        hargaSatuanDefault: 85000,
        lokasiRakDefault: 'Rak Fiksi B2',
        isbnDefault: '978-979-22-4861-6'
      },
      {
        judul: 'Kumpulan Cerita Rakyat Nusantara 34 Provinsi',
        penulis: 'Yudhistira Ikranegara',
        penerbit: 'Lingkar Media',
        tahunTerbit: 2023,
        ddcKlasifikasi: '398.2 - Cerita Rakyat',
        kategoriBuku: 'Fiksi / Cerita',
        jumlahDefault: 12,
        hargaSatuanDefault: 45000,
        lokasiRakDefault: 'Rak Fiksi B2',
        isbnDefault: '978-602-123-456-7'
      }
    ]
  },
  {
    id: 'referensi-ensiklopedia',
    name: 'Paket Koleksi Referensi, Kamus & Ensiklopedia',
    description: 'Kamus resmi, ensiklopedia penunjang riset mandiri, dan buku rujukan perpustakaan sekolah.',
    category: 'Kamus & Ensiklopedia',
    sumberPengadaan: 'BOS Reguler',
    books: [
      {
        judul: 'Kamus Besar Bahasa Indonesia (KBBI) Edisi V',
        penulis: 'Tim Badan Pengembangan dan Pembinaan Bahasa',
        penerbit: 'Balai Pustaka',
        tahunTerbit: 2023,
        ddcKlasifikasi: '413 - Kamus Bahasa Indonesia',
        kategoriBuku: 'Kamus & Ensiklopedia',
        jumlahDefault: 5,
        hargaSatuanDefault: 285000,
        lokasiRakDefault: 'Rak Referensi R1',
        isbnDefault: '978-979-069-264-0'
      },
      {
        judul: 'Kamus Standar Lengkap Inggris - Indonesia & Indonesia - Inggris',
        penulis: 'John M. Echols & Hassan Shadily',
        penerbit: 'Gramedia Pustaka Utama',
        tahunTerbit: 2023,
        ddcKlasifikasi: '423 - Kamus Bahasa Inggris',
        kategoriBuku: 'Kamus & Ensiklopedia',
        jumlahDefault: 6,
        hargaSatuanDefault: 145000,
        lokasiRakDefault: 'Rak Referensi R1',
        isbnDefault: '978-979-22-0359-2'
      },
      {
        judul: 'Ensiklopedia Sains & Teknologi Bergambar untuk Pelajar (Jilid 1-4)',
        penulis: 'Tim Sains Populer',
        penerbit: 'Erlangga for Kids',
        tahunTerbit: 2024,
        ddcKlasifikasi: '503 - Ensiklopedia Sains',
        kategoriBuku: 'Kamus & Ensiklopedia',
        jumlahDefault: 4,
        hargaSatuanDefault: 320000,
        lokasiRakDefault: 'Rak Referensi R2',
        isbnDefault: '978-602-099-112-2'
      },
      {
        judul: 'Atlas Lengkap Indonesia & 38 Provinsi serta Dunia Mutakhir',
        penulis: 'Tim Kartografi Grafindo',
        penerbit: 'Grafindo Media Pratama',
        tahunTerbit: 2024,
        ddcKlasifikasi: '912 - Atlas & Peta',
        kategoriBuku: 'Buku Referensi',
        jumlahDefault: 10,
        hargaSatuanDefault: 65000,
        lokasiRakDefault: 'Rak Referensi R2',
        isbnDefault: '978-602-168-990-1'
      }
    ]
  },
  {
    id: 'buku-guru-modul',
    name: 'Paket Buku Panduan Pendidik & Modul Ajar Guru',
    description: 'Panduan guru untuk penyusunan modul ajar, asesmen Kurikulum Merdeka, dan pengelolaan kelas.',
    category: 'Buku Guru',
    sumberPengadaan: 'BOS Reguler',
    books: [
      {
        judul: 'Panduan Pembelajaran dan Asesmen Kurikulum Merdeka SMP',
        penulis: 'Badan Standar, Kurikulum, dan Asesmen Pendidikan',
        penerbit: 'Kemendikbudristek RI',
        tahunTerbit: 2024,
        ddcKlasifikasi: '371.3 - Metode Pembelajaran',
        kategoriBuku: 'Buku Guru',
        jumlahDefault: 8,
        hargaSatuanDefault: 45000,
        lokasiRakDefault: 'Rak Koleksi Khusus Guru G1',
        isbnDefault: '978-623-194-001-8'
      },
      {
        judul: 'Buku Panduan Guru: Bahasa Indonesia SMP Kelas VII',
        penulis: 'Rakhma Subarna',
        penerbit: 'Pusat Perbukuan Kemendikbudristek',
        tahunTerbit: 2024,
        ddcKlasifikasi: '410.7 - Pengajaran Bhs Indonesia',
        kategoriBuku: 'Buku Guru',
        jumlahDefault: 5,
        hargaSatuanDefault: 48000,
        lokasiRakDefault: 'Rak Koleksi Khusus Guru G1',
        isbnDefault: '978-602-244-301-8'
      },
      {
        judul: 'Buku Panduan Guru: Ilmu Pengetahuan Alam SMP Kelas VII',
        penulis: 'Budiyanti Dwi Hardanie, dkk.',
        penerbit: 'Pusat Perbukuan Kemendikbudristek',
        tahunTerbit: 2024,
        ddcKlasifikasi: '507 - Pengajaran IPA',
        kategoriBuku: 'Buku Guru',
        jumlahDefault: 5,
        hargaSatuanDefault: 48000,
        lokasiRakDefault: 'Rak Koleksi Khusus Guru G1',
        isbnDefault: '978-602-244-384-1'
      }
    ]
  }
];

export const DDC_CATEGORIES = [
  '000 - Karya Umum, Komputer & Informasi',
  '100 - Filsafat & Psikologi',
  '200 - Agama (Islam, Kristen, Katolik, Hindu, Buddha, Konghucu)',
  '300 - Ilmu Sosial, Kebijakan, Hukum & Pendidikan',
  '400 - Bahasa (Indonesia, Inggris, Arab, Daerah)',
  '500 - Sains Murni, IPA, Matematika & Biologi',
  '600 - Teknologi, Terapan & Keterampilan Praktis',
  '700 - Kesenian, Olahraga, Hiburan & Musik',
  '800 - Sastra, Puisi, Prosa, Fiksi & Cerita',
  '900 - Sejarah, Geografi & Biografi Tokoh'
];
