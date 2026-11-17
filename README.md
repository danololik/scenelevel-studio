# SceneLevel Studio v1.0.1 — oprava kontroly verze

Opraven nesoulad: v1.0 měla v `index.html` kontrolu na staré `0.9.0`, přestože `app.js` správně hlásil `1.0.0`. To způsobovalo falešné oranžové upozornění.

- Kontrola v `index.html` a identifikátor v `app.js` mají nyní shodně `1.0.1`.
- Aktualizovány odkazy na JS/CSS a cache service workeru, aby se verze nemíchaly.
- Opraveno číslo verze v rozhraní.
- Funkce a formát uložených projektů zůstaly stejné.

Nasazení: celý obsah složky nahrát do kořene veřejného GitHub repozitáře scenelevel-studio. Data prohlížeče nemažte.
