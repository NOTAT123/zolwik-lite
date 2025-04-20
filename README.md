# 🚗 Aplikacja Mapowa 3D – Żółwik Lite

**Nowoczesna, webowa aplikacja mapowa** inspirowana Yanosikiem i Google Maps, wykorzystująca darmowe technologie: OpenStreetMap, Leaflet, OSM Buildings oraz Web Speech API.

---

## 🎯 Cele projektu

- Zapewnienie darmowej i otwartej alternatywy dla aplikacji takich jak Yanosik
- Pokazywanie użytkownikowi potencjalnych zagrożeń na drodze w czasie rzeczywistym
- Umożliwienie tworzenia własnych zgłoszeń i alertów głosowych
- Nauka i eksperymentowanie z technologiami mapowymi w czystym JavaScript

---

## ✨ Główne funkcje

- 🗺️ Mapa z **widokiem 3D budynków** (OSM Buildings)
- 📍 **Geolokalizacja użytkownika** (aktualizowana w czasie rzeczywistym)
- 📢 **Powiadomienia głosowe** o najbliższych zagrożeniach (TTS)
- ⚠️ Zgłaszanie:
  - Fotoradarów
  - Policyjnych kontroli drogowych
  - Robót drogowych
- 🔄 **Odliczanie i możliwość anulowania** zgłoszenia
- 🎛️ **Panel ustawień** z zakładkami:
  - Wygląd mapy: jasny / ciemny motyw
  - Zarządzanie typami zagrożeń
- 📂 **Lokalne ikony** (z folderu `images/`)
- 📶 Współpraca z **Overpass API** (OSM) – pobieranie realnych zgłoszeń

---

## 🧠 Inspiracje

- [Yanosik](https://yanosik.pl) – społecznościowa aplikacja ostrzegająca o zagrożeniach
- [Google Maps](https://maps.google.com) – widok 3D, interfejs, UX
- [Leaflet.js + OSM Buildings](https://osmbuildings.org) – budynki w 3D
- Open Source ❤️

---

## 📷 Zrzuty ekranu

![Widok mapy](images/zrzut1.jpg)  
_Podgląd mapy z aktywnymi zagrożeniami i budynkami w 3D_

![Panel ustawień](images/zrzut2.jpg)  
_Zakładka ustawień mapy i zarządzania zgłoszeniami_

---

## 🧰 Technologie

| Technologia        | Opis                                   |
|--------------------|----------------------------------------|
| HTML/CSS/JS        | Podstawowy frontend                    |
| Leaflet.js         | Silnik mapowy                          |
| OSM Buildings      | Renderowanie budynków 3D               |
| Overpass API       | Pobieranie danych z OpenStreetMap      |
| Web Speech API     | Syntezator mowy (TTS)                  |
| Geolocation API    | Śledzenie lokalizacji użytkownika      |

---

## 🛠️ Wymagania systemowe

- Przeglądarka z obsługą JavaScript, HTML5 i Web APIs
- Internet (dla map i zgłoszeń), lokalny serwer zalecany
- Uprawnienia do lokalizacji
- Minimalnie: Chrome 89+, Firefox 85+, Edge 88+

---

## 🛣️ Planowane funkcje
 - 🔊 Głośność i język TTS w ustawieniach

 - 🧭 Nawigacja między punktami (jak w Google Maps)

 - 📊 Historia zgłoszeń i statystyki

 - 📡 WebSocket/API

 - 📥 Import/eksport danych JSON

---

## 🤝 Współpraca

 - Chcesz dołożyć coś od siebie? Śmiało!

 - Otwórz Issue lub zrób Fork + Pull Request ✨

 - Napisz na GitHubie, jeśli chcesz rozwinąć projekt wspólnie!

---

## 📝 Credits (OBOWIĄZKOWE PRZY UŻYCIU)
 - Autor aplikacji mapowej: @NOTAT123 (GitHub)
 - Dane map: ©autorzy OpenStreetMap
 - Render 3D: OSM Buildings
 - Silnik mapy: Leaflet.js


DZIEKUJE ZA PRZECZYTANIE! PROJEKT MOZESZ STESTOWAĆ TU:
https://notat123.github.io/zolwik-lite/yanosik-lite/index.html



