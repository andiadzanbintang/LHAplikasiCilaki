import { useState } from "react";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className={`tutorial tutorial-${isOpen}`}>
      <h3 onClick={toggleDropdown} className="dropdown-header">
        Petunjuk Penggunaan Form AHP{" "}
        {isOpen ? (
          <AiOutlineUp className="dropdown-arrow" />
        ) : (
          <AiOutlineDown className="dropdown-arrow" />
        )}
      </h3>
      <p className="dropdown-note">
        Harap isi menggunakan laptop atau komputer untuk tampilan yang lebih baik.
      </p>

      {isOpen && (
        <div className="tutorial-content">
          <strong>Tujuan Pengisian</strong>
          <p>
            Pengisian form AHP ini bertujuan untuk memberikan nilai (tingkat
            kepentingan) pada indikator-indikator yang digunakan dalam
            menentukan infrastruktur prioritas. Nilai tersebut terbagi ke dalam
            dua indeks utama:
          </p>
          <ul>
            <li>
              <strong>Indeks Finansial Ekonomi (IFE)</strong>
            </li>
            <li>
              <strong>Indeks Sosial Lingkungan (ISL)</strong>
            </li>
          </ul>
          <p>
            Masing-masing indeks terdiri dari beberapa indikator turunan. Dengan
            metode <strong>Analytical Hierarchy Process (AHP)</strong>, penilaian
            dilakukan oleh tenaga ahli untuk mengetahui bobot relatif dari tiap
            indikator.
          </p>

          <h3>Langkah-langkah Penggunaan AHP</h3>
          <ol>
            <li>
              <strong>Pergi ke Halaman Form</strong>
              <br />
              Klik{" "}
              <a href="/form" style={{ textDecoration: "none" }}>
                <em>Form</em>
              </a>{" "}
              di Navbar untuk masuk ke halaman pengisian.
            </li>
            <li>
              <strong>Isi Data Diri</strong>
              <br />
              Masukkan nama, posisi, dan instansi Anda.
            </li>
            <li>
              <strong>Isi Penilaian Indikator</strong>
              <br />
              Berikan penilaian perbandingan antar indikator. Lihat link{" "}
              <a href="/indikator" style={{ fontStyle: "italic" }}>
                Indikator
              </a>{" "}
              untuk penjelasan lengkap masing-masing indikator.
            </li>
            <li>
              <strong>Submit Form</strong>
              <br />
              Setelah semua penilaian selesai, klik tombol submit.
            </li>
            <li>
              <strong>Lihat Hasil di Beranda</strong>
              <br />
              Pergi ke beranda dan <em>Refresh</em> untuk melihat hasil
              penilaian.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
