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

function verifikasiPINKeBackend() {
  const pin = document.getElementById('input-pin').value.trim();
  if(pin.length < 4) return;

  document.getElementById('btn-login-submit').style.display = 'none';
  document.getElementById('txt-login-loading').style.display = 'block';

  fetch(`${WEB_APP_URL}?action=login&pin=${pin}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        userActive.nama = data.nama;
        userActive.role = data.role;
        localStorage.setItem('ss_nama', userActive.nama);
        localStorage.setItem('ss_role', userActive.role);
        muatMasterDropdownDariServer();
      } else {
        alert("❌ PIN Karyawan Tidak Terdaftar di DB_KARYAWAN!");
        document.getElementById('input-pin').value = "";
        document.getElementById('btn-login-submit').style.display = 'block';
        document.getElementById('txt-login-loading').style.display = 'none';
      }
    })
    .catch(err => {
      alert("⚠️ Hambatan jaringan server Sheets.");
      document.getElementById('btn-login-submit').style.display = 'block';
      document.getElementById('txt-login-loading').style.display = 'none';
    });
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

function kembaliKeFilter() {
  document.getElementById('sec-form').style.display = 'none';
  document.getElementById('sec-filter').style.display = 'block';
}

function kirimDataKeSpreadsheetServer() {
  let labelStatusLog = "NORMAL";
  let valOut = "0", infoLogStr = "-";
  
  let finalBatchNumber = selectedMeta.batch;
  const digitKit = document.getElementById('input-eyeshadow-kit-digit').value.trim();
  const isEyeshadow = selectedMeta.batch.toUpperCase().startsWith("ES");
  const isMesinPress = selectedMeta.mesin.toLowerCase().includes("press");

  if (isEyeshadow && isMesinPress && digitKit && userActive.role !== 'MAINTENANCE') {
    finalBatchNumber = `${selectedMeta.batch}${digitKit}`;
  }

  let payload = { action: "submit_form", timestamp: new Date().toLocaleString("id-ID"), operator: userActive.nama, role: userActive.role, metadata: { batch: finalBatchNumber, subbrand: selectedMeta.subbrand, mesin: selectedMeta.mesin, noMesin: selectedMeta.noMesin, statusSICAktif: selectedMeta.statusSICAktif }, form_data: {} };

  if(userActive.role === 'SIC') {
    valOut = document.getElementById('sic-output').value || "0";
    payload.form_data = { output_pcs: valOut, alasan_khusus: document.getElementById('sic-alasan').value };
    labelStatusLog = selectedMeta.statusSICAktif;
  } else if(userActive.role === 'QC') {
    const rjc = document.getElementById('qc-reject').value || "0";
    const rpr = document.getElementById('qc-repro').value || "0";
    payload.form_data = { status_monitoring: selectedMeta.statusQCAktif, reject_pcs: rjc, repro_kg: rpr, alasan_reject_repro: document.getElementById('qc-alasan').value };
    labelStatusLog = selectedMeta.statusQCAktif;
  } else if(userActive.role === 'OEE') {
    valOut = document.getElementById('oee-capaian').value || "0";
    
    const jmMulai = document.getElementById('oee-jam-mulai').value;
    const jmSelesai = document.getElementById('oee-jam-selesai').value;
    const istirahat = Number(document.getElementById('oee-istirahat').value || 0);
    
    let durasiMenitBersih = 0;
    if (jmMulai && jmSelesai) {
      let [h1, m1] = jmMulai.split(':').map(Number);
      let [h2, m2] = jmSelesai.split(':').map(Number);
      let t1 = (h1 * 60) + m1, t2 = (h2 * 60) + m2;
      if (t2 < t1) t2 += 24 * 60;
      durasiMenitBersih = (t2 - t1) - istirahat;
      if(durasiMenitBersih < 0) durasiMenitBersih = 0;
    }

    payload.form_data = { 
      spv: document.getElementById('oee-spv').value, 
      tanggal: document.getElementById('oee-tanggal').value, 
      area: document.getElementById('oee-area').value, 
      varian: document.getElementById('oee-varian').value, 
      jam_mulai: jmMulai, 
      jam_selesai: jmSelesai, 
      istirahat_menit: istirahat.toString(), 
      capaian_pcs: valOut, 
      mp_orang: document.getElementById('oee-mp').value || "0", 
      kemas_rusak: document.getElementById('oee-rusak').value || "0", 
      alasan_rusak: document.getElementById('oee-alasan-rusak').value,
      durasi_bersih_menit: durasiMenitBersih.toString(),
      mesin: selectedMeta.mesin,
      no_mesin: selectedMeta.noMesin
    };
    labelStatusLog = "REKAP SHIFT";
  } else if(userActive.role === 'MAINTENANCE') {
    selectedMeta.mesin = document.getElementById('maint-search-mesin').value.trim() || "Mesin-Unspecified";
    selectedMeta.noMesin = document.getElementById('maint-input-no-mesin').value.trim() || "No-ID";
    
    payload.metadata.mesin = selectedMeta.mesin;
    payload.metadata.noMesin = selectedMeta.noMesin;
    
    const jenisKerusakan = document.getElementById('maint-jenis-rusak').value;
    const hasilKerja = selectedMeta.statusMaintAktif === 'SELESAI' ? document.getElementById('maint-hasil').value : "Mulai Perbaikan";
    
    payload.form_data = { jenis_kerusakan: jenisKerusakan, hasil_pengerjaan: hasilKerja, rekomendasi_solusi: document.getElementById('maint-rekomendasi').value };
    
    labelStatusLog = selectedMeta.statusMaintAktif;
    infoLogStr = `[${hasilKerja}] ${jenisKerusakan}`;
  }

  postDataKeServer(payload, () => {
    catatKeHistoryLogLokal(finalBatchNumber, selectedMeta.mesin, selectedMeta.noMesin, labelStatusLog, valOut, infoLogStr);
    alert("🚀 Sukses! Data berhasil dikirim ke Google Sheets.");
    
    document.getElementById('sic-output').value = ""; document.getElementById('qc-reject').value = ""; document.getElementById('qc-repro').value = "";
    document.getElementById('maint-search-mesin').value = ""; document.getElementById('maint-input-no-mesin').value = ""; 
    document.getElementById('maint-jenis-rusak').value = ""; document.getElementById('maint-rekomendasi').value = "";
    document.getElementById('input-eyeshadow-kit-digit').value = "";
    
    kembaliKeFilter();
    muatMasterDropdownDariServer();
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

function catatKeHistoryLogLokal(batch, mesin, noMesin, status, out, customInfo) {
  let logs = JSON.parse(localStorage.getItem('ss_table_logs')) || [];
  const mesinNoStr = `${mesin} (${noMesin})`;
  const jamSkrg = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });

  let infoDinamisStr = "-";
  if (userActive.role === 'SIC') {
    // REVISI MULTI-USER: Hitung urutan cycle hanya berdasarkan data yang diinput oleh OPERATOR yang sama agar tidak bentrok
    const hitungSama = logs.filter(l => (l.noBatch === batch || l.batch === batch) && l.mesin_no === mesinNoStr && l.role === 'SIC' && l.operator === userActive.nama).length;
    infoDinamisStr = `Cyc ${hitungSama + 1}`;
  } else if (userActive.role === 'QC') {
    const rjc = document.getElementById('qc-reject')?.value || "0";
    const rpr = document.getElementById('qc-repro')?.value || "0";
    infoDinamisStr = (status === "AWAL") ? "Start Mon" : `${rjc} Pcs / ${rpr} Kg`;
  } else if (userActive.role === 'OEE' || userActive.role === 'SPV') {
    infoDinamisStr = status === "CLOSED" ? "Locked" : `${out} Pcs`;
  } else if (userActive.role === 'MAINTENANCE') {
    infoDinamisStr = customInfo;
  }

  // REVISI UTAMA & PENYELARASAN PROPERTI MATRIKS HORIZONTAL
  logs.unshift({ 
    jam: jamSkrg, 
    batch: batch,              // Tetap simpan untuk kompatibilitas fungsi lama jika ada
    noBatch: batch,            // 🚀 KUNCI 1: Sinkron dengan matriks QC (l.noBatch)
    subbrand: selectedMeta.subbrand || "—", // 🚀 KUNCI 2: Rekam nama varian produk secara eksplisit
    mesin_no: mesinNoStr, 
    mesinLine: mesinNoStr,     // Kompatibilitas penamaan
    info: infoDinamisStr, 
    status: status,
    role: userActive.role,
    operator: userActive.nama 
  });
  
  localStorage.setItem('ss_table_logs', JSON.stringify(logs));
  renderHistoryTable();
}

function renderHistoryTable() {
  const tBody = document.getElementById('history-table-body');
  const logs = JSON.parse(localStorage.getItem('ss_table_logs')) || [];
  
  const containerTabel = document.getElementById('sec-history');
  const headTabel = containerTabel.querySelector('thead');

  // =========================================================================
  // 🧪 KONDISI KHUSUS: JIKA YANG LOGIN ADALAH TIM QC
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

    // Filter log murni milik operator QC yang aktif
    const qcLogs = logs.filter(l => l.operator === userActive.nama);

    if(qcLogs.length === 0) {
      tBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#aaa; font-style:italic;">Belum ada riwayat pemeriksaan QC shift ini.</td></tr>`;
      return;
    }

    // Kelompokkan data vertikal menjadi horizontal matriks
    const grupQC = {};
    
    // Looping dari data terlama ke terbaru (indeks besar ke kecil)
    for (let i = qcLogs.length - 1; i >= 0; i--) {
      const l = qcLogs[i];
      
      if (!grupQC[l.noBatch]) {
        grupQC[l.noBatch] = {
          noBatch: l.noBatch,
          // 🚀 PERBAIKAN UTAMA: Ambil properti mesinLine dari penyimpanan lokal log
          mesinLine: l.mesinLine || l.mesin_no || selectedMeta.mesin + " (" + selectedMeta.noMesin + ")" || "—",
          awal: { detail: "Belum", ada: false },
          akhir: { detail: "Belum", ada: false }
        };
      }
      
      // Jika di inputan akhir ada data mesin yang lebih ter-update, kunci datanya
      if (l.mesinLine && l.mesinLine !== "—") {
        grupQC[l.noBatch].mesinLine = l.mesinLine;
      }
      
      if (l.status === "AWAL") {
        grupQC[l.noBatch].awal = { detail: l.jam, ada: true };
      } else if (l.status === "AKHIR") {
        grupQC[l.noBatch].akhir = { detail: l.jam, ada: true };
      }
    }

    // Gambar baris horizontal ke layar browser HP
    const arrGrup = Object.values(grupQC).reverse(); // Batch terbaru berada di atas
    tBody.innerHTML = arrGrup.map(g => {
      const badgeAwal = g.awal.ada 
        ? `<span class="status-badge" style="background:#389e0d; display:block; padding:4px 0; font-size:10px;">✓ ${g.awal.detail}</span>` 
        : `<span class="status-badge" style="background:#bfbfbf; display:block; padding:4px 0; font-size:10px; color:#fff;">Belum</span>`;
        
      const badgeAkhir = g.akhir.ada 
        ? `<span class="status-badge" style="background:#cf1322; display:block; padding:4px 0; font-size:10px;">✓ ${g.akhir.detail}</span>` 
        : `<span class="status-badge" style="background:#bfbfbf; display:block; padding:4px 0; font-size:10px; color:#fff;">Belum</span>`;

      return `
        <tr>
          <td style="font-weight:600; vertical-align:middle; padding:10px 4px;">${g.noBatch}</td>
          <td style="color:#262626; font-size:11px; vertical-align:middle; padding:10px 4px; font-weight:500;">${g.mesinLine}</td>
          <td style="text-align:center; vertical-align:middle; padding:10px 4px;">${badgeAwal}</td>
          <td style="text-align:center; vertical-align:middle; padding:10px 4px;">${badgeAkhir}</td>
        </tr>
      `;
    }).join('');

    return;
  }

  // =========================================================================
  // ⚙️ KONDISI DEFAULT: JIKA ROLE NON-QC (SIC, OEE, MAINTENANCE)
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

  const filteredNonQC = logs.filter(l => l.role === userActive.role && l.operator === userActive.nama);
  
  if(filteredNonQC.length === 0) {
    tBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#aaa; font-style:italic;">Belum ada riwayat input shift ini.</td></tr>`;
    return;
  }

  tBody.innerHTML = filteredNonQC.map(l => {
    let colorBadge = "#096dd9";
    if (l.status === "ISTIRAHAT") colorBadge = "#d46b08";
    if (l.status === "SELESAI" || l.status === "AKHIR" || l.status === "CLOSED" || l.status === "REKAP SHIFT") colorBadge = "#cf1322";
    if (l.status === "MULAI" || l.status === "SANITASI" || l.status === "TENGAH") colorBadge = "#389e0d";

    return `<tr>
      <td style="padding:8px 4px;">${l.jam}</td>
      <td style="font-weight:600; padding:8px 4px;">${l.noBatch}</td>
      <td style="padding:8px 4px;">${l.mesinLine || "—"}</td>
      <td style="color:#666; font-size:10px; padding:8px 4px;">${l.info}</td>
      <td style="text-align:center; padding:8px 4px;"><span class="status-badge" style="background:${colorBadge};">${l.status}</span></td>
    </tr>`;
  }).join('');
}

function clearHistoryLokal() { localStorage.removeItem('ss_table_logs'); renderHistoryTable(); }
