# Smart Table AI 🚀
*(Eski adıyla Şantiye Net)*

Smart Table AI, düzensiz metinleri, el yazısı notları, fatura fotoğraflarını ve fişleri **yapay zeka (Gemini AI)** gücüyle anında düzenli ve düzenlenebilir veri tablolarına dönüştüren modern bir web uygulamasıdır.

## ✨ Özellikler

- **Görselden Veri Çıkarma (OCR + AI):** Fiş, fatura veya herhangi bir ekran görüntüsünü yükleyin, yapay zeka içindeki tüm ticari ve mantıksal verileri (ürün, miktar, fiyat vb.) saniyeler içinde okuyup tabloya döksün.
- **Akıllı Tablo Asistanı:** Oluşturulan tablo üzerinde değişiklik yapmak için hücrelere tıklamak zorunda değilsiniz. "Ahmet'in yevmiyesini 2000 yap", "Tüm birim fiyatlara %10 zam yap" gibi doğal dilde komutlar vererek tabloyu güncelleyin.
- **Otomatik Kayıt (Auto-Save):** Verileriniz tarayıcınızda (Local Storage) otomatik olarak taslak olarak tutulur. Sayfayı yanlışlıkla kapatsanız bile verileriniz kaybolmaz.
- **Gelişmiş Sütun Yönetimi:** Sütunların yerlerini kaydırın, gereksizleri silin veya başlıkları yeniden adlandırın.
- **PDF ve Yazdırma Desteği:** Tablonuzu tek tıkla mükemmel hizalanmış ve sayfa taşması yapmayan temiz bir PDF dosyasına veya Excel'e dönüştürün.
- **Kusursuz Mobil Deneyim:** iOS HEIC fotoğraf formatı desteği dahil tüm mobil cihazlarda sorunsuz çalışma.

## 🛠️ Teknolojiler
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Properties, Grid/Flexbox)
- **Backend:** Laravel 11.x, PHP 8.2
- **Yapay Zeka:** Google Gemini 1.5 Flash (Generative AI)

## 🚀 Kurulum

1. Depoyu klonlayın:
```bash
git clone https://github.com/ahmetakaslan1/smart-table-ai.git
```
2. Frontend klasöründeki `index.html` dosyasını bir yerel sunucu (Live Server vb.) ile çalıştırın.
3. Backend klasöründeki (Laravel) proje için `.env.example` dosyasını `.env` olarak kopyalayın ve içerisine kendi Gemini API Anahtarınızı (`GEMINI_API_KEY`) ekleyin.
4. PHP sunucusunu başlatın:
```bash
php artisan serve
```

## 📝 Kullanım
- Arayüze girdikten sonra metin kutusuna karmaşık verilerinizi girin veya bir hesap fotoğrafı yükleyin.
- "Tabloya Dönüştür" butonuna basın.
- Çıkan tabloyu istediğiniz gibi düzenleyin veya altındaki sohbet ekranından yapay zekaya güncellettirin.
- Sonucu bilgisayarınıza PDF/Excel olarak indirin!
