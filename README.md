# SceneLevel Studio v0.2

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
- Fotografie z galerie, vložení z obrazové schránky (Ctrl+V/Cmd+V), vložení přetažením, zoom 50–250 %, posun a reset.
- CTA snímek s horním a spodním přechodem přes fotografii.
- Bílé originální logo SceneLevel jako výchozí SVG v `assets/`.
- Originální bílé logo automaticky, volitelně vlastní průhledné logo přiřazené celému projektu.
- Jeden projekt s libovolným množstvím snímků, pořadí/duplikace/mazání také pomocí × na každém náhledu.
- Náhled a PNG v rozlišení 1080 × 1350 nebo 1080 × 1920.
- ZIP všech snímků, automatické lokální koncepty přes IndexedDB, ruční JSON záloha/import.
- Instalaci jako webové aplikace s offline cachí po prvním načtení (Google Fonts se při prvním načtení stahují z internetu).

## Důležité omezení MVP

- Jde o **rozpracovaný prototyp**, zatím nejde o pixelově přesný převod PSD. Originální logo už je součástí projektu; přesné pozice prvků a přechody ještě ladíme podle PSD.
- Pro fonty se používají Google Fonts Anton a Oswald. Pro plnou offline dostupnost bude vhodné je později dodávat lokálně v souladu s jejich licencí.
- Koncepty uložené do prohlížeče se nesynchronizují mezi zařízeními, a po vymazání dat webu mohou zmizet. Používej tlačítko **Záloha projektu**.
- Soubory nahraješ pouze ve svém prohlížeči. **Nedávej originální PSD ani soukromé/neveřejné obrázky do veřejného GitHub repozitáře.**
- iOS může při mnoha velkých fotografiích vyčerpat paměť; hromadný export desítek snímků je nutné otestovat na konkrétním iPhonu.
- HEIC může nebo nemusí jít přečíst podle verze Safari. JPG/PNG fungují nejspolehlivěji.
- Základ PWA používá SVG ikonu; pro nejlepší zobrazení na iOS později přidáme standardní PNG apple-touch-icon.
- Změna textu ruší uživatelské zvýraznění znaků v daném textovém poli; později doplníme zachování při editaci.

## Změny ve v0.2 a aktualizace z v0.1

1. Pro jistotu si ve stávající aplikaci klikni na **Záloha projektu** (uložíš si JSON soubor). V novém kódu zůstává stejná databáze konceptů (`scenelevel-studio-v1`), takže dosavadní koncept se má zachovat.
2. V kořeni GitHub repozitáře nahraj a nahraď `app.js`, `index.html`, `styles.css`, `sw.js`, `README.md`; do složky `assets/` přidej `logo_name_white.svg`. Zbývající soubory mohou zůstat beze změny. Nejjednodušší je nahrát veškerý **obsah ZIP** do kořene repozitáře a potvrdit přepsání.
3. Po dokončení Pages deploye otevři web. Při přetrvávající staré verzi ho znovu načti, případně úplně zavři a otevři PWA (service worker má nové číslo cache).
4. `Ctrl+V` nebo `Cmd+V` vloží skutečně zkopírovaný obrázek do právě vybraného snímku. V závislosti na zdrojovém webu může být ve schránce pouze URL a ne bitmapa; v tom případě obrázek nejprve stáhni nebo vyber z galerie. Tlačítko pro přímé čtení ze schránky nemusí být podporováno v každé verzi iOS/Safari.
5. Pokud nastavíš zoom **pod 100 %**, obrázek může být menší než vymezená obrazová plocha — volný prostor se vyplní zvolenou barvou pozadí, což je záměr.

## Změny šablon

Šablony a jejich základní texty najdeš v konstantě `TYPES` v `app.js`. Přidání nové šablony znamená přidat do `TYPES` a do seznamů `<select>` v `index.html`; kód vykreslení v `renderSlide` můžeš rozšířit pro unikátní layout.

## Lokální otevření

Protože service worker vyžaduje HTTPS nebo localhost, pro vývoj je vhodné spustit ze složky `python -m http.server 8080` a otevřít `http://localhost:8080`. Samotný editor funguje i bez build systému.
