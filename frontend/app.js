/**
 * Şantiye Net Hesap — Ana JS Uygulaması
 */

// LÜTFEN DİKKAT: Backend URL'inizi buraya girin.
// Dinamik API Yönlendirmesi: Hardcoded URL kaldırıldı.
// Tarayıcı otomatik olarak hangi sitede olduğunu bulup sonuna backend yolunu ekler.
// Örn: localhost'ta ise http://localhost/backend/public/api olur
// Canlıda ise http://santiye.ahmetakaslan.com/backend/public/api olur
const API_BASE_URL = window.location.origin + "/public/api";

// --- DOM Elementleri ---
const UI = {
  screens: {
    prompt: document.getElementById("screen-prompt"),
    table: document.getElementById("screen-table"),
  },
  prompt: {
    input: document.getElementById("input-raw-text"),
    btnGenerate: document.getElementById("btn-generate"),
    charCount: document.getElementById("char-count"),
    error: document.getElementById("prompt-error"),
    loader: document.getElementById("btn-generate-loader"),
    btnText: document.getElementById("btn-generate-text"),
    fileInput: document.getElementById("input-image"),
    btnUploadImage: document.getElementById("btn-upload-image"),
    imageName: document.getElementById("image-name"),
  },
  table: {
    head: document.getElementById("table-head"),
    body: document.getElementById("table-body"),
    foot: document.getElementById("table-foot"),
    titleInput: document.getElementById("input-title"),
    btnSave: document.getElementById("btn-save"),
    btnAddRow: document.getElementById("btn-add-row"),
    btnAddColumn: document.getElementById("btn-add-column"),
    btnBack: document.getElementById("btn-back"),
    btnPrint: document.getElementById("btn-print"),
    btnExcel: document.getElementById("btn-excel"),
    error: document.getElementById("table-error"),
    saveStatus: document.getElementById("save-status"),
    aiChatInput: document.getElementById("input-ai-chat"),
    btnAiChat: document.getElementById("btn-ai-chat"),
    btnAiChatText: document.getElementById("btn-ai-chat-text"),
    btnAiChatLoader: document.getElementById("btn-ai-chat-loader"),
  },
  sidebar: {
    list: document.getElementById("history-list"),
    btnNew: document.getElementById("btn-new-table"),
    toggle: document.getElementById("btn-sidebar-toggle"),
    el: document.getElementById("sidebar"),
  },
  print: {
    date: document.getElementById("print-date"),
    title: document.getElementById("print-title-text"),
  },
};

// --- State ---
let currentTableData = null; // { headers: [], rows: [] }
let currentTableId = null;
let currentImageBase64 = null; // Store base64 of uploaded image

// --- Event Listeners ---

// Textarea yazma event'i
UI.prompt.input.addEventListener("input", (e) => {
  const val = e.target.value;
  UI.prompt.charCount.textContent = `${val.length} / 5000`;
  // Resim yoksa metin 5 karakter olmalı
  if (!currentImageBase64) {
    UI.prompt.btnGenerate.disabled = val.trim().length < 5;
  }
});

// (Fotoğraf Yükle Butonu artık index.html'de bir <label> olduğu için native olarak input'u tetikler, JS click handler'ına gerek yok)

UI.prompt.fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  UI.prompt.imageName.textContent = "⏳ Fotoğraf İşleniyor...";
  UI.prompt.btnGenerate.disabled = true;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      // Resmi optimize et (maksimum 1200px)
      const MAX_SIZE = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG olarak sıkıştır (Kalite: 0.8)
      currentImageBase64 = canvas.toDataURL("image/jpeg", 0.8);
      
      // Butonu güncelle
      UI.prompt.imageName.textContent = file.name.substring(0, 20) + (file.name.length > 20 ? "..." : "");
      UI.prompt.btnGenerate.disabled = false;
    };
    img.onerror = () => {
      alert("Fotoğraf okunamadı. Lütfen standart bir JPEG veya PNG seçin.");
      UI.prompt.imageName.textContent = "📷 Fotoğraf Yükle";
      if (UI.prompt.input.value.trim().length < 5) {
        UI.prompt.btnGenerate.disabled = true;
      } else {
        UI.prompt.btnGenerate.disabled = false;
      }
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// Tabloya Dönüştür Butonu
UI.prompt.btnGenerate.addEventListener("click", async () => {
  const text = UI.prompt.input.value.trim();
  if (text.length < 5 && !currentImageBase64) return;

  setLoading(true);
  UI.prompt.error.classList.add("hidden");

  try {
    const payload = { raw_text: text };
    if (currentImageBase64) {
      payload.image_base64 = currentImageBase64;
    }

    const res = await fetch(`${API_BASE_URL}/generate-table`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Yapay zeka tabloyu oluşturamadı.");
    }

    // Başarılı! Tabloyu hazırla ve ekrana geç
    currentTableId = null;
    
    // Toplam sütununu en sona al
    if (data.data.headers) {
      data.data.headers = sortHeaders(data.data.headers);
    }
    
    currentTableData = data.data;
    UI.table.titleInput.value = "";
    renderTable();
    switchScreen("table");
  } catch (err) {
    UI.prompt.error.textContent = err.message;
    UI.prompt.error.classList.remove("hidden");
  } finally {
    setLoading(false);
  }
});

// Geri Butonu
UI.table.btnBack.addEventListener("click", () => {
  switchScreen("prompt");
});

// PDF / Yazdır Butonu
UI.table.btnPrint.addEventListener("click", () => {
  window.print();
});

// Excel (.xlsx) İndirme
UI.table.btnExcel.addEventListener("click", () => {
  if (!currentTableData || !currentTableData.headers) return;
  
  // SheetJS verisi hazırla
  const wsData = [];
  wsData.push(currentTableData.headers);
  
  currentTableData.rows.forEach(row => {
    const rowData = currentTableData.headers.map(h => row[h] !== null ? row[h] : "");
    wsData.push(rowData);
  });
  
  // Toplam satırı varsa ekle
  const totalsRow = currentTableData.headers.map(h => "");
  totalsRow[0] = "TOPLAM";
  let hasTotals = false;
  
  currentTableData.headers.forEach((h, i) => {
    if (i > 0) {
      let sum = 0;
      let isNumeric = false;
      currentTableData.rows.forEach(r => {
        const val = parseFloat(r[h]);
        if (!isNaN(val)) { sum += val; isNumeric = true; }
      });
      if (isNumeric) { totalsRow[i] = sum; hasTotals = true; }
    }
  });
  
  if (hasTotals) wsData.push(totalsRow);

  let filename = "SmartTable_Cikti";
  const title = UI.table.titleInput.value.trim();
  if (title) filename = title;

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tablo");
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
});

// Yeni Hesap (Sidebar)
UI.sidebar.btnNew.addEventListener("click", () => {
  UI.prompt.input.value = "";
  UI.prompt.charCount.textContent = "0 / 5000";
  UI.prompt.btnGenerate.disabled = true;
  currentTableId = null;
  currentTableData = null;
  switchScreen("prompt");
  if (window.innerWidth <= 768) UI.sidebar.el.classList.remove("open");
});

// Satır Ekle
UI.table.btnAddRow.addEventListener("click", () => {
  if (!currentTableData) return;
  syncTableData(); // Ekranda yazılanları RAM'e kaydet ki silinmesin
  const newRow = {};
  currentTableData.headers.forEach((h) => (newRow[h] = ""));
  currentTableData.rows.push(newRow);
  renderTable();
});

// Sütun Ekle
UI.table.btnAddColumn.addEventListener("click", () => {
  if (!currentTableData) return;
  const colName = prompt("Yeni Sütun Adı (Örn: İskonto):");
  if (!colName || colName.trim() === "") return;
  
  const h = colName.trim();
  if (currentTableData.headers.includes(h)) {
    alert("Bu isimde bir sütun zaten var.");
    return;
  }
  
  syncTableData(); // Ekranda yazılanları RAM'e kaydet ki silinmesin
  currentTableData.headers.push(h);
  // Tüm satırlara bu sütun için boş hücre ekle
  currentTableData.rows.forEach(row => {
    row[h] = "";
  });
  
  renderTable();
});

// Kaydet
UI.table.btnSave.addEventListener("click", async () => {
  if (!currentTableData) return;

  const title = UI.table.titleInput.value.trim() || "İsimsiz Hesap";
  const raw_input = UI.prompt.input.value.trim();

  // Hücrelerdeki güncel verileri topla
  const updatedRows = [];
  const trs = UI.table.body.querySelectorAll("tr");
  trs.forEach((tr) => {
    const rowObj = {};
    const inputs = tr.querySelectorAll(".cell-input");
    inputs.forEach((input) => {
      const colName = input.dataset.column;
      const parsed = Numpad.parseNumber(input.value);
      // Eğer düzgün bir sayıysa sayıyı yolla, değilse metni yolla
      rowObj[colName] = !isNaN(parsed) && input.value !== "" ? parsed : input.value;
    });
    updatedRows.push({ columns: rowObj });
  });

  const payload = {
    title: title,
    raw_input: raw_input,
    headers: currentTableData.headers,
    rows: updatedRows,
  };

  const url = currentTableId
    ? `${API_BASE_URL}/tables/${currentTableId}`
    : `${API_BASE_URL}/tables`;
  const method = currentTableId ? "PUT" : "POST";

  try {
    UI.table.btnSave.disabled = true;
    UI.table.btnSave.textContent = "Kaydediliyor...";

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success)
      throw new Error(data.message || "Kayıt başarısız.");

    currentTableId = data.data.id;
    showSaveStatus("Başarıyla kaydedildi!", "success");
    loadHistory(); // Geçmişi yenile
  } catch (err) {
    showSaveStatus(err.message, "error");
  } finally {
    UI.table.btnSave.disabled = false;
    UI.table.btnSave.textContent = "💾 Kaydet";
  }
});

// PDF / Yazdır (Akıllı Düzen)
UI.table.btnPrint.addEventListener("click", () => {
  const title = UI.table.titleInput.value.trim() || "Şantiye Hesap Dökümü";
  UI.print.title.textContent = title;
  const date = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  UI.print.date.textContent = "Tarih: " + date;

  // Dinamik Yazdırma CSS'i ekle
  let printStyle = document.getElementById("smart-print-style");
  if (!printStyle) {
    printStyle = document.createElement("style");
    printStyle.id = "smart-print-style";
    document.head.appendChild(printStyle);
  }
  
  // Sütun sayısı fazlaysa (4'ten çok) otomatik yatay yap
  if (currentTableData && currentTableData.headers.length > 4) {
    printStyle.innerHTML = "@page { size: landscape; }";
  } else {
    printStyle.innerHTML = "@page { size: portrait; }";
  }

  window.print();
});

// Sidebar Toggle (Mobil)
UI.sidebar.toggle.addEventListener("click", () => {
  UI.sidebar.el.classList.toggle("open");
});

// Yapay Zeka ile Mevcut Tabloyu Güncelle (AI Chat)
UI.table.btnAiChat.addEventListener("click", async () => {
  if (!currentTableData) return;
  const prompt = UI.table.aiChatInput.value.trim();
  if (!prompt) return;

  // Kutuyu dondur, loader göster
  UI.table.aiChatInput.disabled = true;
  UI.table.btnAiChat.disabled = true;
  UI.table.btnAiChatText.classList.add("hidden");
  UI.table.btnAiChatLoader.classList.remove("hidden");

  syncTableData(); // Ekranda yazılanları al

  try {
    const raw_text = prompt + "\n\n--- MEVCUT TABLO VERİSİ (Aşağıdaki tabloyu isteğime göre GÜNCELLE) ---\n" + JSON.stringify(currentTableData);
    
    const res = await fetch(`${API_BASE_URL}/generate-table`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ raw_text: raw_text }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Yapay zeka tabloyu güncelleyemedi.");
    }

    if (data.data.headers) {
      data.data.headers = sortHeaders(data.data.headers);
    }
    
    currentTableData = data.data;
    renderTable();
    UI.table.aiChatInput.value = ""; // Inputu temizle
    
  } catch (err) {
    alert(err.message);
  } finally {
    UI.table.aiChatInput.disabled = false;
    UI.table.btnAiChat.disabled = false;
    UI.table.btnAiChatText.classList.remove("hidden");
    UI.table.btnAiChatLoader.classList.add("hidden");
  }
});

// --- Fonksiyonlar ---

function switchScreen(screenName) {
  Object.values(UI.screens).forEach((s) => {
    s.classList.remove("active");
    s.classList.add("hidden");
  });
  UI.screens[screenName].classList.add("active");
  UI.screens[screenName].classList.remove("hidden");
}

// Arayüzdeki (DOM) değerleri data objesine eşitler (satır eklerken veriler kaybolmasın diye)
function syncTableData() {
  if (!currentTableData) return;
  const trs = UI.table.body.querySelectorAll("tr");
  trs.forEach((tr, rowIndex) => {
    const inputs = tr.querySelectorAll(".cell-input");
    inputs.forEach((input) => {
      const colName = input.dataset.column;
      if (currentTableData.rows[rowIndex]) {
         currentTableData.rows[rowIndex][colName] = input.value;
      }
    });
  });
}

// Toplam/Tutar sütunlarını her zaman en sona taşır
function sortHeaders(headers) {
  return [...headers].sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aIsTotal = aLower.includes("toplam") || aLower.includes("tutar");
    const bIsTotal = bLower.includes("toplam") || bLower.includes("tutar");
    if (aIsTotal && !bIsTotal) return 1;
    if (!aIsTotal && bIsTotal) return -1;
    return 0;
  });
}

function setLoading(isLoading) {
  UI.prompt.btnGenerate.disabled = isLoading;
  if (isLoading) {
    UI.prompt.btnText.classList.add("hidden");
    UI.prompt.loader.classList.remove("hidden");
  } else {
    UI.prompt.btnText.classList.remove("hidden");
    UI.prompt.loader.classList.add("hidden");
  }
}

function showSaveStatus(msg, type) {
  UI.table.saveStatus.textContent = msg;
  UI.table.saveStatus.className = `save-status ${type}`;
  setTimeout(() => {
    UI.table.saveStatus.classList.add("hidden");
  }, 3000);
}

// Tablo Render Motoru
function renderTable() {
  const { headers, rows } = currentTableData;
  
  // Otomatik Kayıt (Auto-save) - Her render edildiğinde draft olarak kaydet
  localStorage.setItem("santiye_draft_table", JSON.stringify(currentTableData));

  // 1. Head (Artık başlıklar da düzenlenebilir ve sütun sil/kaydır var)
  let theadHTML = "<tr>";
  headers.forEach((h, colIndex) => {
    theadHTML += `<th>
      <div class="table-controls" style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
        <span style="cursor:pointer;" onclick="window.moveColumn(${colIndex}, -1)" title="Sola Kaydır">⬅️</span>
        <span style="cursor:pointer;" onclick="window.deleteColumn(${colIndex})" title="Sütunu Sil">🗑️</span>
        <span style="cursor:pointer;" onclick="window.moveColumn(${colIndex}, 1)" title="Sağa Kaydır">➡️</span>
      </div>
      <input type="text" class="header-input" data-col-index="${colIndex}" value="${h}" />
    </th>`;
  });
  theadHTML += '<th class="th-actions"></th></tr>';
  UI.table.head.innerHTML = theadHTML;

  // Başlık değişikliklerini dinle
  const headerInputs = UI.table.head.querySelectorAll(".header-input");
  headerInputs.forEach((hInput) => {
    hInput.addEventListener("blur", (e) => {
      const idx = e.target.dataset.colIndex;
      const oldHeader = currentTableData.headers[idx];
      const newHeader = e.target.value.trim() || `Sütun ${idx}`;
      
      if (oldHeader !== newHeader) {
        syncTableData(); // Ekranda değiştirilen verileri önce RAM'e kaydet
        
        // Tablo verilerindeki key'leri eski başlıktan yeni başlığa transfer et
        currentTableData.rows.forEach(row => {
          if (row.hasOwnProperty(oldHeader)) {
            row[newHeader] = row[oldHeader];
            delete row[oldHeader];
          }
        });
        
        currentTableData.headers[idx] = newHeader;
        renderTable(); 
      }
    });
  });

  // 2. Body
  UI.table.body.innerHTML = "";
  rows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");

    headers.forEach((h) => {
      const td = document.createElement("td");
      const val = row[h] !== undefined && row[h] !== null ? row[h] : "";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "cell-input";
      input.dataset.column = h;
      input.dataset.row = rowIndex;
      input.value = val;

      const hLower = h.toLowerCase();
      const isTotal = hLower.includes("toplam") || hLower.includes("tutar");
      
      // Kullanıcı her şeyi yazmakta özgür olsun ("yanlış yapıyorsa onun suçudur").
      // Sadece formatlama için numeric class'ı ekliyoruz, klavyeyi kitlemiyoruz.
      input.addEventListener("blur", () => {
        const originalVal = input.value.trim();
        
        // Eğer içinde sadece rakam, nokta, virgül varsa sayı olarak formatla
        // Eğer harf veya metin varsa (örn: 'Çimento', '10 Torba') ASLA dokunma!
        const isStrictlyNumeric = /^[-0-9.,]+$/.test(originalVal);
        
        if (isStrictlyNumeric && originalVal !== "") {
          const parsed = Numpad.parseNumber(originalVal);
          if (!isNaN(parsed)) {
            input.value = Numpad.formatTR(parsed);
          }
        }
        calculateRowTotal(tr); // Satır içi çarpma işlemi (Miktar x Fiyat)
        calculateTotals();     // Genel toplam (Dikey toplama)
      });
      
      input.addEventListener("focus", () => {
        const originalVal = input.value.trim();
        const isStrictlyNumeric = /^[-0-9.,]+$/.test(originalVal);
        
        if (isStrictlyNumeric && originalVal !== "") {
          const parsed = Numpad.parseNumber(originalVal);
          if (!isNaN(parsed)) {
            input.value = parsed;
          }
        }
      });

      if (isTotal) {
        input.classList.add("total");
      }

      td.appendChild(input);
      tr.appendChild(td);
    });

    // Silme butonu
    const tdAction = document.createElement("td");
    tdAction.className = "td-actions";
    const btnDel = document.createElement("button");
    btnDel.className = "btn-delete-row";
    btnDel.innerHTML = "🗑️";
    btnDel.title = "Satırı Sil";
    btnDel.onclick = () => {
      currentTableData.rows.splice(rowIndex, 1);
      renderTable(); 
    };
    tdAction.appendChild(btnDel);
    tr.appendChild(tdAction);

    UI.table.body.appendChild(tr);
  });

  // 3. Foot (Genel Toplam)
  calculateTotals();
}

// Satır içi otomatik hesaplama (Miktar * Fiyat = Toplam)
function calculateRowTotal(tr) {
  if (!currentTableData) return;
  const headers = currentTableData.headers;
  
  // Miktar, Fiyat ve Toplam sütunlarını bul
  let miktarCol = null;
  let fiyatCol = null;
  let toplamCol = null;

  headers.forEach(h => {
    const hLower = h.toLowerCase();
    if (hLower.includes("miktar") || hLower.includes("adet")) miktarCol = h;
    else if (hLower.includes("fiyat") || hLower.includes("birim fiyat")) fiyatCol = h;
    else if (hLower.includes("toplam") || hLower.includes("tutar")) toplamCol = h;
  });

  if (miktarCol && fiyatCol && toplamCol) {
    const miktarInput = tr.querySelector(`.cell-input[data-column="${miktarCol}"]`);
    const fiyatInput = tr.querySelector(`.cell-input[data-column="${fiyatCol}"]`);
    const toplamInput = tr.querySelector(`.cell-input[data-column="${toplamCol}"]`);

    if (miktarInput && fiyatInput && toplamInput) {
      const miktarVal = Numpad.parseNumber(miktarInput.value);
      const fiyatVal = Numpad.parseNumber(fiyatInput.value);
      
      if (!isNaN(miktarVal) && !isNaN(fiyatVal) && miktarInput.value !== "" && fiyatInput.value !== "") {
        const total = miktarVal * fiyatVal;
        toplamInput.value = Numpad.formatTR(total);
      }
    }
  }
}

// Otomatik Matematik: Toplam sütunlarını dikey olarak toplar
function calculateTotals() {
  if (!currentTableData) return;
  const headers = currentTableData.headers;

  // Hangi sütunlar "Toplam" içeriyor bul
  const totalCols = headers.filter(
    (h) => h.toLowerCase().includes("toplam") || h.toLowerCase().includes("tutar")
  );

  if (totalCols.length === 0) {
    UI.table.foot.innerHTML = "";
    return;
  }

  const sums = {};
  totalCols.forEach((c) => (sums[c] = 0));

  // Satırları gez, hesapla
  const trs = UI.table.body.querySelectorAll("tr");
  trs.forEach((tr) => {
    totalCols.forEach((col) => {
      const input = tr.querySelector(`.cell-input[data-column="${col}"]`);
      if (input) {
        const val = Numpad.parseNumber(input.value);
        if (!isNaN(val)) sums[col] += val;
      }
    });
  });

  // Footer'ı çiz
  let tfootHTML = "<tr>";
  headers.forEach((h, index) => {
    if (index === 0) {
      tfootHTML += `<td>GENEL TOPLAM</td>`;
    } else if (sums[h] !== undefined) {
      tfootHTML += `<td style="text-align:right">${Numpad.formatTR(sums[h])}</td>`;
    } else {
      tfootHTML += `<td></td>`;
    }
  });
  tfootHTML += `<td></td></tr>`;
  UI.table.foot.innerHTML = tfootHTML;
}

// Geçmişi Yükle
async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/tables`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const data = await res.json();

    UI.sidebar.list.innerHTML = "";
    if (data.data.length === 0) {
      UI.sidebar.list.innerHTML =
        '<li class="history-empty">Henüz kayıtlı hesap yok.</li>';
      return;
    }

    data.data.forEach((table) => {
      const li = document.createElement("li");
      li.className = "history-item";
      if (currentTableId === table.id) li.classList.add("active");

      const dateStr = new Date(table.created_at).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      });

      li.innerHTML = `
        <div style="flex:1; overflow:hidden;">
          <div class="history-item-title">${table.title}</div>
          <div class="history-item-date">${dateStr}</div>
        </div>
        <button class="history-item-delete" title="Sil">✖</button>
      `;

      // Tabloyu Yükle
      li.addEventListener("click", async (e) => {
        if (e.target.classList.contains("history-item-delete")) return;
        await loadTableDetails(table.id);
        if (window.innerWidth <= 768) UI.sidebar.el.classList.remove("open");
      });

      // Tabloyu Sil
      li.querySelector(".history-item-delete").addEventListener(
        "click",
        async (e) => {
          e.stopPropagation();
          if (confirm(`"${table.title}" silinecek. Emin misiniz?`)) {
            await deleteTable(table.id);
          }
        },
      );

      UI.sidebar.list.appendChild(li);
    });
  } catch (err) {
    console.error("Geçmiş yüklenemedi:", err);
  }
}

// Belirli bir tabloyu getir
async function loadTableDetails(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/tables/${id}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentTableId = data.data.id;
      UI.table.titleInput.value = data.data.title;

      // rows array of objects -> columns formatına getir
      // Backend'den rows:[ { columns: {...} } ] geliyor
      const formattedRows = data.data.rows.map((r) =>
        typeof r.columns === "string" ? JSON.parse(r.columns) : r.columns,
      );

      // Sütun başlıklarını ilk satırdan veya raw formattan türet
      let headers = [];
      if (formattedRows.length > 0) {
        headers = Object.keys(formattedRows[0]);
      } else {
        headers = ["İş Kalemi", "Miktar", "Birim", "Fiyat", "Toplam"];
      }

      headers = sortHeaders(headers);

      currentTableData = { headers, rows: formattedRows };
      renderTable();
      switchScreen("table");
      loadHistory(); // aktif classını güncelle
    }
  } catch (err) {
    alert("Tablo yüklenirken hata oluştu.");
  }
}

// Tabloyu Sil
async function deleteTable(id) {
  try {
    await fetch(`${API_BASE_URL}/tables/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (currentTableId === id) {
      UI.sidebar.btnNew.click(); // Ekranı temizle
    } else {
      loadHistory();
    }
  } catch (err) {
    console.error(err);
  }
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  
  // Eğer yarım kalmış bir taslak (auto-save) varsa onu yükle
  const draft = localStorage.getItem("santiye_draft_table");
  if (draft) {
    try {
      currentTableData = JSON.parse(draft);
      currentTableId = null; // Taslak olduğu için yeni bir tablo sayılır
      switchScreen("table");
      renderTable();
    } catch (e) {
      console.error("Taslak yüklenemedi", e);
    }
  }
});

// Sütun Silme (HTML onClick içinden çağrılacağı için window objesine ekliyoruz)
window.deleteColumn = function(idx) {
  if (!currentTableData) return;
  if (!confirm("Sütunu tamamen silmek istediğinize emin misiniz?")) return;
  syncTableData();
  const h = currentTableData.headers[idx];
  currentTableData.headers.splice(idx, 1);
  currentTableData.rows.forEach(row => { delete row[h]; });
  renderTable();
};

// Sütun Kaydırma
window.moveColumn = function(idx, direction) {
  if (!currentTableData) return;
  syncTableData();
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= currentTableData.headers.length) return;
  
  // Headers dizisinde yer değiştir
  const temp = currentTableData.headers[idx];
  currentTableData.headers[idx] = currentTableData.headers[newIdx];
  currentTableData.headers[newIdx] = temp;
  
  // Tabloyu tekrar çiz, rows dizisindeki sırayı javascript kendisi ayarlar
  renderTable();
};
