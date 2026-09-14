/**
 * numpad.js — Şantiye Sıfır Hata Motoru
 * Görevler:
 *  1. Sayısal input'larda harf girişini engelle (numpad zorlaması)
 *  2. Virgül (,) girişini otomatik noktaya (.) çevir
 *  3. Değeri Türk formatında binlik ayraçlı göster (150.000,50 ₺)
 *  4. Hesaplama için temiz float değeri döndür
 */

const Numpad = (() => {

  /**
   * Ham string'i temiz bir float'a çevirir.
   * "150.000,50" → 150000.50
   * "150,50" → 150.50
   * "150.50" → 150.50 (nokta zaten ondalık ayracı gibi kullanılmış)
   */
  function parseNumber(raw) {
    if (raw === null || raw === undefined || raw === '') return NaN;
    let str = String(raw).trim();

    // Sayı ve nokta/virgül dışındaki karakterleri temizle
    str = str.replace(/[^\d.,]/g, '');

    if (!str) return NaN;

    // Türk formatı: 150.000,50 → nokta binlik, virgül ondalık
    if (str.includes(',')) {
      // Son virgülden sonrası ondalık
      const parts = str.split(',');
      const intPart = parts[0].replace(/\./g, ''); // binlik noktaları kaldır
      const decPart = parts[parts.length - 1];
      str = intPart + '.' + decPart;
    } else {
      // Sadece nokta var; eğer son 3 haneden fazlaysa ondalık değil binlik ayraç
      // Örn: "150.000" → 150000, "150.5" → 150.5
      const dotIdx = str.lastIndexOf('.');
      if (dotIdx !== -1) {
        const afterDot = str.slice(dotIdx + 1);
        if (afterDot.length === 3 && str.indexOf('.') === dotIdx) {
          // Tek nokta ve 3 hane → binlik ayraç
          str = str.replace('.', '');
        }
        // Aksi halde noktalı kısmı ondalık olarak bırak
      }
    }

    const num = parseFloat(str);
    return num; // isNaN(num) will natively return NaN
  }

  /**
   * Float'ı Türk para formatında döndürür.
   * 150000.5 → "150.000,50"
   * Sadece gösterim için kullanılır, veritabanına ham sayı gider.
   */
  function formatTR(num, decimals = 2) {
    if (isNaN(num) || num === null || num === '') return '';
    return parseFloat(num).toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Input element'e numpad davranışı ekler.
   * IPTAL EDILDI: Kullanıcı özgürce metin yazabilsin diye klavye kilitleri kaldırıldı.
   */
  function attach(input) {
    // No-op
  }

  return { parseNumber, formatTR, attach };
})();
