# SceneLevel Studio v1.0

Statická aplikace pro GitHub Pages. Náhrada souborů z v0.9; bez změny schématu uložených projektů.

## Změny
- Informační snímky novinek: dynamicky počítaný začátek přechodu a pozice loga z délky textu. Krátký text = větší část fotografie; dlouhý text = více prostoru pro tmavé pozadí.
- Běžné snímky: menší výchozí spodní okraj, rozložení více přiléhá k textu.
- Na iPhonu v záložce Fotka přidáno nativní pole „podržet → Vložit“ jako alternativa k tlačítku. iOS Safari někdy kopíruje z Google obrázků pouze odkaz, ne fotku; ten není možné bezpečně vložit do exportovaného PNG kvůli CORS. Pak je potřeba uložit fotku do zařízení.
- Nová verze cache, aby se nepletly styly a JavaScript mezi verzemi.

Před nasazením proveď zálohu projektů. Nahraj obsah rozbalené složky do kořene GitHub repozitáře.
