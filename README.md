<div align="center">
  <h1>🚀 Smart Table AI</h1>
  <p><strong>Karmaşık verilerinizi, el yazısı notlarınızı ve faturalarınızı yapay zeka gücüyle anında akıllı tablolara dönüştürün.</strong></p>
  
  [![Live Demo](https://img.shields.io/badge/🔴_CANLI_DEMO_İÇİN_TIKLAYIN-0B101E?style=for-the-badge&logo=google-chrome&logoColor=FF8C00)](http://santiye.ahmetakaslan.com/)
</div>

<br>

## 📖 Projenin Amacı Nedir?

Gündelik hayatta veya iş akışlarında (özellikle şantiye, muhasebe, stok takibi gibi alanlarda) veriler genellikle dağınık fişler, WhatsApp mesajları veya el yazısı notlar halinde gelir. Bu düzensiz verileri alıp Excel formatına dönüştürmek ciddi bir zaman ve iş gücü kaybıdır.

**Smart Table AI**, tam olarak bu sorunu çözer. Arkasındaki **Google Gemini AI** görsel ve metin işleme motoru sayesinde, sisteme yüklediğiniz *herhangi bir formattaki* veriyi (bir fotoğraf, fiş, ekran görüntüsü veya düzensiz bir kopyala-yapıştır metin) saniyeler içinde analiz eder. İçerisindeki mantıksal veriyi (ürün adı, miktar, birim, fiyat, toplam vb.) anlar ve tamamen düzenlenebilir, profesyonel bir veri gridine (tabloya) dönüştürür.

*(Buraya uygulamanın arayüzünden bir resim ekleyebilirsiniz)*
<!-- ![Uygulama Ekran Görüntüsü](/resim_yolu.png) -->

---

## ✨ Neler Yapabilirsiniz?

* 📸 **Görselden (OCR) Akıllı Çıkarım:** Fatura veya el yazısı notunuzun fotoğrafını yükleyin. Yapay zeka oradaki yazıları okumakla kalmaz, finansal/ticari mantığını kurarak tabloya yerleştirir.
* 🤖 **AI Chat ile Tablo Güncelleme:** Oluşturulan tablo üzerinde manuel işlem yapmak istemiyorsanız, alttaki yapay zeka asistanına *"Çimentonun birim fiyatına %20 zam yap"* veya *"Ahmet'in yevmiyesini listeden çıkar"* yazmanız yeterlidir. Tablo anında güncellenir.
* 💾 **Otomatik Taslak (Auto-Save):** Siz yazarken veya tabloyu düzenlerken, verileriniz tarayıcı önbelleğine (Local Storage) kaydedilir. Sekmeyi yanlışlıkla kapatsanız bile hiçbir şey kaybolmaz.
* 🛠 **Dinamik Sütun Yönetimi:** Sütunların yerlerini kaydırabilir, gereksizleri silebilir veya başlık isimlerini anında değiştirebilirsiniz. (Altındaki veriler bozulmadan başlığa uyum sağlar).
* 📄 **Tek Tıkla PDF & Çıktı:** Mobil uyumlu, sayfadan taşmayan temiz bir algoritma ile tablonuzu kusursuz PDF formatında dışarı aktarın.

## 🛠 Kullanılan Teknolojiler

Bu proje, hız ve hafiflik odaklı olarak geliştirilmiştir:
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Modern UI)
- **Backend:** Laravel 11.x, PHP 8.2 (RESTful API Mimarisi)
- **Yapay Zeka:** Google gemini-3.8-flash (Generative AI & Vision)

## 🚀 Kurulum & Çalıştırma

Projeyi kendi bilgisayarınızda (lokalde) çalıştırmak için:

1. **Projeyi indirin:**
   ```bash
   git clone https://github.com/ahmetakaslan1/smart-table-ai.git
   ```
2. **Backend (API) Ayarları:**
   Backend klasöründeki `.env.example` dosyasının adını `.env` olarak değiştirin ve içerisine Gemini API anahtarınızı ekleyin:
   ```env
   GEMINI_API_KEY=sizin_api_anahtariniz_buraya
   ```
3. **Sunucuyu Başlatın:**
   ```bash
   php artisan serve
   ```
4. **Frontend:**
   `frontend` klasöründeki `index.html` dosyasını tarayıcınızda (veya Live Server ile) açarak hemen kullanmaya başlayabilirsiniz.
