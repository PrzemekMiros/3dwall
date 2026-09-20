# Portfolio Przemek Miros — Eleventy

Samodzielny projekt najnowszej wersji portfolio studio-3d-scroll. Eleventy generuje HTML, a lokalny Three.js obsługuje galerię 3D w przeglądarce. Projekt nie wymaga konta ani hostingu Sites.

## Uruchomienie

Wymagany Node.js 20 lub nowszy. W katalogu projektu:

```sh
npm ci
npm run dev
```

Otwórz adres wyświetlony w terminalu (zwykle http://localhost:8080).

## Wersja produkcyjna

```sh
npm run build
```

Wgraj całą zawartość `_site/` na hosting statyczny. Paczka zawiera również gotowy katalog `_site/`. Zasoby muszą pozostać obok pliku index.html, zgodnie z wygenerowaną strukturą. Stronę otwieraj przez HTTP/HTTPS, nie przez file://. Galeria wymaga WebGL.

## Edycja

| Plik | Zawartość |
| --- | --- |
| `src/index.njk` | Szablon HTML, metadane, menu, treść dostępna dla czytników, formularz |
| `src/_data/site.json` | Tytuł strony i opis SEO |
| `src/static/gallery.js` | Scena 3D, treści na ścianach, kolory, światło, realizacje i interakcje |
| `src/static/gallery.css` | Style, fonty i formularz |
| `src/static/motion.js` | Wygładzanie ruchu; mniejsze `omega` wydłuża wyhamowanie |
| `src/static/title-outlines.js` | Kontury głównego napisu 3D |
| `src/static/contact-outlines.js` | Kontury napisu kontaktowego |
| `src/static/*.jpg` | Podłoga i zdjęcia realizacji |

Treści sceny i tekst dostępny w HTML są osobnymi reprezentacjami — przy zmianach aktualizuj oba miejsca. Układ dużych napisów ustalany jest w `gallery.js`.

## Zmiana liter napisu 3D

Kontury są gotowe: Python nie jest potrzebny do uruchomienia ani budowania strony. Opcjonalny generator używa dołączonego fontu Antonio Bold. Edytuj listę `lines` w `scripts/generate-outlines.py`, a następnie:

```sh
python -m pip install fonttools
python scripts/generate-outlines.py
python scripts/generate-outlines.py --contact
npm run build
```

Przy dłuższym napisie dopasuj też skalę i pozycję w `gallery.js`.

## Formularz i odnośniki

Formularz obecnie otwiera program pocztowy przez `mailto:` na adres `kontakt@przemekmiros.pl`. Nie ma backendu wysyłającego wiadomości. Wysyłka bez programu pocztowego wymaga podłączenia endpointu lub usługi formularzy. Sekretów i kluczy nie umieszczaj w kodzie przeglądarki.

Przyciski realizacji prowadzą obecnie do `https://przemekmiros.pl/realizacje/`; możesz ustawić osobne adresy w `gallery.js`.

## Zależności i sprawdzenie

Three.js, Lenis, fonty i obrazy są dołączone lokalnie. Dołączono licencje fontów i Lenis; Three.js ma oznaczenie licencji MIT w pliku biblioteki. Eleventy jest przypięte w `package-lock.json`.

Eksport sprawdzono przez produkcyjne budowanie i kontrolę lokalnych zasobów. Końcowy wygląd sceny należy sprawdzić w przeglądarce z obsługą WebGL.
