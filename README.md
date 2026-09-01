# Forza Game Club — Demo v1

Bu, mobil və desktop üçün hazırlanmış ilk işlək prototipdir.

## Hazır olanlar
- Forza Game Club üçün original racing/gaming dizayn
- 16 PC kartı
- PC statusları: Boş / Rezerv / İstifadədə / Texniki
- Tarix, saat və müddət üzrə rezervasiya
- Eyni PC üçün üst-üstə düşən rezervasiyanın qarşısının alınması
- Demo admin panel
- Admin tərəfdə rezervasiyanı ləğv etmək
- Admin tərəfdə PC statusunu dəyişmək
- Oyunlar bölməsi
- Məkan bölməsi
- Canlı dəstək və AI dəstək üçün demo chat interfeysi

## Demo admin şifrəsi
1234

## Vacib qeyd
Bu ilk versiyada məlumatlar brauzerin localStorage yaddaşında saxlanılır.
Bu yalnız prototip üçündür.

Növbəti mərhələdə Supabase/PostgreSQL kimi real database qoşulmalıdır ki:
- rezervasiyalar bütün cihazlarda görünsün,
- admin başqa telefondan/kompüterdən idarə edə bilsin,
- məlumatlar itməsin,
- real login və canlı chat işləsin.

## Açmaq
index.html faylını brauzerdə açın.


## V2 dəyişiklikləri
- Məkan fotosu dizayndan çıxarıldı.
- 16 PC belə bölündü:
  - PC-01 — PC-08: Adi zal, 4 AZN/saat
  - PC-09 — PC-12: VIP 4K, 5 AZN/saat
  - PC-13 — PC-16: VIP Sadə, 5 AZN/saat
- VIP Sadə kompüterlərdə Forza Horizon 5 və Forza Horizon 6 yoxdur.
- Oyun siyahısı:
  - Assetto Corsa
  - City Car Driving
  - Forza Horizon 5
  - Forza Horizon 6
  - Euro Truck Simulator 2
  - FiveM
- Rezervasiya zamanı məbləğ avtomatik hesablanır.


## V4 əlavə olunan tələblər
- Müştəri hesabı interfeysi:
  - Gmail / Google ilə giriş üçün hazır UI
  - Telefon nömrəsi ilə qeydiyyat
  - WhatsApp təsdiq kodu üçün demo axın
- Müştəri kabineti:
  - bonus balansı
  - status
  - rezervasiyalar
- Admin panel:
  - rezervasiyaları idarə etmək
  - PC statusları
  - müştəri əlavə etmək
  - bonus yükləmək
  - qara siyahıya atmaq / çıxarmaq
  - qiymətləri dəyişmək
  - oyunlar və sayt ayarları üçün idarəetmə bölmələri
- Oyun müddəti:
  - 30 dəqiqədən başlayır
  - 30 dəqiqəlik artımlarla seçimlər
  - Limitsiz seçimi
- "Başlama vaxtı" ifadəsi istifadə olunur.

## Real sistem üçün vacib
Google login, WhatsApp OTP, real admin təhlükəsizliyi və bütün cihazlarda ortaq məlumatlar üçün backend/database və rəsmi API inteqrasiyası tələb olunur.
WhatsApp kod göndərilməsi real layihədə WhatsApp Business API provayderi ilə işləyəcək.


## V5 rezervasiya məntiqi
- Rezervasiyadan əvvəl 5 dəqiqəlik hazırlıq intervalı avtomatik bloklanır.
  Məsələn 17:30 rezervasiyası varsa, həmin PC üçün yeni rezervasiya ən gec 17:25-də bitməlidir.
- Rezerv intervalı qırmızı, hazırlıq intervalı sarı göstərilir.
- Rezervasiya vaxtı gəldikdə PC statusu avtomatik "İstifadədə" olur.
- Rezervasiya bitəndən sonra PC avtomatik yenidən boş vəziyyətə qayıdır, başqa rezervasiya yoxdursa.
- Admin PC statusunu istəyə görə manual şəkildə:
  - Boş
  - Rezerv
  - İstifadədə
  - Texniki
  - və ya Avtomatik rejimə keçirə bilər.
- PC kartında "Oyunlara bax" düyməsi var və həmin PC-də olan oyunlar ayrıca açılır.

## Real istifadə üçün
Bu məntiq real backend/database ilə tətbiq olunmalıdır ki, iki fərqli müştəri eyni anda rezervasiya etməyə çalışanda server səviyyəsində də toqquşma bloklansın.
