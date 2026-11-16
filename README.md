# SceneLevel Studio v0.7

Bezpečný výběr snímků: klepnutí pouze vybírá; mazání je samostatné tlačítko s potvrzením. Mobilní galerie je 3sloupcová bez překryvných tlačítek. Záložky jsou nahoře, náhled zůstává viditelný. Staré projekty zůstávají uložené v IndexedDB.

**Aktualizace:** rozbal ZIP a nahraj všechny soubory do kořene GitHub repozitáře. Před nasazením doporučujeme exportovat zálohu projektu. Pokud iPhone stále ukazuje staré UI, otevři web přímo v Safari v nové kartě; nesmaž data webu, protože obsahují koncepty.

## SceneLevel Studio v0.6

Mobilní editor má čtyři samostatné záložky: Snímky, Text, Fotka a Více. Náhled zůstává nahoře; na mobilu nejsou přes jednotlivé náhledy mazací křížky. Mazání vybraného snímku vyžaduje potvrzení. Všechny funkce a úložiště v0.5 zachovány.

# SceneLevel Studio v0.5 — oprava filmových novinek

Toto je kompletní sada souborů pro GitHub Pages. Nahraj **obsah** rozbalené složky do kořene repozitáře `scenelevel-studio` (včetně `assets/`) a přepiš staré soubory.

## Filmové novinky podle dodaného PSD
- `Slide 1`: fotografie, bílé SceneLevel logo, velký titulek (`news`).
- `Slide 2`: fotografie, bílé SceneLevel logo, delší informační text (`newsinfo`).
- `Slide 3`: barevné logo, slogan, fotografie s dvěma přechody, spodní text (`cta`).
- Nový projekt **Filmová novinka automaticky obsahuje všechny tři snímky**.
- Tlačítko **+ Přidat informační snímek** vytvoří další informační snímek **před posledním CTA**.
- Otevření starší filmové novinky z v0.3/v0.4, ve které chybí informační snímek, jej samo doplní, aniž by cokoli mazalo. Pokud má projekt další nesouvisející či duplicitní snímky, zůstanou zachované pro ruční úpravu.
- Aktualizované URL CSS/JS a cache service workeru v5 zabraňují kombinaci nové stránky se starým JavaScriptem. Aplikace hlásí zjevný nesoulad verzí.

## Co se nemění
- Rozlišení PNG, export ZIP, gesta fotografie, práce se schránkou, fonty Anton/Oswald, bílé a barevné logo.
- Projekty jsou nadále v IndexedDB **pouze na daném zařízení**. **Před aktualizací vždy stáhni zálohu projektu**; při výmazu dat prohlížeče by se lokální projekty ztratily.
- Aplikace nikdy automaticky neodstraňuje starší snímky.

## Publikace
1. Zálohuj projekt v0.4.
2. Na GitHub otevři `Add file → Upload files`, vyber **obsah** rozbaleného balíčku a potvrď přepsání všech předchozích souborů.
3. Potvrď `Commit changes`.
4. Po úspěšném GitHub Pages deployi stránku otevři znovu; při zobrazení starých souborů proveď `Ctrl+Shift+R` (v Safari zavři a znovu otevři web app).
5. Na úvodní obrazovce založ **novou filmovou novinku** – musí obsahovat **3** snímky. Na druhém klikni na **+ Přidat informační snímek** – musí vzniknout čtvrtý, před závěrečným CTA.
