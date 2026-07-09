// =========================================================================
// 🔗 SILAKAN TEMPEL URL WEB APP APPS SCRIPT BERAKHIRAN /exec DI SINI
// =========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzcfVJRdI75U-64wMcxeqzxfxiyHDFKUvaFkMu2eVJFzrA-8kCyAxMOk6LtbJou1S4dsw/exec";

let userActive = { nama: "", role: "" };
let selectedMeta = { batch: "", subbrand: "", mesin: "", noMesin: "", statusSICAktif: "", statusQCAktif: "AWAL", statusMaintAktif: "MULAI" };

function hitungTotalWaktuOperasional(jamMulai, jamSelesai) {
  if(!jamMulai || !jamSelesai) return "—";
  const [h1, m1] = jamMulai.split(':').map(Number);
  const [h2, m2] = jamSelesai.split(':').map(Number);
  let t1 = (h1 * 60) + m1, t2 = (h2 * 60) + m2;
  if (t2 < t1) t2 += 24 * 60;
  let diff = t2 - t1;
  return `${Math.floor(diff / 60)} Jam ${diff % 60} Menit`;
}

function cekPINPanjangKarakter() {
  const pinVal = document.getElementById('input-pin').value;
  if(pinVal.length === 4) {
    document.getElementById('input-pin').blur();
    verifikasiPINKeBackend();
  }
}

// =========================================================================
// 🔐 1. VERIFIKASI PIN & GERBANG UTAMA (INTERMEDIATE ROLE SELECTOR)
// =========================================================================
function verifikasiPINKeBackend() {
  const pin = document.getElementById('input-pin').value.trim();
  if(pin.length < 4) return;

  document.getElementById('btn-login-submit').style.display = 'none';
  document.getElementById('txt-login-loading').style.display = 'block';

  fetch(`${WEB_APP_URL}?action=login&pin=${pin}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Ambil data nama asli dari database karyawan server Sheets
        userActive.nama = data.nama;
        
        // 🚀 EVALUASI MERANGKAP: Jika role di DB adalah SIC atau OEE, arahkan ke layar pertanyaan[cite: 1]
        if (data.role === 'SIC' || data.role === 'OEE') {
          document.getElementById('sec-login').style.display = 'none';[cite: 1]
          document.getElementById('sec-role-selector').style.display = 'block';
          
          // Reset status elemen loading login demi estetika visual[cite: 1]
          document.getElementById('btn-login-submit').style.display = 'block';[cite: 1]
          document.getElementById('txt-login-loading').style.display = 'none';[cite: 1]
          document.getElementById('input-pin').value = "";[cite: 1]
        } else {
          // Untuk role QC dan MAINTENANCE langsung lolos tanpa layar perantara[cite: 1]
          userActive.role = data.role;[cite: 1]
          localStorage.setItem('ss_nama', userActive.nama);[cite: 1]
          localStorage.setItem('ss_role', userActive.role);[cite: 1]
          muatMasterDropdownDariServer();[cite: 1]
        }
      } else {
        alert("❌ PIN Karyawan Tidak Terdaftar di DB_KARYAWAN!");[cite: 1]
        document.getElementById('input-pin').value = "";[cite: 1]
        document.getElementById('btn-login-submit').style.display = 'block';[cite: 1]
        document.getElementById('txt-login-loading').style.display = 'none';[cite: 1]
      }
    })
    .catch(err => {
      alert("⚠️ Hambatan jaringan server Sheets.");[cite: 1]
      document.getElementById('btn-login-submit').style.display = 'block';[cite: 1]
      document.getElementById('txt-login-loading').style.display = 'none';[cite: 1]
    });
}

// 🚀 FUNGSI UTAMA: Dipicu saat operator memilih salah satu tombol kamar kerja (SIC/OEE)
function pilihAksesRoleKerja(roleTerpilih) {
  // Suntik role pilihan user secara dinamis ke aplikasi aktif
  userActive.role = roleTerpilih;
  
  // Amankan sesi login ke dalam penyimpanan lokal browser
  localStorage.setItem('ss_nama', userActive.nama);
  localStorage.setItem('ss_role', userActive.role);
  
  // Pindahkan layar menuju dashboard utama
  document.getElementById('sec-role-selector').style.display = 'none';
  
  // Picu penarikan data master otomatis bawaan aplikasi Anda
  muatMasterDropdownDariServer();
}

function logoutAplikasi() { 
  localStorage.removeItem('ss_nama'); 
  localStorage.removeItem('ss_role'); 
  location.reload(); 
}

window.onload = function() {
  const sNama = localStorage.getItem('ss_nama');
  const sRole = localStorage.getItem('ss_role');
  if(sNama && sRole) { userActive.nama = sNama; userActive.role = sRole; muatMasterDropdownDariServer(); }
}

function muatMasterDropdownDariServer() {
  document.getElementById('sec-login').style.display = 'none';
  document.getElementById('sec-filter').style.display = 'block';
  document.getElementById('btn-logout').style.display = 'block';
  document.getElementById('txt-app-title').innerText = `${userActive.nama} — TIM ${userActive.role}`;
  
  document.getElementById('select-batch').value = "";
  document.getElementById('select-subbrand').value = "";
  document.getElementById('select-mesin').value = "";
  document.getElementById('select-no-mesin').value = "";

  renderHistoryTable();

  fetch(`${WEB_APP_URL}?action=get_master_data&role=${userActive.role}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('list-batch-aktif').innerHTML = data.batch_list.map(b => `<option value="${b}"></option>`).join('');

      if (userActive.role === 'SPV') {
        document.getElementById('txt-app-subtitle').innerText = "Menu Otoritas Penutupan (Close Out) Batch Selesai.";
        document.getElementById('block-staff-filter-options').style.display = 'none';
        document.getElementById('btn-gate-universal').style.display = 'none';
        document.getElementById('gate-sic').style.display = 'none';
        document.getElementById('block-spv-resume-view').style.display = 'block';
        document.getElementById('btn-gate-spv-close').style.display = 'block';
      } else {
        document.getElementById('txt-app-subtitle').innerText = "Lengkapi metadata monitoring di bawah.";
        document.getElementById('block-staff-filter-options').style.display = 'block';
        document.getElementById('block-spv-resume-view').style.display = 'none';
        document.getElementById('btn-gate-spv-close').style.display = 'none';

        document.getElementById('list-subbrand-aktif').innerHTML = data.subbrand_list.map(s => `<option value="${s}"></option>`).join('');
        
        const uniqueMesinList = [...new Set(data.mesin_list[userActive.role])];
        document.getElementById('list-mesin-universal').innerHTML = uniqueMesinList.map(m => `<option value="${m}"></option>`).join('');
        
        document.getElementById('block-mixing-generator').style.display = (userActive.role === 'SIC') ? 'block' : 'none';
        document.getElementById('block-oee-extra-filter').style.display = (userActive.role === 'OEE') ? 'block' : 'none';
        
        if(userActive.role === 'OEE') {
          document.getElementById('oee-spv').innerHTML = data.spv_list.map(s => `<option value="${s}">${s}</option>`).join('');
          document.getElementById('oee-area').innerHTML = data.area_list.map(a => `<option value="${a}">${a}</option>`).join('');
          document.getElementById('list-varian-oee').innerHTML = data.varian_list.map(v => `<option value="${v}"></option>`).join('');
          document.getElementById('oee-varian').value = ""; 
        }

        if(userActive.role === 'MAINTENANCE') {
          document.getElementById('block-brand-and-machine-selectors').style.display = 'none';
          document.getElementById('list-mesin-maintenance').innerHTML = uniqueMesinList.map(m => `<option value="${m}"></option>`).join('');
        } else {
          document.getElementById('block-brand-and-machine-selectors').style.display = 'block';
        }

        if(userActive.role === 'SIC') {
          document.getElementById('gate-sic').style.display = 'block';
          document.getElementById('btn-gate-universal').style.display = 'none';
        } else {
          document.getElementById('gate-sic').style.display = 'none';
          document.getElementById('btn-gate-universal').style.display = 'block';
        }
        evaluasiKondisiTampilanUniversal();
      }
    })
    .catch(err => {
      alert("⚠️ Gagal memuat data master dari server.");
    });
}

function evaluasiKondisiTampilanUniversal() {
  if(userActive.role === 'SPV') { triggerFetchResumeSPVServer(); return; }

  const batchTerpilih = document.getElementById('select-batch').value.trim();
  const mesinTerpilih = document.getElementById('select-mesin').value.trim();

  const isEyeshadow = batchTerpilih.toUpperCase().startsWith("ES");
  const isMesinPress = mesinTerpilih.toLowerCase().includes("press");

  if (isEyeshadow && isMesinPress && userActive.role !== 'MAINTENANCE') {
    document.getElementById('block-conditional-eyeshadow-kit').style.display = 'block';
    kalkulasiLivePreviewSplitBatch();
  } else {
    document.getElementById('block-conditional-eyeshadow-kit').style.display = 'none';
  }
}

function kalkulasiLivePreviewSplitBatch() {
  const batchAsli = document.getElementById('select-batch').value.trim();
  const digitKit = document.getElementById('input-eyeshadow-kit-digit').value.trim();
  const lblPreview = document.getElementById('lbl-preview-split-batch');
  lblPreview.innerText = digitKit ? `${batchAsli}${digitKit}` : "—";
}

function generateBatchBaru() {
  const bBaru = document.getElementById('input-batch-baru').value.trim().toUpperCase();
  if(!bBaru) return;
  
  const dl = document.getElementById('list-batch-aktif');
  dl.innerHTML = `<option value="${bBaru}"></option>` + dl.innerHTML;
  document.getElementById('select-batch').value = bBaru;
  document.getElementById('input-batch-baru').value = "";
  evaluasiKondisiTampilanUniversal();
  alert(`✓ Batch hulu ${bBaru} siap digunakan di baris pengisian.`);
}

function triggerFetchResumeSPVServer() {
  if (userActive.role !== 'SPV') return;
  const batchTerpilih = document.getElementById('select-batch').value.trim();
  if(!batchTerpilih) return;

  document.getElementById('res-tgl').innerText = "Memuat...";
  document.getElementById('res-output').innerText = "Memuat...";

  fetch(`${WEB_APP_URL}?action=get_batch_resume&batch=${batchTerpilih}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('res-tgl').innerText = data.tanggal_mulai || "—";
      document.getElementById('res-varian').innerText = data.varian || "—";
      document.getElementById('res-output').innerText = `${data.total_output || 0} Pcs`;
      document.getElementById('res-reject').innerText = `${data.total_reject || 0} Pcs`;
      document.getElementById('res-repro').innerText = `${data.total_reproses || 0} Kg`;
      document.getElementById('res-waktu-kerja').innerText = data.jam_mulai || "—"; 
    });
}

function setMaintenanceStatus(statusMaint) {
  selectedMeta.statusMaintAktif = statusMaint;
  document.getElementById('btn-maint-mulai').className = 'toggle-btn' + (statusMaint === 'MULAI' ? ' active' : '');
  document.getElementById('btn-maint-selesai').className = 'toggle-btn' + (statusMaint === 'SELESAI' ? ' active' : '');
  document.getElementById('block-maint-conditional-selesai').style.display = (statusMaint === 'SELESAI') ? 'block' : 'none';
}

function setQCStatus(statusQc) {
  selectedMeta.statusQCAktif = statusQc;
  document.getElementById('btn-qc-status-awal').className = 'toggle-btn' + (statusQc === 'AWAL' ? ' active' : '');
  document.getElementById('btn-qc-status-akhir').className = 'toggle-btn' + (statusQc === 'AKHIR' ? ' active' : '');
}

function bukaFormDenganStatus(statusClick) {
  selectedMeta.batch = document.getElementById('select-batch').value.trim();
  selectedMeta.subbrand = userActive.role !== 'SPV' ? document.getElementById('select-subbrand').value.trim() : "—";
  selectedMeta.mesin = userActive.role !== 'SPV' ? document.getElementById('select-mesin').value.trim() : "—";
  selectedMeta.noMesin = (userActive.role !== 'SPV' && userActive.role !== 'MAINTENANCE') ? document.getElementById('select-no-mesin').value.trim() : "—";
  selectedMeta.statusSICAktif = statusClick;

  if(!selectedMeta.batch) { alert("⚠️ Kolom Nomor Batch wajib diisi!"); return; }
  if(userActive.role !== 'SPV' && userActive.role !== 'MAINTENANCE') {
    if(!selectedMeta.subbrand || !selectedMeta.mesin || !selectedMeta.noMesin) { alert("⚠️ Mohon lengkapi Subbrand, Nama Mesin, dan Nomor Line!"); return; }
  }

  if (userActive.role === 'SIC' && (statusClick === 'ISTIRAHAT' || statusClick === 'SANITASI')) {
    if (confirm(`Setor status istirahat/sanitasi untuk mesin jam ini?`)) {
      let batchKirim = selectedMeta.batch;
      const digitKit = document.getElementById('input-eyeshadow-kit-digit').value.trim();
      if (batchKirim.toUpperCase().startsWith("ES") && selectedMeta.mesin.toLowerCase().includes("press") && digitKit) {
        batchKirim = `${selectedMeta.batch}${digitKit}`;
      }
      let payload = { action: "submit_form", timestamp: new Date().toLocaleString("id-ID"), operator: userActive.nama, role: userActive.role, metadata: { batch: batchKirim, subbrand: selectedMeta.subbrand, mesin: selectedMeta.mesin, noMesin: selectedMeta.noMesin, statusSICAktif: statusClick }, form_data: { output_pcs: "0", alasan_khusus: `Status Non-Produksi: ${statusClick}` } };
      
      postDataKeServer(payload, () => {
        catatKeHistoryLogLokal(batchKirim, selectedMeta.mesin, selectedMeta.noMesin, statusClick, "0", "-");
        alert("✓ Status Berhasil Disetor!");
      });
    }
    return; 
  }

  document.getElementById('sec-filter').style.display = 'none';
  document.getElementById('sec-form').style.display = 'block';
  document.getElementById('form-sic').style.display = 'none';
  document.getElementById('form-qc').style.display = 'none';
  document.getElementById('form-oee').style.display = 'none';
  document.getElementById('form-maintenance').style.display = 'none';

  if(userActive.role === 'SIC') {
    document.getElementById('form-sic').style.display = 'block';
    document.getElementById('txt-status-sic-badge').innerText = `Status Pengisian: ${statusClick}`;
  } else if(userActive.role === 'QC') {
    document.getElementById('form-qc').style.display = 'block';
  } else if(userActive.role === 'OEE') {
    document.getElementById('form-oee').style.display = 'block';
  } else if(userActive.role === 'MAINTENANCE') {
    document.getElementById('form-maintenance').style.display = 'block';
    setMaintenanceStatus('MULAI'); 
  }
}

// =========================================================================
// 🔀 2. FUNGSI BACK NAVIGASI (KEMBALI KE MENU UTAMA / PILIHAN FORM)
// =========================================================================
function kembaliKeFilter() {
  document.getElementById('sec-form').style.display = 'none';[cite: 1]
  
  // 🚀 ISOLASI LOGIKA: Cek apakah user termasuk tim yang merangkap tugas[cite: 1]
  if (userActive.role === 'SIC' || userActive.role === 'OEE') {
    // Sembunyikan area filter metadata agar tidak mengunci di role tersebut[cite: 1]
    document.getElementById('sec-filter').style.display = 'none';[cite: 1]
    
    // Tampilkan kembali layar utama pemilihan ruang kerja (Intermediate Menu)
    document.getElementById('sec-role-selector').style.display = 'block';
    
    // Bersihkan data role sementara waktu agar state aplikasi netral kembali
    userActive.role = "";
    localStorage.removeItem('ss_role');[cite: 1]
  } else {
    // Untuk role QC dan Maintenance tetap normal kembali ke filter panel masing-masing[cite: 1]
    document.getElementById('sec-filter').style.display = 'block';[cite: 1]
  }

// =========================================================================
// 🚀 4. FUNGSI SUBMIT FORM UTAMA (DENGAN PUTAR BALIK ELEMEN AUTOMATIC)
// =========================================================================
function kirimDataKeSpreadsheetServer() {
  let labelStatusLog = "NORMAL";[cite: 1]
  let valOut = "0", infoLogStr = "-";[cite: 1]
  
  let finalBatchNumber = selectedMeta.batch;[cite: 1]
  const digitKit = document.getElementById('input-eyeshadow-kit-digit').value.trim();[cite: 1]
  const isEyeshadow = selectedMeta.batch.toUpperCase().startsWith("ES");[cite: 1]
  const isMesinPress = selectedMeta.mesin.toLowerCase().includes("press");[cite: 1]

  if (isEyeshadow && isMesinPress && digitKit && userActive.role !== 'MAINTENANCE') {[cite: 1]
    finalBatchNumber = `${selectedMeta.batch}${digitKit}`;[cite: 1]
  }

  let payload = { action: "submit_form", timestamp: new Date().toLocaleString("id-ID"), operator: userActive.nama, role: userActive.role, metadata: { batch: finalBatchNumber, subbrand: selectedMeta.subbrand, mesin: selectedMeta.mesin, noMesin: selectedMeta.noMesin, statusSICAktif: selectedMeta.statusSICAktif }, form_data: {} };[cite: 1]

  if(userActive.role === 'SIC') {[cite: 1]
    valOut = document.getElementById('sic-output').value || "0";[cite: 1]
    payload.form_data = { output_pcs: valOut, alasan_khusus: document.getElementById('sic-alasan').value };[cite: 1]
    labelStatusLog = selectedMeta.statusSICAktif;[cite: 1]
  } else if(userActive.role === 'QC') {[cite: 1]
    const rjc = document.getElementById('qc-reject').value || "0";[cite: 1]
    const rpr = document.getElementById('qc-repro').value || "0";[cite: 1]
    payload.form_data = { status_monitoring: selectedMeta.statusQCAktif, reject_pcs: rjc, repro_kg: rpr, alasan_reject_repro: document.getElementById('qc-alasan').value };[cite: 1]
    labelStatusLog = selectedMeta.statusQCAktif;[cite: 1]
  } else if(userActive.role === 'OEE') {[cite: 1]
    valOut = document.getElementById('oee-capaian').value || "0";[cite: 1]
    
    const jmMulai = document.getElementById('oee-jam-mulai').value;[cite: 1]
    const jmSelesai = document.getElementById('oee-jam-selesai').value;[cite: 1]
    const istirahat = Number(document.getElementById('oee-istirahat').value || 0);[cite: 1]
    
    let durasiMenitBersih = 0;[cite: 1]
    if (jmMulai && jmSelesai) {[cite: 1]
      let [h1, m1] = jmMulai.split(':').map(Number);[cite: 1]
      let [h2, m2] = jmSelesai.split(':').map(Number);[cite: 1]
      let t1 = (h1 * 60) + m1, t2 = (h2 * 60) + m2;[cite: 1]
      if (t2 < t1) t2 += 24 * 60;[cite: 1]
      durasiMenitBersih = (t2 - t1) - istirahat;[cite: 1]
      if(durasiMenitBersih < 0) durasiMenitBersih = 0;[cite: 1]
    }

    payload.form_data = { 
      spv: document.getElementById('oee-spv').value,[cite: 1]
      tanggal: document.getElementById('oee-tanggal').value,[cite: 1]
      area: document.getElementById('oee-area').value,[cite: 1]
      varian: document.getElementById('oee-varian').value,[cite: 1]
      jam_mulai: jmMulai,[cite: 1]
      jam_selesai: jmSelesai,[cite: 1]
      istirahat_menit: istirahat.toString(),[cite: 1]
      capaian_pcs: valOut,[cite: 1]
      mp_orang: document.getElementById('oee-mp').value || "0",[cite: 1]
      kemas_rusak: document.getElementById('oee-rusak').value || "0",[cite: 1]
      alasan_rusak: document.getElementById('oee-alasan-rusak').value,[cite: 1]
      durasi_bersih_menit: durasiMenitBersih.toString(),[cite: 1]
      mesin: selectedMeta.mesin, // Perbaikan baca dari selectedMeta
      no_mesin: selectedMeta.noMesin // Perbaikan baca dari selectedMeta
    };
    labelStatusLog = "REKAP SHIFT";[cite: 1]
  } else if(userActive.role === 'MAINTENANCE') {[cite: 1]
    selectedMeta.mesin = document.getElementById('maint-search-mesin').value.trim() || "Mesin-Unspecified";[cite: 1]
    selectedMeta.noMesin = document.getElementById('maint-input-no-mesin').value.trim() || "No-ID";[cite: 1]
    
    payload.metadata.mesin = selectedMeta.mesin;[cite: 1]
    payload.metadata.noMesin = selectedMeta.noMesin;[cite: 1]
    
    const jenisKerusakan = document.getElementById('maint-jenis-rusak').value;[cite: 1]
    const hasilKerja = selectedMeta.statusMaintAktif === 'SELESAI' ? document.getElementById('maint-hasil').value : "Mulai Perbaikan";[cite: 1]
    
    payload.form_data = { jenis_kerusakan: jenisKerusakan, hasil_pengerjaan: hasilKerja, rekomendasi_solusi: document.getElementById('maint-rekomendasi').value };[cite: 1]
    
    labelStatusLog = selectedMeta.statusMaintAktif;[cite: 1]
    infoLogStr = `[${hasilKerja}] ${jenisKerusakan}`;[cite: 1]
  }

  postDataKeServer(payload, () => {
    catatKeHistoryLogLokal(finalBatchNumber, selectedMeta.mesin, selectedMeta.noMesin, labelStatusLog, valOut, infoLogStr);[cite: 1]
    alert("🚀 Sukses! Data berhasil dikirim ke Google Sheets.");[cite: 1]
    
    // Reset data kolom input form
    document.getElementById('sic-output').value = "";[cite: 1]
    document.getElementById('qc-reject').value = "";[cite: 1]
    document.getElementById('qc-repro').value = "";[cite: 1]
    document.getElementById('maint-search-mesin').value = "";[cite: 1]
    document.getElementById('maint-input-no-mesin').value = "";[cite: 1]
    document.getElementById('maint-jenis-rusak').value = "";[cite: 1]
    document.getElementById('maint-rekomendasi').value = "";[cite: 1]
    document.getElementById('input-eyeshadow-kit-digit').value = "";[cite: 1]
    
    // 🚀 ALUR NAVIGASI BARU: Tutup area form pengisian[cite: 1]
    document.getElementById('sec-form').style.display = 'none';[cite: 1]
    
    // Cek Tingkat Akses Kebijakan Putar Balik Otomatis[cite: 1]
    if (userActive.role === 'SIC' || userActive.role === 'OEE') {
      // Hanya operator SIC / OEE merangkap yang dipulangkan murni ke jendela pemilihan form[cite: 1]
      document.getElementById('sec-filter').style.display = 'none';[cite: 1]
      document.getElementById('sec-role-selector').style.display = 'block';
      userActive.role = "";
      localStorage.removeItem('ss_role');[cite: 1]
    } else {
      // Untuk tim QC dan Maintenance, langsung dikembalikan ke halaman filter bawaannya sendiri[cite: 1]
      document.getElementById('sec-filter').style.display = 'block';[cite: 1]
      muatMasterDropdownDariServer();[cite: 1]
    }
  });
}

function eksekusiLockCloseOutSPVServer() {
  const batchTarget = document.getElementById('select-batch').value.trim();
  if (!batchTarget || batchTarget === "") return;
  
  if (confirm(`⚠️ LOCK CLOSE OUT BATCH:\nApakah Anda yakin rekap performa batch ${batchTarget} sudah benar?\nSetelah dikunci, batch ini akan hilang dari seluruh sistem.`)) {
    let payload = { action: "close_out_batch", timestamp: new Date().toLocaleString("id-ID"), operator: userActive.nama, role: userActive.role, batch: batchTarget };
    
    postDataKeServer(payload, () => {
      catatKeHistoryLogLokal(batchTarget, "ALL PROCESS", "FINAL CLOSE", "CLOSED", "0", "Locked");
      alert(`🔒 Sukses! Batch ${batchTarget} resmi ditutup.`);
      muatMasterDropdownDariServer();
    });
  }
}

function postDataKeServer(payload, successCallback) {
  if (!navigator.onLine) { alert("Sinyal Terputus! Periksa koneksi internet."); return; }
  fetch(WEB_APP_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    .then(() => { successCallback(); })
    .catch(err => { alert("⚠️ Server sibuk. Mohon coba beberapa saat lagi."); });
}

// =========================================================================
// 📝 3. FUNGSI PENCATATAN DATA LOKAL BROWSER (SINKRON VARIABEL GANDA)
// =========================================================================
function catatKeHistoryLogLokal(batch, mesin, noMesin, status, out, customInfo) {
  let logs = JSON.parse(localStorage.getItem('ss_table_logs')) || [];[cite: 1]
  const mesinNoStr = `${mesin} (${noMesin})`;[cite: 1]
  const jamSkrg = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });[cite: 1]

  let infoDinamisStr = "-";[cite: 1]
  if (userActive.role === 'SIC') {[cite: 1]
    const hitungSama = logs.filter(l => (l.noBatch === batch || l.batch === batch) && l.mesin_no === mesinNoStr && l.role === 'SIC' && l.operator === userActive.nama).length;[cite: 1]
    infoDinamisStr = `Cyc ${hitungSama + 1}`;[cite: 1]
  } else if (userActive.role === 'QC') {[cite: 1]
    const rjc = document.getElementById('qc-reject')?.value || "0";[cite: 1]
    const rpr = document.getElementById('qc-repro')?.value || "0";[cite: 1]
    infoDinamisStr = (status === "AWAL") ? "Start Mon" : `${rjc} Pcs / ${rpr} Kg`;[cite: 1]
  } else if (userActive.role === 'OEE' || userActive.role === 'SPV') {[cite: 1]
    infoDinamisStr = status === "CLOSED" ? "Locked" : `${out} Pcs`;[cite: 1]
  } else if (userActive.role === 'MAINTENANCE') {[cite: 1]
    infoDinamisStr = customInfo;[cite: 1]
  }

  // Rekam data dengan parameter ganda agar terbaca sempurna di semua bentuk visualisasi tabel
  logs.unshift({ 
    jam: jamSkrg,[cite: 1]
    batch: batch,                           // Format lama bawaan filter SIC/OEE/MAINTENANCE[cite: 1]
    noBatch: batch,                         // Kunci pencarian horizontal matriks QC
    subbrand: selectedMeta.subbrand || "—",  // Mengamankan teks nama varian produk murni
    mesin_no: mesinNoStr,                   // Format lama bawaan filter SIC/OEE/MAINTENANCE[cite: 1]
    mesinLine: mesinNoStr,                  // Kunci pencarian horizontal matriks QC
    info: infoDinamisStr,[cite: 1]
    status: status,[cite: 1]
    role: userActive.role,[cite: 1]
    operator: userActive.nama[cite: 1]
  });
  
  localStorage.setItem('ss_table_logs', JSON.stringify(logs));[cite: 1]
  renderHistoryTable();[cite: 1]
}

// =========================================================================
// 📊 5. RENDERING VISUAL TABEL LOG RIWAYAT (DIVERSIFIKASI LAYOUT)
// =========================================================================
function renderHistoryTable() {
  const tBody = document.getElementById('history-table-body');[cite: 1]
  const logs = JSON.parse(localStorage.getItem('ss_table_logs')) || [];[cite: 1]
  
  const containerTabel = document.getElementById('sec-history');[cite: 1]
  const headTabel = containerTabel.querySelector('thead');[cite: 1]

  // =========================================================================
  // 🧪 KONDISI KHUSUS: TIM QC (MATRIKS HORIZONTAL MESIN LINE)
  // =========================================================================
  if (userActive && userActive.role === 'QC') {
    if (headTabel) {
      headTabel.innerHTML = `
        <tr>
          <th style="width: 25%;">No Batch</th>
          <th style="width: 35%;">Mesin / Line</th>
          <th style="width: 20%; text-align: center;">QC AWAL</th>
          <th style="width: 20%; text-align: center;">QC AKHIR</th>
        </tr>
      `;
    }

    // Filter log data murni milik operator QC aktif saja[cite: 1]
    const qcLogs = logs.filter(l => l.operator === userActive.nama);[cite: 1]

    if(qcLogs.length === 0) {
      tBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#aaa; font-style:italic;">Belum ada riwayat pemeriksaan QC shift ini.</td></tr>`;[cite: 1]
      return;
    }

    const grupQC = {};
    
    // Looping data kronologis terlama ke terbaru (indeks besar ke kecil)
    for (let i = qcLogs.length - 1; i >= 0; i--) {
      const l = qcLogs[i];
      
      if (!grupQC[l.noBatch]) {
        grupQC[l.noBatch] = {
          noBatch: l.noBatch,
          mesinLine: l.mesinLine || l.mesin_no || `${selectedMeta.mesin} (${selectedMeta.noMesin})` || "—",
          awal: { detail: "Belum", ada: false },
          akhir: { detail: "Belum", ada: false }
        };
      }
      
      if (l.mesinLine && l.mesinLine !== "—") {
        grupQC[l.noBatch].mesinLine = l.mesinLine;
      }
      
      if (l.status === "AWAL") {[cite: 1]
        grupQC[l.noBatch].awal = { detail: l.jam, ada: true };[cite: 1]
      } else if (l.status === "AKHIR") {[cite: 1]
        grupQC[l.noBatch].akhir = { detail: l.jam, ada: true };[cite: 1]
      }
    }

    // Tampilkan hasil pemetaan horizontal matriks ke dalam HTML[cite: 1]
    const arrGrup = Object.values(grupQC).reverse();
    tBody.innerHTML = arrGrup.map(g => {
      const badgeAwal = g.awal.ada 
        ? `<span class="status-badge" style="background:#389e0d; display:block; padding:4px 0; font-size:10px; color:#fff; font-weight:700; border-radius:4px;">✓ ${g.awal.detail}</span>` 
        : `<span class="status-badge" style="background:#bfbfbf; display:block; padding:4px 0; font-size:10px; color:#fff; border-radius:4px;">Belum</span>`;
        
      const badgeAkhir = g.akhir.ada 
        ? `<span class="status-badge" style="background:#cf1322; display:block; padding:4px 0; font-size:10px; color:#fff; font-weight:700; border-radius:4px;">✓ ${g.akhir.detail}</span>` 
        : `<span class="status-badge" style="background:#bfbfbf; display:block; padding:4px 0; font-size:10px; color:#fff; border-radius:4px;">Belum</span>`;

      return `
        <tr>
          <td style="font-weight:600; vertical-align:middle; padding:10px 4px;">${g.noBatch}</td>
          <td style="color:#262626; font-size:11px; vertical-align:middle; padding:10px 4px; font-weight:500;">${g.mesinLine}</td>
          <td style="text-align:center; vertical-align:middle; padding:10px 4px;">${badgeAwal}</td>
          <td style="text-align:center; vertical-align:middle; padding:10px 4px;">${badgeAkhir}</td>
        </tr>
      `;
    }).join('');

    return; // Keluar murni agar tidak mengeksekusi visualisasi vertikal non-QC[cite: 1]
  }

  // =========================================================================
  // ⚙️ KONDISI DEFAULT: TIM NON-QC (SIC, OEE, MAINTENANCE VERTIKAL REGULER)
  // =========================================================================
  if (headTabel) {
    headTabel.innerHTML = `
      <tr>
        <th style="width: 15%;">Jam</th>
        <th style="width: 25%;">No Batch</th>
        <th style="width: 25%;">Mesin / Line</th>
        <th style="width: 22%;">Info</th>
        <th style="width: 13%; text-align: center;">Status</th>
      </tr>
    `;
  }

  const filteredNonQC = logs.filter(l => l.role === userActive.role && l.operator === userActive.nama);[cite: 1]
  
  if(filteredNonQC.length === 0) {
    tBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#aaa; font-style:italic;">Belum ada riwayat input shift ini.</td></tr>`;[cite: 1]
    return;
  }

  tBody.innerHTML = filteredNonQC.map(l => {
    let colorBadge = "#096dd9";[cite: 1]
    if (l.status === "ISTIRAHAT") colorBadge = "#d46b08";[cite: 1]
    if (l.status === "SELESAI" || l.status === "AKHIR" || l.status === "CLOSED" || l.status === "REKAP SHIFT") colorBadge = "#cf1322";[cite: 1]
    if (l.status === "MULAI" || l.status === "SANITASI" || l.status === "TENGAH") colorBadge = "#389e0d";[cite: 1]

    return `<tr>
      <td style="padding:8px 4px;">${l.jam}</td>[cite: 1]
      <td style="font-weight:600; padding:8px 4px;">${l.noBatch || l.batch}</td>[cite: 1]
      <td style="padding:8px 4px;">${l.mesinLine || l.mesin_no || "—"}</td>[cite: 1]
      <td style="color:#666; font-size:10px; padding:8px 4px;">${l.info}</td>[cite: 1]
      <td style="text-align:center; padding:8px 4px;"><span class="status-badge" style="background:${colorBadge}; color:#fff; padding:3px 6px; border-radius:4px; font-size:10px; font-weight:700;">${l.status}</span></td>[cite: 1]
    </tr>`;
  }).join('');
}

function clearHistoryLokal() { localStorage.removeItem('ss_table_logs'); renderHistoryTable(); }
