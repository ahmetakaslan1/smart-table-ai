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
    admin: document.getElementById("screen-admin"),
  },
  auth: {
    modal: document.getElementById("auth-modal"),
    btnToggle: document.getElementById("btn-auth-toggle"),
    btnClose: document.getElementById("btn-auth-close"),
    title: document.getElementById("auth-title"),
    error: document.getElementById("auth-error"),
    success: document.getElementById("auth-success"),
    nameGroup: document.getElementById("auth-name-group"),
    name: document.getElementById("auth-name"),
    email: document.getElementById("auth-email"),
    passwordGroup: document.getElementById("auth-password-group"),
    password: document.getElementById("auth-password"),
    submit: document.getElementById("btn-auth-submit"),
    toggleText: document.getElementById("auth-toggle-text"),
    toggleLink: document.getElementById("auth-toggle-link"),
    forgotText: document.getElementById("auth-forgot-text"),
    forgotLink: document.getElementById("auth-forgot-link"),
  },
  admin: {
    usersList: document.getElementById("admin-users-list"),
    tablesContainer: document.getElementById("admin-user-tables-container"),
    tablesList: document.getElementById("admin-user-tables-list"),
    btnBack: document.getElementById("btn-admin-back"),
    selectedUserName: document.getElementById("admin-selected-user-name"),
  },
  prompt: {
    input: document.getElementById("input-raw-text"),
    btnGenerate: document.getElementById("btn-generate"),
    charCount: document.getElementById("char-count"),
    error: document.getElementById("prompt-error"),
    loader: document.getElementById("btn-generate-loader"),
    btnGenerateText: document.getElementById("btn-generate-text"),
    fileInput: document.getElementById("input-image"),
    btnUploadImage: document.getElementById("btn-upload-image"),
    imageName: document.getElementById("image-name"),
    progressContainer: document.getElementById("generation-progress-container"),
    progressText: document.getElementById("progress-status-text"),
    progressPercentage: document.getElementById("progress-percentage"),
    progressFill: document.getElementById("progress-bar-fill"),
    btnThemeToggle: document.getElementById("btn-theme-toggle"),
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
    el: document.getElementById("sidebar"),
    list: document.getElementById("history-list"),
    toggle: document.getElementById("btn-sidebar-toggle"),
    close: document.getElementById("btn-sidebar-close"),
    overlay: document.getElementById("sidebar-overlay"),
    btnNew: document.getElementById("btn-new-table"),
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
    
    setLoading(false, true); // Progress %100 olsun
    
    // %100'ü görsün diye 800ms bekleyip ekrana geçelim
    setTimeout(() => {
      renderTable();
      switchScreen("table");
    }, 800);

  } catch (err) {
    UI.prompt.error.textContent = err.message;
    UI.prompt.error.classList.remove("hidden");
    setLoading(false, false);
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
  totalsRow[0] = "GENEL TOPLAM";
  
  const totalCols = currentTableData.headers.filter(
    (h) => h.toLowerCase().includes("toplam") || h.toLowerCase().includes("tutar")
  );

  let hasTotals = false;
  if (totalCols.length > 0) {
    currentTableData.headers.forEach((h, i) => {
      if (totalCols.includes(h)) {
        let sum = 0;
        currentTableData.rows.forEach(r => {
          const val = Numpad.parseNumber(r[h]);
          if (!isNaN(val)) { sum += val; }
        });
        totalsRow[i] = sum;
        hasTotals = true;
      }
    });
  }
  
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

// Sayfa yüklendiğinde çalışacaklar
document.addEventListener("DOMContentLoaded", () => {
  // Temayı yükle
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    if(UI.prompt.btnThemeToggle) UI.prompt.btnThemeToggle.textContent = "☀️";
  }

  loadHistory();
  if (window.innerWidth <= 768) {
    UI.sidebar.el.classList.remove("open");
  }
});

// Tema Değiştirme Butonu
if (UI.prompt.btnThemeToggle) {
  UI.prompt.btnThemeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "light") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "dark");
      UI.prompt.btnThemeToggle.textContent = "🌙";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
      UI.prompt.btnThemeToggle.textContent = "☀️";
    }
  });
}

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

  const title = UI.table.titleInput.value.trim();
  
  if (!title) {
    alert("Lütfen kaydetmeden önce tablonuza bir isim verin!");
    UI.table.titleInput.focus();
    return;
  }
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

    const reqHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const token = localStorage.getItem('auth_token');
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: method,
      headers: reqHeaders,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success)
      throw new Error(data.message || "Kayıt başarısız.");

    currentTableId = data.data.id;
    if (!currentUser) addGuestTable(currentTableId);
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

// Sidebar Açma / Kapama Fonksiyonları
function openSidebar() {
  UI.sidebar.el.classList.add("open");
  if(UI.sidebar.overlay) UI.sidebar.overlay.classList.add("active");
}

function closeSidebar() {
  UI.sidebar.el.classList.remove("open");
  if(UI.sidebar.overlay) UI.sidebar.overlay.classList.remove("active");
}

// Sidebar Toggle (Sol Üst Hamburger)
if (UI.sidebar.toggle) {
  UI.sidebar.toggle.addEventListener("click", () => {
    if (UI.sidebar.el.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
}

// Sidebar Kapat (İçerideki X)
if (UI.sidebar.close) {
  UI.sidebar.close.addEventListener("click", closeSidebar);
}

// Sidebar Overlay'a tıklayınca kapat (Boşluğa tıklama)
if (UI.sidebar.overlay) {
  UI.sidebar.overlay.addEventListener("click", closeSidebar);
}

// Mobilde Sağa/Sola Kaydırarak (Swipe) Kapatma Mantığı
let touchStartX = 0;
let touchEndX = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});
document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  if (touchStartX - touchEndX > 50) { // Sola doğru en az 50px kaydırma
    if (UI.sidebar.el.classList.contains("open")) {
      closeSidebar();
    }
  }
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

let progressInterval = null;
let currentProgress = 0;

function setLoading(isLoading, isSuccess = false) {
  UI.prompt.btnGenerate.disabled = isLoading;
  
  if (isLoading) {
    UI.prompt.btnGenerateText.classList.add("hidden");
    UI.prompt.loader.classList.remove("hidden");
    
    // Progress Bar Başlat
    if (UI.prompt.progressContainer) {
      UI.prompt.progressContainer.classList.remove("hidden");
      UI.prompt.progressText.textContent = "Yapay zeka analiz ediyor...";
      currentProgress = 0;
      UI.prompt.progressFill.style.width = "0%";
      UI.prompt.progressPercentage.textContent = "0%";
      
      progressInterval = setInterval(() => {
        let remaining = 95 - currentProgress;
        currentProgress += remaining * 0.05; // Yavaş yavaş %95'e yaklaşır
        
        UI.prompt.progressFill.style.width = `${currentProgress}%`;
        UI.prompt.progressPercentage.textContent = `${Math.floor(currentProgress)}%`;
        
        if (currentProgress > 30) UI.prompt.progressText.textContent = "Tablo yapısı çıkarılıyor...";
        if (currentProgress > 60) UI.prompt.progressText.textContent = "Veriler hesaplanıyor...";
        if (currentProgress > 85) UI.prompt.progressText.textContent = "Son kontroller yapılıyor...";
      }, 400);
    }
  } else {
    clearInterval(progressInterval);
    
    if (isSuccess && UI.prompt.progressContainer) {
      // 100% yapıp bekletiyoruz (Ekran geçişini setTimeout yapıyor)
      UI.prompt.progressFill.style.width = "100%";
      UI.prompt.progressPercentage.textContent = "100%";
      UI.prompt.progressText.textContent = "Tablo hazır!";
      
      setTimeout(() => {
        UI.prompt.btnGenerateText.classList.remove("hidden");
        UI.prompt.loader.classList.add("hidden");
        UI.prompt.progressContainer.classList.add("hidden");
      }, 800);
    } else {
      // Hata durumu, direkt gizle
      UI.prompt.btnGenerateText.classList.remove("hidden");
      UI.prompt.loader.classList.add("hidden");
      if (UI.prompt.progressContainer) {
        UI.prompt.progressContainer.classList.add("hidden");
      }
    }
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
      
      input.addEventListener("blur", () => {
        // Otomatik formatlamayı tamamen kaldırdık, kullanıcı ne yazarsa o kalır.
        calculateRowTotal(tr); 
        calculateTotals();
      });

      if (isTotal) {
        input.classList.add("total");
      }

      td.appendChild(input);
      tr.appendChild(td);
    });

    // İşlem Butonları (Yukarı, Aşağı, Sil)
    const tdAction = document.createElement("td");
    tdAction.className = "td-actions";
    
    // Yukarı Butonu
    const btnUp = document.createElement("button");
    btnUp.className = "btn-row-action";
    btnUp.innerHTML = "↑";
    btnUp.title = "Yukarı Taşı";
    btnUp.onclick = () => window.moveRow(rowIndex, -1);
    if (rowIndex === 0) btnUp.style.visibility = "hidden"; // İlk satır yukarı gidemez

    // Aşağı Butonu
    const btnDown = document.createElement("button");
    btnDown.className = "btn-row-action";
    btnDown.innerHTML = "↓";
    btnDown.title = "Aşağı Taşı";
    btnDown.onclick = () => window.moveRow(rowIndex, 1);
    if (rowIndex === rows.length - 1) btnDown.style.visibility = "hidden"; // Son satır aşağı gidemez

    // Silme Butonu
    const btnDel = document.createElement("button");
    btnDel.className = "btn-delete-row";
    btnDel.innerHTML = "🗑️";
    btnDel.title = "Satırı Sil";
    btnDel.onclick = () => {
      currentTableData.rows.splice(rowIndex, 1);
      renderTable(); 
    };

    tdAction.appendChild(btnUp);
    tdAction.appendChild(btnDown);
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
    const reqHeaders = { "Accept": "application/json" };
    const token = localStorage.getItem('auth_token');
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/tables`, {
      headers: reqHeaders
    });
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
    const reqHeaders = { "Accept": "application/json" };
    const token = localStorage.getItem('auth_token');
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/tables/${id}`, {
      headers: reqHeaders
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
    const reqHeaders = { "Accept": "application/json" };
    const token = localStorage.getItem('auth_token');
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    await fetch(`${API_BASE_URL}/tables/${id}`, {
      method: "DELETE",
      headers: reqHeaders,
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

// Satır Kaydırma (Yukarı / Aşağı)
window.moveRow = function(rowIndex, direction) {
  if (!currentTableData) return;
  syncTableData(); // Önce ekrandaki değişiklikleri RAM'e al
  
  const targetIndex = rowIndex + direction;
  if (targetIndex < 0 || targetIndex >= currentTableData.rows.length) return; // Sınır kontrolü
  
  // Yer değiştirme (swap)
  const temp = currentTableData.rows[rowIndex];
  currentTableData.rows[rowIndex] = currentTableData.rows[targetIndex];
  currentTableData.rows[targetIndex] = temp;
  
  renderTable();
};

/* =========================================================
   AUTH (KİMLİK DOĞRULAMA) VE ADMİN PANELI İŞLEMLERİ
   ========================================================= */

let currentUser = null;
let authMode = 'login'; // login, register, forgot
const API_URL = API_BASE_URL; // Üstte tanımlanan dinamik URL kullanılıyor

// 1. Başlangıçta Giriş Kontrolü
async function checkAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('verified')) {
    const status = urlParams.get('verified');
    window.history.replaceState({}, document.title, window.location.pathname);
    
    openAuthModal();
    if (status === 'success') {
      UI.auth.success.textContent = "E-posta adresiniz başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.";
      UI.auth.success.classList.remove('hidden');
    } else {
      UI.auth.error.textContent = "Doğrulama bağlantısı geçersiz veya süresi dolmuş.";
      UI.auth.error.classList.remove('hidden');
    }
  }

  const token = localStorage.getItem('auth_token');
  if (!token) {
    updateAuthUI();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      currentUser = data.data;
      updateAuthUI();
      loadHistory(); // Kullanıcının tablolarını yükle
    } else {
      localStorage.removeItem('auth_token');
    }
  } catch(e) {
    console.error("Auth check failed", e);
  }
}

// UI Güncelleme (Giriş Yapıldı mı?)
function updateAuthUI() {
  if (currentUser) {
    UI.auth.btnToggle.textContent = currentUser.name + (currentUser.is_admin ? " (Admin)" : "");
    // Çıkış yap butonu oluştur veya admin paneline git
    UI.auth.btnToggle.onclick = () => {
      if (currentUser.is_admin) {
        showAdminPanel();
      } else {
        if(confirm("Çıkış yapmak istediğinize emin misiniz?")) logout();
      }
    };
    
    if (currentUser.is_admin) {
      // Çıkış butonu admin için ayrı koyalım
      const logoutBtn = document.createElement("button");
      logoutBtn.className = "btn btn-ghost";
      logoutBtn.textContent = "Çıkış";
      logoutBtn.onclick = logout;
      UI.auth.btnToggle.parentElement.appendChild(logoutBtn);
    }
  } else {
    UI.auth.btnToggle.textContent = "Giriş Yap";
    UI.auth.btnToggle.onclick = openAuthModal;
  }
}

// Modal Aç/Kapat
function openAuthModal() {
  UI.auth.modal.classList.remove('hidden');
  setAuthMode('login');
}
UI.auth.btnClose.addEventListener('click', () => UI.auth.modal.classList.add('hidden'));

// Auth Modları (Login / Register)
function setAuthMode(mode) {
  authMode = mode;
  UI.auth.error.classList.add('hidden');
  UI.auth.success.classList.add('hidden');

  if (mode === 'login') {
    UI.auth.title.textContent = "Giriş Yap";
    UI.auth.nameGroup.classList.add('hidden');
    UI.auth.passwordGroup.classList.remove('hidden');
    UI.auth.submit.textContent = "Giriş Yap";
    UI.auth.toggleText.innerHTML = 'Hesabınız yok mu? <a href="#" id="auth-toggle-link" style="color: var(--accent); text-decoration: underline;">Kayıt Ol</a>';
    UI.auth.forgotText.classList.remove('hidden');
  } else if (mode === 'register') {
    UI.auth.title.textContent = "Kayıt Ol";
    UI.auth.nameGroup.classList.remove('hidden');
    UI.auth.passwordGroup.classList.remove('hidden');
    UI.auth.submit.textContent = "Kayıt Ol";
    UI.auth.toggleText.innerHTML = 'Zaten hesabınız var mı? <a href="#" id="auth-toggle-link" style="color: var(--accent); text-decoration: underline;">Giriş Yap</a>';
    UI.auth.forgotText.classList.add('hidden');
  } else if (mode === 'forgot') {
    UI.auth.title.textContent = "Şifremi Unuttum";
    UI.auth.nameGroup.classList.add('hidden');
    UI.auth.passwordGroup.classList.add('hidden');
    UI.auth.submit.textContent = "Sıfırlama Linki Gönder";
    UI.auth.toggleText.innerHTML = 'Vazgeç <a href="#" id="auth-toggle-link" style="color: var(--accent); text-decoration: underline;">Giriş Ekranına Dön</a>';
    UI.auth.forgotText.classList.add('hidden');
  }

  // Olay Dinleyicileri (Yeniden atamak gerekiyor çünkü innerHTML değişti)
  document.getElementById("auth-toggle-link").onclick = (e) => {
    e.preventDefault();
    if (authMode === 'login') setAuthMode('register');
    else setAuthMode('login');
  };
  
  const forgotLink = document.getElementById("auth-forgot-link");
  if(forgotLink) {
    forgotLink.onclick = (e) => {
      e.preventDefault();
      setAuthMode('forgot');
    }
  }
}

// Ziyaretçi Tablolarını Kaydet (LocalStorage)
function addGuestTable(id) {
  if (currentUser) return; // Zaten giriş yapmış
  let tables = JSON.parse(localStorage.getItem('guest_table_ids') || '[]');
  if (!tables.includes(id)) {
    tables.push(id);
    localStorage.setItem('guest_table_ids', JSON.stringify(tables));
  }
}

// Form Gönderimi (Login / Register / Forgot)
UI.auth.submit.addEventListener('click', async () => {
  const name = UI.auth.name.value.trim();
  const email = UI.auth.email.value.trim();
  const password = UI.auth.password.value;
  const guest_table_ids = JSON.parse(localStorage.getItem('guest_table_ids') || '[]');

  UI.auth.error.classList.add('hidden');
  UI.auth.success.classList.add('hidden');
  UI.auth.submit.disabled = true;
  UI.auth.submit.textContent = "Bekleyin...";

  try {
    let endpoint = "";
    let payload = { email, guest_table_ids };

    if (authMode === 'register') {
      endpoint = "/register";
      payload.name = name;
      payload.password = password;
    } else if (authMode === 'login') {
      endpoint = "/login";
      payload.password = password;
    } else {
      // Forgot password (Simülasyon, backend rotası eklenebilir)
      UI.auth.success.textContent = "Şifre sıfırlama linki e-postanıza gönderildi.";
      UI.auth.success.classList.remove('hidden');
      UI.auth.submit.disabled = false;
      UI.auth.submit.textContent = "Gönderildi";
      return;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      let errorMsg = data.message;
      if (data.errors) {
        errorMsg = Object.values(data.errors)[0][0]; // İlk hatayı göster
      }
      throw new Error(errorMsg || "Bir hata oluştu.");
    }

    if (authMode === 'register') {
      UI.auth.success.textContent = data.message;
      UI.auth.success.classList.remove('hidden');
      localStorage.removeItem('guest_table_ids'); // Aktarım tamam
    } else if (authMode === 'login') {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.removeItem('guest_table_ids');
      currentUser = data.data.user;
      currentUser.is_admin = data.data.is_admin;
      UI.auth.modal.classList.add('hidden');
      updateAuthUI();
      loadHistory();
      if(currentUser.is_admin) showAdminPanel();
    }
  } catch (err) {
    if (err.message && err.message.includes("henüz doğrulanmamış")) {
      UI.auth.error.innerHTML = `${err.message} <br><button id="btn-resend-email" class="btn btn-outline" style="margin-top:8px; width:100%; padding:8px; font-size:12px; background:transparent;">E-Postayı Tekrar Gönder</button>`;
      UI.auth.error.classList.remove('hidden');
      
      document.getElementById('btn-resend-email').onclick = async (e) => {
        e.preventDefault();
        e.target.textContent = "Gönderiliyor...";
        e.target.disabled = true;
        try {
          const resendReq = await fetch(`${API_URL}/email/resend`, {
            method: "POST",
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify({email: email}) // formdaki email değişkenini kullanıyoruz
          });
          const resendData = await resendReq.json();
          if (resendData.success) {
            UI.auth.success.textContent = resendData.message;
            UI.auth.success.classList.remove('hidden');
            UI.auth.error.classList.add('hidden');
          } else {
            e.target.textContent = "Hata: " + resendData.message;
            e.target.disabled = false;
          }
        } catch(e2) {
          e.target.textContent = "Bağlantı hatası!";
          e.target.disabled = false;
        }
      };
    } else {
      UI.auth.error.textContent = err.message || "Bir hata oluştu.";
      UI.auth.error.classList.remove('hidden');
    }
  } finally {
    UI.auth.submit.disabled = false;
    if (authMode === 'login') UI.auth.submit.textContent = "Giriş Yap";
    if (authMode === 'register') UI.auth.submit.textContent = "Kayıt Ol";
  }
});

async function logout() {
  const token = localStorage.getItem('auth_token');
  if(token) {
    await fetch(`${API_URL}/logout`, { method: "POST", headers: { 'Authorization': `Bearer ${token}` }});
  }
  localStorage.removeItem('auth_token');
  window.location.reload();
}

// -----------------------------------------
// ADMİN PANELİ FONKSİYONLARI
// -----------------------------------------
async function showAdminPanel() {
  switchScreen("admin");
  
  const token = localStorage.getItem('auth_token');
  UI.admin.usersList.innerHTML = "Yükleniyor...";
  
  try {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    const data = await res.json();
    if(data.success) {
      renderAdminUsers(data.data);
    }
  } catch(e) {
    UI.admin.usersList.innerHTML = "Hata oluştu.";
  }
}

function renderAdminUsers(users) {
  UI.admin.usersList.innerHTML = "";
  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.innerHTML = `
      <div>
        <strong>${u.name}</strong> ${u.is_admin ? '<span style="color:red">(Admin)</span>' : ''}<br>
        <small style="color:var(--text-muted)">${u.email}</small>
      </div>
      <div>
        <span class="badge" style="background:var(--primary); padding: 4px 8px; border-radius: 4px;">${u.tables_count} Tablo</span>
      </div>
    `;
    div.onclick = () => loadAdminUserTables(u.id, u.name);
    UI.admin.usersList.appendChild(div);
  });
}

async function loadAdminUserTables(userId, userName) {
  UI.admin.tablesContainer.classList.remove('hidden');
  UI.admin.selectedUserName.textContent = `${userName} - Tabloları`;
  UI.admin.tablesList.innerHTML = "Yükleniyor...";
  
  const token = localStorage.getItem('auth_token');
  try {
    const res = await fetch(`${API_URL}/admin/users/${userId}/tables`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    const data = await res.json();
    if(data.success) {
      UI.admin.tablesList.innerHTML = "";
      if(data.data.tables.length === 0) {
        UI.admin.tablesList.innerHTML = "Bu kullanıcının henüz tablosu yok.";
        return;
      }
      data.data.tables.forEach(t => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
          <strong>${t.title}</strong><br>
          <small>${new Date(t.created_at).toLocaleDateString()}</small>
        `;
        div.onclick = () => {
          // Tabloyu ekranda göster
          loadTableDetails(t.id);
          // Admin alt panelini gizle
          UI.admin.tablesContainer.classList.add('hidden');
        };
        UI.admin.tablesList.appendChild(div);
      });
    }
  } catch(e) {
    UI.admin.tablesList.innerHTML = "Hata oluştu.";
  }
}

if(UI.admin.btnBack) {
  UI.admin.btnBack.onclick = () => {
    UI.admin.tablesContainer.classList.add('hidden');
  };
}

// Uygulama açılışında auth kontrolü yap
window.addEventListener('DOMContentLoaded', checkAuth);
