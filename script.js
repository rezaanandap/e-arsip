/* =========================================================
   E-ARSIP FRONTEND SCRIPT (GitHub Pages)
   - Works for: index.html, login.html, admin.html
   - Requires:
     - SweetAlert2 CDN
     - style.css
   ========================================================= */

/* ==========================
   0) CONFIG
   ========================== */

// GANTI INI: URL WEB APP GAS KAMU
const API_URL = "https://script.google.com/macros/s/AKfycbyDwXl2RwtHta9h5sKjhFl_DbaUwIYKpKjJ7ujkhg-tdV3HR21ZGNGIiiGNWFhnW2MP/exec";

// Key localStorage
const LS_ADMIN = "EARSP_ADMIN_SESSION";

// Batas file upload
const MAX_UPLOAD_MB = 2;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/* ==========================
   1) HELPERS UI
   ========================== */

function $(id) {
  return document.getElementById(id);
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setBtnLoading(btn, isLoading, labelLoading = "Memproses...") {
  if (!btn) return;

  if (isLoading) {
    btn.dataset.oldText = btn.innerHTML;
    btn.classList.add("loading");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${escapeHTML(labelLoading)}`;
  } else {
    btn.classList.remove("loading");
    btn.disabled = false;
    btn.innerHTML = btn.dataset.oldText || "Simpan";
  }
}

function setBtnLoadingDark(btn, isLoading, labelLoading = "Memproses...") {
  if (!btn) return;

  if (isLoading) {
    btn.dataset.oldText = btn.innerHTML;
    btn.classList.add("loading");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner dark"></span> ${escapeHTML(labelLoading)}`;
  } else {
    btn.classList.remove("loading");
    btn.disabled = false;
    btn.innerHTML = btn.dataset.oldText || "Simpan";
  }
}

/* ==========================
   2) SWEETALERT WRAPPER
   ========================== */

async function swalInfo(title, text = "") {
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: "#4f46e5"
  });
}

async function swalSuccess(title, text = "") {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: "#4f46e5"
  });
}

async function swalError(title, text = "") {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: "#4f46e5"
  });
}

async function swalConfirm(title, text, confirmText = "Ya, Lanjut") {
  const res = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Batal",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b"
  });
  return res.isConfirmed;
}

/* ==========================
   3) API CALL
   ========================== */

async function apiCall(action, data = {}) {
  try {
    const payload = { action, ...data };
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const res = await response.json();
    if (!res.success) throw new Error(res.message);
    return res;
  } catch (err) {
    console.error("API Error:", err);
    Swal.fire("Error System", err.message, "error");
    throw err;
  }
}

/* ==========================
   4) SESSION ADMIN
   ========================== */

function saveAdminSession(session) {
  localStorage.setItem(LS_ADMIN, JSON.stringify(session));
}

function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(LS_ADMIN) || "null");
  } catch (e) {
    return null;
  }
}

function clearAdminSession() {
  localStorage.removeItem(LS_ADMIN);
}

/* ==========================
   5) INDEX.HTML (PUBLIC)
   ========================== */

// Inisialisasi index
async function initIndexPage() {
  // set default date today jika ada
  const tgl = $("tanggalDokumen");
  if (tgl && !tgl.value) {
    const now = new Date();
    tgl.value = now.toISOString().slice(0, 10);
  }

  // load dropdown jenis (ref_jenis)
  await loadRefJenis();

  // load dropdown tipe arsip (ref_tipe_arsip)
  await loadRefTipeArsip();

  // tab default
  showPublicTab("tabNomor");

  // listener tipe dokumen untuk form dynamic
  const tipeSelect = $("tipeDokumen");
  if (tipeSelect) {
    tipeSelect.addEventListener("change", () => {
      renderFormByTipe(tipeSelect.value);
    });
    renderFormByTipe(tipeSelect.value);
  }

  // search realtime (debounce)
  const searchInput = $("searchKeyword");
  if (searchInput) {
    let timer;
    searchInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        doPublicSearch();
      }, 450);
    });
  }
}

function showPublicTab(tabId) {
  const tabs = ["tabNomor", "tabArsip", "tabCari"];
  tabs.forEach(id => {
    const el = $(id);
    if (el) el.classList.add("hidden");
  });

  const t = $(tabId);
  if (t) t.classList.remove("hidden");

  // update tab button active
  ["btnTabNomor", "btnTabArsip", "btnTabCari"].forEach(btnId => {
    const b = $(btnId);
    if (!b) return;
    b.classList.remove("active");
  });

  const map = {
    tabNomor: "btnTabNomor",
    tabArsip: "btnTabArsip",
    tabCari: "btnTabCari"
  };

  const activeBtn = $(map[tabId]);
  if (activeBtn) activeBtn.classList.add("active");
}

/* ==========================
   5A) REF DROPDOWN
   ========================== */

async function loadRefJenis() {
  const select = $("jenisDokumen");
  if (!select) return;

  select.innerHTML = `<option value="">Memuat...</option>`;

  try {
    const res = await apiCall("getRefJenis", {});
    if (!res.success) throw new Error(res.message || "Gagal load ref jenis");

    select.innerHTML = `<option value="">-- Pilih Jenis --</option>`;
    res.data.forEach(item => {
      select.innerHTML += `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`;
    });
  } catch (err) {
    select.innerHTML = `<option value="">(Gagal memuat)</option>`;
  }
}

async function loadRefTipeArsip() {
  const select = $("arsipTipe");
  if (!select) return;

  select.innerHTML = `<option value="">Memuat...</option>`;

  try {
    const res = await apiCall("getRefTipeArsip", {});
    if (!res.success) throw new Error(res.message || "Gagal load ref tipe arsip");

    select.innerHTML = `<option value="">-- Pilih Tipe --</option>`;
    res.data.forEach(item => {
      select.innerHTML += `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`;
    });
  } catch (err) {
    select.innerHTML = `<option value="">(Gagal memuat)</option>`;
  }
}

/* ==========================
   5B) FORM DYNAMIC BY TIPE
   ========================== */

function renderFormByTipe(tipe) {
  const area = $("dynamicFields");
  if (!area) return;

  // reset
  area.innerHTML = "";

  // SuratKeluar: tampilkan Jenis Dokumen + Tujuan
  if (tipe === "SuratKeluar") {
    area.innerHTML = `
      <div>
        <div class="label">Jenis Dokumen</div>
        <select id="jenisDokumen" class="select"></select>
        <div class="hint">Diambil dari sheet: ref_jenis</div>
      </div>

      <div>
        <div class="label">Tujuan</div>
        <input id="tujuan" class="input" placeholder="Contoh: KPU Provinsi / Bawaslu / Instansi" />
      </div>
    `;
    loadRefJenis();
  }

  // BeritaAcara: tidak ada tambahan
  if (tipe === "BeritaAcara") {
    area.innerHTML = `
      <div class="hint">Berita Acara tidak membutuhkan kolom tambahan.</div>
    `;
  }

  // SuratKeputusan: jenis SK + tanggal SK
  if (tipe === "SuratKeputusan") {
    area.innerHTML = `
      <div>
        <div class="label">Jenis SK</div>
        <input id="jenisSK" class="input" placeholder="Sekretaris/Ketua" />
      </div>

      <div>
        <div class="label">Tanggal SK</div>
        <input id="tanggalSK" type="date" class="input" />
      </div>
    `;
    const tgl = $("tanggalSK");
    if (tgl && !tgl.value) tgl.value = new Date().toISOString().slice(0, 10);
  }

  // SuratTugas: nama petugas
  if (tipe === "SuratTugas") {
    area.innerHTML = `
      <div>
        <div class="label">Nama Petugas</div>
        <input id="namaPetugas" class="input" placeholder="Nama-nama yang ditugaskan" />
      </div>
      <div class="hint">Isi sesuai SuratTugas: Nama-nama yang ditugaskan</div>
    `;
  }

  // refresh validasi tanggal terakhir
  refreshLastTanggal(tipe);
}

async function refreshLastTanggal(tipe) {
  const hint = $("lastTanggalHint");
  const tglInput = $("tanggalDokumen");
  if (!hint || !tglInput) return;

  hint.innerHTML = `Memuat tanggal terakhir...`;

  try {
    const res = await apiCall("getLastTanggalByTipe", { tipe });
    if (!res.success) throw new Error(res.message || "Gagal");

    const last = res.lastTanggal || "";
    if (!last) {
      hint.innerHTML = `Belum ada data sebelumnya.`;
      tglInput.min = "";
      return;
    }

    hint.innerHTML = `Tanggal terakhir: <b>${escapeHTML(last)}</b> (tanggal baru tidak boleh lebih kecil)`;
    tglInput.min = last;
  } catch (err) {
    hint.innerHTML = `Gagal mengambil tanggal terakhir.`;
  }
}

/* ==========================
   5C) SUBMIT NOMOR DOKUMEN
   ========================== */

async function submitNomor() {
  const btn = $("btnSubmitNomor");
  setBtnLoading(btn, true, "Menyimpan...");

  try {
    const tipe = $("tipeDokumen")?.value || "";
    const perihal = $("perihal")?.value || "";
    const pengambil = $("pengambil")?.value || "";
    const tanggalDokumen = $("tanggalDokumen")?.value || "";
    const kodeManual = $("kodeManual")?.value || "";

    if (!tipe) throw new Error("Tipe dokumen wajib dipilih.");
    if (!perihal) throw new Error("Perihal wajib diisi.");
    if (!pengambil) throw new Error("Pengambil wajib diisi.");
    if (!tanggalDokumen) throw new Error("Tanggal dokumen wajib diisi.");

    const payload = {
      tipe,
      perihal,
      pengambil,
      tanggalDokumen,
      kodeManual: tipe === "SuratKeputusan" ? "" : kodeManual,
      jenis: "",
      tujuan: "",
      jenisSK: "",
      tanggalSK: "",
      namaPetugas: ""
    };

    if (tipe === "SuratKeluar") {
      payload.jenis = $("jenisDokumen")?.value || "";
      payload.tujuan = $("tujuan")?.value || "";
      if (!payload.jenis) throw new Error("Jenis dokumen wajib dipilih.");
      if (!payload.tujuan) throw new Error("Tujuan wajib diisi.");
    }

    if (tipe === "SuratKeputusan") {
      payload.jenisSK = $("jenisSK")?.value || "";
      payload.tanggalSK = $("tanggalSK")?.value || "";
      if (!payload.jenisSK) throw new Error("Jenis SK wajib diisi.");
      if (!payload.tanggalSK) throw new Error("Tanggal SK wajib diisi.");
    }

    if (tipe === "SuratTugas") {
      payload.namaPetugas = $("namaPetugas")?.value || "";
      if (!payload.namaPetugas) throw new Error("Nama Petugas wajib diisi.");
    }

    // validasi kode manual untuk selain SK
    if (tipe !== "SuratKeputusan" && !payload.kodeManual) {
      throw new Error("Kode surat wajib diisi (contoh: KPU-KAB/XXX).");
    }

    const res = await apiCall("addNumber", payload);
    if (!res.success) throw new Error(res.message || "Gagal menyimpan");

    await swalSuccess("Berhasil!", "Nomor dokumen berhasil dibuat:\n" + res.nomor);

    renderNomorCards(tipe, res.nomor, tanggalDokumen, perihal);

    // refresh tanggal terakhir
    await refreshLastTanggal(tipe);

  } catch (err) {
    await swalError("Gagal", String(err.message || err));
  } finally {
    setBtnLoading(btn, false);
  }
}

function renderNomorCards(tipe, nomor, tanggal, perihal) {
  const area = $("hasilCards");
  if (!area) return;

  const card = document.createElement("div");
  card.className = "stat";
  card.innerHTML = `
    <div class="k">${escapeHTML(tipe)}</div>
    <div class="v">${escapeHTML(nomor)}</div>
    <div class="mini">
      <b>Tanggal:</b> ${escapeHTML(tanggal)}<br/>
      <b>Perihal:</b> ${escapeHTML(perihal)}
    </div>
  `;

  area.prepend(card);
}

/* ==========================
   5D) UPLOAD ARSIP PDF
   ========================== */

async function submitArsip() {
  const btn = $("btnSubmitArsip");
  setBtnLoading(btn, true, "Mengupload...");

  try {
    const nomor = $("arsipNomor")?.value || "";
    const perihal = $("arsipPerihal")?.value || "";
    const tipe = $("arsipTipe")?.value || "";
    const pengunggah = $("arsipPengunggah")?.value || "";
    const fileInput = $("arsipFile");

    if (!nomor || !perihal || !tipe || !pengunggah) {
      throw new Error("Semua kolom arsip wajib diisi.");
    }

    if (!fileInput || !fileInput.files || fileInput.files.length < 1) {
      throw new Error("File PDF wajib dipilih.");
    }

    const file = fileInput.files[0];

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Format file harus PDF.");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`Ukuran file maksimal ${MAX_UPLOAD_MB} MB.`);
    }

    const base64 = await fileToBase64(file);

    const payload = {
      nomor,
      perihal,
      tipe,
      pengunggah,
      filename: file.name,
      file: base64
    };

    const res = await apiCall("uploadArsip", payload);
    if (!res.success) throw new Error(res.message || "Upload gagal");

    await swalSuccess("Berhasil!", "Dokumen berhasil diarsipkan.");

    // reset form
    $("arsipNomor").value = "";
    $("arsipPerihal").value = "";
    $("arsipTipe").value = "";
    $("arsipPengunggah").value = "";
    $("arsipFile").value = "";

  } catch (err) {
    await swalError("Gagal", String(err.message || err));
  } finally {
    setBtnLoading(btn, false);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ==========================
   5E) PUBLIC SEARCH + EDIT MODAL
   ========================== */

async function doPublicSearch() {
  const keyword = $("searchKeyword")?.value || "";
  const areaLogs = $("searchLogs");
  const areaArsip = $("searchArsip");

  if (!areaLogs || !areaArsip) return;

  if (!keyword.trim()) {
    areaLogs.innerHTML = `<div class="hint">Masukkan kata kunci untuk mencari...</div>`;
    areaArsip.innerHTML = `<div class="hint">Masukkan kata kunci untuk mencari...</div>`;
    return;
  }

  areaLogs.innerHTML = `<div class="hint">Mencari...</div>`;
  areaArsip.innerHTML = `<div class="hint">Mencari...</div>`;

  try {
    const res = await apiCall("search", { keyword });
    if (!res.success) throw new Error(res.message || "Gagal search");

    // logs
    if (!res.logs || res.logs.length === 0) {
      areaLogs.innerHTML = `<div class="hint">Tidak ada hasil di pencatatan nomor.</div>`;
    } else {
      areaLogs.innerHTML = renderLogsTable(res.logs, false);
      bindEditButtons("public");
    }

    // arsip
    if (!res.archives || res.archives.length === 0) {
      areaArsip.innerHTML = `<div class="hint">Tidak ada hasil di arsip digital.</div>`;
    } else {
      areaArsip.innerHTML = renderArsipTable(res.archives);
    }

  } catch (err) {
    areaLogs.innerHTML = `<div class="hint">Gagal: ${escapeHTML(err.message || err)}</div>`;
    areaArsip.innerHTML = `<div class="hint">Gagal: ${escapeHTML(err.message || err)}</div>`;
  }
}

function renderLogsTable(items, isAdmin) {
  // items: [{tipe,rowIdx,data}]
  let html = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tipe</th>
            <th>Row</th>
            <th>Data</th>
            <th class="no-print">Aksi</th>
          </tr>
        </thead>
        <tbody>
  `;

  items.forEach(it => {
    html += `
      <tr>
        <td><span class="badge primary">${escapeHTML(it.tipe)}</span></td>
        <td>${escapeHTML(it.rowIdx)}</td>
        <td style="max-width:520px;">
          ${escapeHTML(it.data.join(" | "))}
        </td>
        <td class="no-print">
          <button class="btn btn-sm btn-soft btnEditRow"
            data-tipe="${escapeHTML(it.tipe)}"
            data-rowidx="${escapeHTML(it.rowIdx)}"
            data-admin="${isAdmin ? "1" : "0"}"
          >
            Edit
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function renderArsipTable(items) {
  let html = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nomor</th>
            <th>Perihal</th>
            <th>Tipe</th>
            <th>Pengunggah</th>
            <th>Tanggal</th>
            <th class="no-print">Download</th>
          </tr>
        </thead>
        <tbody>
  `;

  items.forEach(it => {
    html += `
      <tr>
        <td>${escapeHTML(it.nomor)}</td>
        <td>${escapeHTML(it.perihal)}</td>
        <td><span class="badge">${escapeHTML(it.tipe)}</span></td>
        <td>${escapeHTML(it.pengunggah)}</td>
        <td>${escapeHTML(String(it.tanggal || ""))}</td>
        <td class="no-print">
          <a class="btn btn-sm btn-outline" href="${escapeHTML(it.downloadUrl)}" target="_blank">
            Download
          </a>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/* ==========================
   6) MODAL EDIT (shared)
   ========================== */

let EDIT_CONTEXT = null;

function bindEditButtons(mode) {
  document.querySelectorAll(".btnEditRow").forEach(btn => {
    btn.addEventListener("click", () => {
      const tipe = btn.dataset.tipe;
      const rowIdx = Number(btn.dataset.rowidx);
      openEditModal(tipe, rowIdx, mode);
    });
  });
}

async function openEditModal(tipe, rowIdx, mode) {
  // mode: public/admin
  EDIT_CONTEXT = { tipe, rowIdx, mode };

  // modal elements must exist in html
  const backdrop = $("modalBackdrop");
  const body = $("modalBody");
  const title = $("modalTitle");

  if (!backdrop || !body || !title) {
    await swalError("Error UI", "Modal belum ada di HTML.");
    return;
  }

  title.innerText = `Edit Data (${tipe} - Row ${rowIdx})`;
  body.innerHTML = `<div class="hint">Silakan pilih kolom dan isi nilai baru.</div>`;

  // render select kolom berdasarkan tipe
  const headersMap = {
    SuratKeluar: ["Jenis Dokumen", "Perihal", "Tujuan", "Pengambil"],
    BeritaAcara: ["Perihal", "Pengambil"],
    SuratKeputusan: ["Perihal", "Jenis SK", "Tanggal SK", "Pengambil"],
    SuratTugas: ["Perihal", "Nama Petugas", "Pengambil"],
  };

  const columns = headersMap[tipe] || ["Perihal", "Pengambil"];

  body.innerHTML = `
    <div class="form">
      <div>
        <div class="label">Kolom</div>
        <select id="editColumn" class="select">
          ${columns.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("")}
        </select>
      </div>

      <div>
        <div class="label">Nilai Baru</div>
        <input id="editValue" class="input" placeholder="Isi nilai baru..." />
        <div class="hint">Nomor Dokumen & Tanggal Dokumen tidak bisa diedit oleh user publik.</div>
      </div>
    </div>
  `;

  backdrop.classList.add("show");
}

function closeEditModal() {
  const backdrop = $("modalBackdrop");
  if (backdrop) backdrop.classList.remove("show");
  EDIT_CONTEXT = null;
}

async function submitEditModal() {
  const btn = $("btnModalSave");
  setBtnLoading(btn, true, "Menyimpan...");

  try {
    if (!EDIT_CONTEXT) throw new Error("Context edit kosong.");

    const columnName = $("editColumn")?.value || "";
    const newValue = $("editValue")?.value || "";

    if (!columnName) throw new Error("Kolom wajib dipilih.");
    if (!newValue.trim()) throw new Error("Nilai baru wajib diisi.");

    // role = publik default
    let role = "user";
    const session = getAdminSession();
    if (EDIT_CONTEXT.mode === "admin" && session?.role) role = session.role;

    const payload = {
      tipe: EDIT_CONTEXT.tipe,
      rowIdx: EDIT_CONTEXT.rowIdx,
      columnName,
      newValue,
      role
    };

    const res = await apiCall("editData", payload);
    if (!res.success) throw new Error(res.message || "Edit gagal");

    await swalSuccess("Berhasil", "Data berhasil diubah.");
    closeEditModal();

    // refresh sesuai page
    if (EDIT_CONTEXT.mode === "admin") {
      await adminLoadTables();
    } else {
      await doPublicSearch();
    }

  } catch (err) {
    await swalError("Gagal", String(err.message || err));
  } finally {
    setBtnLoading(btn, false);
  }
}

/* ==========================
   7) LOGIN.HTML
   ========================== */

async function initLoginPage() {
  // nothing special
}

async function submitAdminLogin() {
  const btn = $("btnLogin");
  setBtnLoading(btn, true, "Login...");

  try {
    const username = $("adminUsername")?.value || "";
    const password = $("adminPassword")?.value || "";

    if (!username || !password) throw new Error("Username & password wajib.");

    const res = await apiCall("login", { username, password });
    if (!res.success) throw new Error(res.message || "Login gagal");

    saveAdminSession(res);

    await swalSuccess("Login Berhasil", `Selamat datang, ${res.username} (${res.role})`);

    window.location.href = "admin.html";

  } catch (err) {
    await swalError("Login Gagal", String(err.message || err));
  } finally {
    setBtnLoading(btn, false);
  }
}

/* ==========================
   8) ADMIN.HTML
   ========================== */

async function initAdminPage() {
  const session = getAdminSession();
  if (!session || !session.role) {
    await swalError("Akses Ditolak", "Silakan login admin terlebih dahulu.");
    window.location.href = "login.html";
    return;
  }

  // tampilkan nama admin
  if ($("adminName")) $("adminName").innerText = session.username;
  if ($("adminRole")) $("adminRole").innerText = session.role;

  // default tab
  showAdminTab("adminTabDashboard");

  // load stats + tables
  await adminLoadStats();
  await adminLoadTables();
  await adminLoadAdmins();
}

function showAdminTab(tabId) {
  const tabs = ["adminTabDashboard", "adminTabArsip", "adminTabAdmins", "adminTabDanger"];
  tabs.forEach(id => $(id)?.classList.add("hidden"));
  $(tabId)?.classList.remove("hidden");

  ["btnAdminDash", "btnAdminArsip", "btnAdminAdmins", "btnAdminDanger"].forEach(id => {
    $(id)?.classList.remove("active");
  });

  const map = {
    adminTabDashboard: "btnAdminDash",
    adminTabArsip: "btnAdminArsip",
    adminTabAdmins: "btnAdminAdmins",
    adminTabDanger: "btnAdminDanger"
  };

  $(map[tabId])?.classList.add("active");
}

async function adminLoadStats() {
  const session = getAdminSession();
  if (!session) return;

  try {
    const res = await apiCall("getDashboardStats", { role: session.role });
    if (!res.success) throw new Error(res.message || "Gagal stats");

    // render card
    if ($("statSuratKeluar")) $("statSuratKeluar").innerText = res.totals.SuratKeluar ?? 0;
    if ($("statBeritaAcara")) $("statBeritaAcara").innerText = res.totals.BeritaAcara ?? 0;
    if ($("statSuratKeputusan")) $("statSuratKeputusan").innerText = res.totals.SuratKeputusan ?? 0;
    if ($("statSuratTugas")) $("statSuratTugas").innerText = res.totals.SuratTugas ?? 0;
    if ($("statArsip")) $("statArsip").innerText = res.totalArsip ?? 0;

  } catch (err) {
    // silent
  }
}

async function adminLoadTables() {
  const session = getAdminSession();
  if (!session) return;

  // logs table
  const tipe = $("adminFilterTipe")?.value || "ALL";
  const keyword = $("adminKeyword")?.value || "";

  const area = $("adminLogsArea");
  if (area) area.innerHTML = `<div class="hint">Memuat data...</div>`;

  try {
    const res = await apiCall("getTableData", {
      role: session.role,
      mode: "logs",
      tipe,
      keyword
    });

    if (!res.success) throw new Error(res.message || "Gagal load logs");

    if (!res.items || res.items.length === 0) {
      if (area) area.innerHTML = `<div class="hint">Tidak ada data.</div>`;
    } else {
      // tampilkan table lebih detail
      if (area) area.innerHTML = renderAdminLogsTable(res.items);
      bindAdminRowActions();
    }

  } catch (err) {
    if (area) area.innerHTML = `<div class="hint">Gagal: ${escapeHTML(err.message || err)}</div>`;
  }

  // arsip table
  const areaArsip = $("adminArsipArea");
  if (areaArsip) areaArsip.innerHTML = `<div class="hint">Memuat arsip...</div>`;

  try {
    const res2 = await apiCall("getTableData", {
      role: session.role,
      mode: "arsip",
      keyword: $("adminKeywordArsip")?.value || ""
    });

    if (!res2.success) throw new Error(res2.message || "Gagal load arsip");

    if (!res2.items || res2.items.length === 0) {
      if (areaArsip) areaArsip.innerHTML = `<div class="hint">Tidak ada arsip.</div>`;
    } else {
      if (areaArsip) areaArsip.innerHTML = renderAdminArsipTable(res2.items);
      bindAdminArsipDelete();
    }

  } catch (err) {
    if (areaArsip) areaArsip.innerHTML = `<div class="hint">Gagal: ${escapeHTML(err.message || err)}</div>`;
  }

  // refresh stats
  await adminLoadStats();
}

function renderAdminLogsTable(items) {
  let html = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tipe</th>
            <th>Row</th>
            <th>Ringkas</th>
            <th class="no-print">Aksi</th>
          </tr>
        </thead>
        <tbody>
  `;

  items.forEach(it => {
    const joined = it.data.join(" | ");

    html += `
      <tr>
        <td><span class="badge primary">${escapeHTML(it.tipe)}</span></td>
        <td>${escapeHTML(it.rowIdx)}</td>
        <td style="max-width:520px;">${escapeHTML(joined)}</td>
        <td class="no-print">
          <button class="btn btn-sm btn-soft btnEditRow"
            data-tipe="${escapeHTML(it.tipe)}"
            data-rowidx="${escapeHTML(it.rowIdx)}"
            data-admin="1"
          >Edit</button>

          <button class="btn btn-sm btn-danger btnDeleteRow"
            data-tipe="${escapeHTML(it.tipe)}"
            data-rowidx="${escapeHTML(it.rowIdx)}"
          >Delete</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function renderAdminArsipTable(items) {
  let html = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Row</th>
            <th>Nomor</th>
            <th>Perihal</th>
            <th>Tipe</th>
            <th>Pengunggah</th>
            <th>Tanggal</th>
            <th class="no-print">Download</th>
          </tr>
        </thead>
        <tbody>
  `;

  items.forEach(it => {
    html += `
      <tr>
        <td>${escapeHTML(it.rowIdx)}</td>
        <td>${escapeHTML(it.data[0])}</td>
        <td>${escapeHTML(it.data[1])}</td>
        <td><span class="badge">${escapeHTML(it.data[2])}</span></td>
        <td>${escapeHTML(it.data[3])}</td>
        <td>${escapeHTML(String(it.data[5] || ""))}</td>
        <td class="no-print">
          <a class="btn btn-sm btn-outline" href="${escapeHTML(it.downloadUrl)}" target="_blank">Download</a>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function bindAdminRowActions() {
  // edit
  bindEditButtons("admin");

  // delete
  document.querySelectorAll(".btnDeleteRow").forEach(btn => {
    btn.addEventListener("click", async () => {
      const tipe = btn.dataset.tipe;
      const rowIdx = Number(btn.dataset.rowidx);
      await adminDeleteRow(tipe, rowIdx);
    });
  });
}

async function adminDeleteRow(tipe, rowIdx) {
  const session = getAdminSession();
  if (!session) return;

  const ok = await swalConfirm("Hapus Data?", `Yakin ingin menghapus ${tipe} row ${rowIdx}?`, "Ya, Hapus");
  if (!ok) return;

  try {
    const res = await apiCall("deleteRow", {
      role: session.role,
      tipe,
      rowIdx
    });

    if (!res.success) throw new Error(res.message || "Delete gagal");

    await swalSuccess("Berhasil", "Data berhasil dihapus.");
    await adminLoadTables();

  } catch (err) {
    await swalError("Gagal", String(err.message || err));
  }
}

function bindAdminArsipDelete() {
  // (opsional) nanti kalau mau delete arsip digital kita tambah API
}

/* ==========================
   8A) ADMIN FILTER & SEARCH
   ========================== */

async function adminDoSearch() {
  await adminLoadTables();
}

async function adminDoSearchArsip() {
  await adminLoadTables();
}

/* ==========================
   8B) ADMIN PRINT REPORT
   ========================== */

async function adminPrintReport() {
  const session = getAdminSession();
  if (!session) return;

  const tipe = $("adminPrintTipe")?.value || "ALL";
  const startDate = $("adminPrintStart")?.value || "";
  const endDate = $("adminPrintEnd")?.value || "";

  const btn = $("btnAdminPrint");
  setBtnLoading(btn, true, "Menyiapkan...");

  try {
    const res = await apiCall("printReportData", {
      role: session.role,
      tipe,
      startDate,
      endDate
    });

    if (!res.success) throw new Error(res.message || "Gagal print data");

    const items = res.items || [];

    if (items.length === 0) {
      await swalInfo("Kosong", "Tidak ada data pada filter tersebut.");
      return;
    }

    // render printable area
    const area = $("printArea");
    if (!area) throw new Error("printArea tidak ada di admin.html");

    const now = new Date();
    area.innerHTML = `
      <div class="card" style="margin-top:14px;">
        <h2 style="margin:0;font-weight:950;">Laporan Dokumen</h2>
        <div class="hint">
          Dicetak: ${escapeHTML(now.toLocaleString("id-ID"))}<br/>
          Filter: ${escapeHTML(tipe)} | ${escapeHTML(startDate || "-")} s/d ${escapeHTML(endDate || "-")}
        </div>
        <hr class="sep"/>
        ${renderPrintableReport(items)}
      </div>
    `;

    await swalInfo("Siap Dicetak", "Laporan sudah disiapkan. Klik OK untuk membuka print.");
    window.print();

  } catch (err) {
    await swalError("Gagal", String(err.message || err));
  } finally {
    setBtnLoading(btn, false);
  }
}

function renderPrintableReport(items) {
  // ambil header gabungan minimal
  let html = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tipe</th>
            <th>No Urut</th>
            <th>Nomor Dokumen</th>
            <th>Perihal</th>
            <th>Tanggal</th>
            <th>Pengambil</th>
          </tr>
        </thead>
        <tbody>
  `;

  items.forEach(it => {
    const headers = it.headers || [];
    const data = it.data || [];

    const idxNoUrut = headers.indexOf("No Urut");
    const idxNomor = headers.indexOf("Nomor Dokumen");
    const idxPerihal = headers.indexOf("Perihal");
    const idxTgl = headers.indexOf("Tanggal Dokumen");
    const idxPengambil = headers.indexOf("Pengambil");

    html += `
      <tr>
        <td>${escapeHTML(it.tipe)}</td>
        <td>${escapeHTML(data[idxNoUrut] ?? "")}</td>
        <td>${escapeHTML(data[idxNomor] ?? "")}</td>
        <td>${escapeHTML(data[idxPerihal] ?? "")}</td>
        <td>${escapeHTML(data[idxTgl] ?? "")}</td>
        <td>${escapeHTML(data[idxPengambil] ?? "")}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/* ==========================
   8C) ADMIN MANAGEMENT
   ========================== */

async function adminLoadAdmins() {
  const session = getAdminSession();
  if (!session) return;

  const area = $("adminAdminsArea");
  if (area) area.innerHTML = `<div class="hint">Memuat admin...</div>`;

  try {
    const res = await apiCall("getAdmins", { role: session.role });
    if (!res.success) throw new Error(res.message || "Gagal load admin");

    const items = res.items || [];

    if (items.length === 0) {
      if (area) area.innerHTML = `<div class="hint">Tidak ada admin.</div>`;
      return;
    }

    let html = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th class="no-print">Aksi</th>
            </tr>
          </thead>
          <tbody>
    `;

    items.forEach(it => {
      const canDelete = session.role === "super admin" && it.username !== "superadmin";

      html += `
        <tr>
          <td><b>${escapeHTML(it.username)}</b></td>
          <td><span class="badge">${escapeHTML(it.role)}</span></td>
          <td class="no-print">
            ${canDelete ? `
              <button class="btn btn-sm btn-danger btnDeleteAdmin"
                data-rowidx="${escapeHTML(it.rowIdx)}"
                data-username="${escapeHTML(it.username)}"
              >Delete</button>
            ` : `<span class="hint">-</span>`}
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    if (area) area.innerHTML = html;

    // bind delete
    document.querySelectorAll(".btnDeleteAdmin").forEach(btn => {
      btn.addEventListener("click", async () => {
        await adminDeleteAdmin(Number(btn.dataset.rowidx), btn.dataset.username);
      });
    });

  } catch (err) {
    if (area) area.innerHTML = `<div class="hint">Gagal: ${escapeHTML(err.message || err)}</div>`;
  }
}

async function adminAddAdmin() {
  const session = getAdminSession();
  if (!session) return;

  if (session.role !== "super admin") {
    await swalError("Akses Ditolak", "Hanya Super Admin yang dapat menambah admin.");
    return;
  }

  const btn = $("btnAddAdmin");
  setBtnLoading(btn, true, "Menambah...");

  try {
    const newUsername = $("newAdminUsername")?.value || "";
    const newPassword = $("newAdminPassword")?.value || "";

    if (!newUsername || !newPassword) throw new Error("Username & password wajib.");

    const res = await apiCall("addNewAdmin", {
      requesterRole: session.role,
      newUsername,
      newPassword
    });

    if (!res.success) throw new Error(res.message || "Gagal tambah admin");

    await swalSuccess("Berhasil", "Admin baru berhasil ditambahkan.");

    $("newAdminUsername").value = "";
    $("newAdminPassword").value = "";

    await adminLoadAdmins();

  } catch (err) {
    await swalError("Gagal", String(err.message || err));
  } finally {
    setBtnLoading(btn, false);
  }
}

async function adminDeleteAdmin(rowIdx, username) {
  const session = getAdminSession();
  if (!session) return;

  if (session.role !== "super admin") {
    await swalError("Akses Ditolak", "Hanya Super Admin yang dapat menghapus admin.");
    return;
  }

  const ok = await swalConfirm("Hapus Admin?", `Yakin hapus admin: ${username}?`, "Ya, Hapus");
  if (!ok) return;

  try {
    const res = await apiCall("deleteAdmin", {
      requesterRole: session.role,
      rowIdx
    });

    if (!res.success) throw new Error(res.message || "Gagal hapus admin");

    await swalSuccess("Berhasil", "Admin berhasil dihapus.");
    await adminLoadAdmins();

  } catch (err) {
    await swalError("Gagal", String(err.message || err));
  }
}

/* ==========================
   8D) DANGER ZONE
   ========================== */

async function adminClearDatabase() {
  const session = getAdminSession();
  if (!session) return;

  if (session.role !== "super admin") {
    await swalError("Akses Ditolak", "Hanya Super Admin yang dapat mengosongkan database.");
    return;
  }

  const ok = await swalConfirm(
    "DANGER ZONE",
    "Ini akan menghapus SEMUA data pencatatan nomor & arsip digital di sheet. Lanjut?",
    "Ya, Kosongkan"
  );

  if (!ok) return;

  const ok2 = await swalConfirm(
    "Konfirmasi Terakhir",
    "Ketikannya di backend: CLEAR_ALL_DATA. Lanjutkan?",
    "Ya, Saya Mengerti"
  );

  if (!ok2) return;

  const btn = $("btnDangerClear");
  setBtnLoading(btn, true, "Menghapus...");

  try {
    const res = await apiCall("dangerClearDatabase", {
      requesterRole: session.role,
      confirm: "CLEAR_ALL_DATA"
    });

    if (!res.success) throw new Error(res.message || "Gagal clear DB");

    await swalSuccess("Berhasil", res.message || "Database dikosongkan.");
    await adminLoadTables();

  } catch (err) {
    await swalError("Gagal", String(err.message || err));
  } finally {
    setBtnLoading(btn, false);
  }
}

/* ==========================
   9) ADMIN LOGOUT
   ========================== */

async function adminLogout() {
  const ok = await swalConfirm("Logout?", "Yakin ingin keluar dari dashboard admin?", "Ya, Logout");
  if (!ok) return;

  clearAdminSession();
  window.location.href = "login.html";
}

/* ==========================
   10) GLOBAL INIT (detect page)
   ========================== */

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page || "";

  // modal close click
  if ($("btnModalClose")) $("btnModalClose").addEventListener("click", closeEditModal);
  if ($("modalBackdrop")) {
    $("modalBackdrop").addEventListener("click", (e) => {
      if (e.target && e.target.id === "modalBackdrop") closeEditModal();
    });
  }
  if ($("btnModalSave")) $("btnModalSave").addEventListener("click", submitEditModal);

  // init per page
  if (page === "index") initIndexPage();
  if (page === "login") initLoginPage();
  if (page === "admin") initAdminPage();
});

