# SceneLevel Studio v0.1

Lehký mobilní editor filmových příspěvků pro SceneLevel. Funguje pouze na zařízení uživatele, bez serveru a bez databáze. Nasazení na GitHub Pages je **statické**, není nutný build ani npm.

## GitHub Pages

1. Vytvoř veřejný repozitář `scenelevel-studio`.
2. Nahraj **obsah** této složky (tedy `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js` a složku `assets/`) přímo do kořene repozitáře.
3. V `Settings → Pages` vyber `Deploy from a branch`, `main` a `/(root)`.
4. Po publikování otevři `https://TVUJ-UCET.github.io/scenelevel-studio/`.
5. V Safari na iPhonu použij `Sdílet → Přidat na plochu`.

## Co umí

- Narozeninové, novinkové, memorial, role highlight, memorial outro a CTA šablony.
- Editaci textů a obarvení jednotlivých znaků vybraného textu.
- Fotografie z galerie, přiblížení, posunutí, černý přechod podle délky textu.
- Vlastní průhledné logo přiřazené celému projektu.
- Jeden projekt s libovolným množstvím snímků, pořadí/duplikace/mazání.
- Náhled a PNG v rozlišení 1080 × 1350 nebo 1080 × 1920.
- ZIP všech snímků, automatické lokální koncepty přes IndexedDB, ruční JSON záloha/import.
- Instalaci jako webové aplikace s offline cachí po prvním načtení (Google Fonts se při prvním načtení stahují z internetu).

## Důležité omezení MVP

- Jde o **první funkční prototyp**, zatím nejde o pixelově přesný převod PSD. Pro finální podobu je nutné vložit původní průhledné logo a doladit přesné pozice prvků podle PSD.
- Pro fonty se používají Google Fonts Anton a Oswald. Pro plnou offline dostupnost bude vhodné je později dodávat lokálně v souladu s jejich licencí.
- Koncepty uložené do prohlížeče se nesynchronizují mezi zařízeními, a po vymazání dat webu mohou zmizet. Používej tlačítko **Záloha projektu**.
- Soubory nahraješ pouze ve svém prohlížeči. **Nedávej originální PSD ani soukromé/neveřejné obrázky do veřejného GitHub repozitáře.**
- iOS může při mnoha velkých fotografiích vyčerpat paměť; hromadný export desítek snímků je nutné otestovat na konkrétním iPhonu.
- HEIC může nebo nemusí jít přečíst podle verze Safari. JPG/PNG fungují nejspolehlivěji.
- Základ PWA používá SVG ikonu; pro nejlepší zobrazení na iOS později přidáme standardní PNG apple-touch-icon.
- Změna textu ruší uživatelské zvýraznění znaků v daném textovém poli; později doplníme zachování při editaci.

## Změny šablon

Šablony a jejich základní texty najdeš v konstantě `TYPES` v `app.js`. Přidání nové šablony znamená přidat do `TYPES` a do seznamů `<select>` v `index.html`; kód vykreslení v `renderSlide` můžeš rozšířit pro unikátní layout.

## Lokální otevření

Protože service worker vyžaduje HTTPS nebo localhost, pro vývoj je vhodné spustit ze složky `python -m http.server 8080` a otevřít `http://localhost:8080`. Samotný editor funguje i bez build systému.
