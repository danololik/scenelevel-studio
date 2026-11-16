# SceneLevel Studio v0.8

Oprava mobilní navigace (iPhone / Safari):
- Spodní lišta **Snímky / Text / Fotka / Více** je nyní trvale viditelná i při procházení snímků a při úpravách obsahu.
- Opravena chybná identifikace záložky Text, která dříve ukazovala na Snímky.
- Odstraněn automatický `scrollIntoView` přepínající fokus a někdy odscrollovávající mobilní navigaci.
- Samostatné oblasti pro procházení snímků a editaci vybrané záložky.
- Verze assetů a service worker cache aktualizované na v0.8.

Uložené projekty a formát dat z v0.7 zůstávají beze změny. Před nasazením doporučujeme zálohovat projekty v aplikaci.

Nasazení: rozbal ZIP a nahraj **obsah složky** do kořene veřejného GitHub repozitáře, včetně `assets/`.
