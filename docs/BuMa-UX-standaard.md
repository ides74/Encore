---
name: buma-ux-standaard
description: BuMa UX-standaard voor alles wat we bouwen als artifact (dashboards, formulieren, tools, apps, rapporten). Gebruik bij elk scherm dat je ontwerpt, bouwt of reviewt en voor elke publicatie.
version: 1.0 (6 november 2026)
---

# BuMa UX-standaard voor artifacts

Eén set regels voor alles wat Business Markers bouwt: dashboards, invulformulieren, tools, apps en rapporten. Gebaseerd op bewezen standaarden: WCAG 2.2 (toegankelijkheid), Nielsen Norman Group (usability), Stephen Few en IBCS (dashboards), GOV.UK Design System (formulieren en fouten), Apple HIG en Material Design (aanraakdoelen).

**Zo lees je dit document**
- Elke regel heeft een code (bv. F3) en een niveau.
  - **MUST:** blokkeert een publicatie.
  - **SHOULD:** oplossen of bewust in de backlog zetten met een reden.
- **Auto** = automatisch te testen. **Hand** = 10 minuten zelf nakijken.
- Bij twijfel wint de regel die het werk van de gebruiker het kortst maakt.

---

## 0. Aanbeveling: wat we integreren en hoe we het opzetten

| # | Wat | Waar in het BuMa-account | Waarom |
|---|---|---|---|
| 1 | Dit document als **Claude-skill** `buma-ux-standaard` | Settings, Skills: upload dit bestand als SKILL.md | Claude past de regels toe bij elk scherm dat hij bouwt, zonder dat iemand het moet vragen |
| 2 | **Design System-artifact** "BuMa" met de tokens van sectie 3 (kleuren licht en donker, typeschaal, spacing, radius, componenten) | Artifacts, type Design System | Eén bron voor merk en maten; elke nieuwe creatie start daarvan |
| 3 | **Projectsjabloon** (GitHub, privé): `src/`, `tokens.css`, `tools/build.py`, `tools/check_all.sh`, `tools/lint_ux.py`, `test/ux_audit.py`, `docs/` met RELEASE en deze checklist | GitHub, organisatie Business Markers | Elke app heeft dezelfde structuur, tests en upgradeprocedure |
| 4 | **Automatische UX-audit** bij elke release: contrast, labels, focus, zijwaarts scrollen, aanraakdoelen, tekstgroottes, primaire knoppen | in het sjabloon, `check_all.sh` | Fouten worden gevonden voor de klant ze ziet |
| 5 | **Handtest van 10 minuten** (sectie 15) en een **heuristische review** door 2 tot 3 collega's bij elke nieuwe creatie | `docs/RELEASE.md` | Wat een script niet ziet: logica, taal, eerste indruk |
| 6 | Eén regel in de **projectinstructies** van elk Claude-project: "Volg de skill buma-ux-standaard voor elk scherm en elke publicatie." | Projects, Instructions | Zekerheid dat de skill ook geladen wordt |

**Volgorde om op te zetten:** skill (1 uur), Design System (een halve dag), sjabloon met audit (een dag, vertrekkend van EnCORE Coach), daarna bij elke nieuwe creatie.

---

## 1. Principes

Gebaseerd op de 10 heuristieken van Nielsen, vertaald naar onze creaties.

| # | Principe | Wat het betekent in de praktijk |
|---|---|---|
| P1 | **Toon altijd wat er gebeurt** | Laden, bewaren, fout, gelukt: altijd zichtbaar binnen een redelijke tijd |
| P2 | **Spreek de taal van de gebruiker** | Hun woorden, niet de onze of die van het systeem: "Openstaande facturen", niet "AR backlog" |
| P3 | **Controle en een weg terug** | Annuleren, ongedaan maken, terug: elke stap is omkeerbaar of wordt eerst bevestigd |
| P4 | **Consistent** | Dezelfde actie heeft overal dezelfde naam, plaats en kleur, in al onze apps |
| P5 | **Voorkom fouten** | Beter dan een goede foutmelding: een ontwerp waarin de fout niet kan (keuzelijst, standaardwaarde, grenzen) |
| P6 | **Herkennen boven onthouden** | Opties zichtbaar maken; de gebruiker hoeft niets te onthouden tussen schermen |
| P7 | **Snel voor wie het vaak doet** | Standaard ingevuld, sneltoetsen, "zoals vorige keer"; nooit overtypen wat de app al weet |
| P8 | **Minimalistisch** | Elk extra element concurreert met wat belangrijk is: weglaten wat niet helpt beslissen of handelen |
| P9 | **Fouten herkennen en herstellen** | Gewone taal, geen codes, zeg wat er mis is en hoe je het oplost |
| P10 | **Hulp op het moment zelf** | Een zin uitleg bij het veld of de grafiek, geen handleiding achteraf |

Daarbovenop, BuMa:
- **E1. Eén taak per scherm.** Wat moet de gebruiker hier doen of beslissen? Dat staat bovenaan.
- **E2. Inzicht voor versiering.** Eerst de boodschap, dan de vorm. Een scherm zonder boodschap is niet af.
- **E3. Herkenbaar BuMa.** Symbolisch, energiek en stijlvol, maar nooit ten koste van leesbaarheid.

---

## 2. Toegankelijkheid (basis: WCAG 2.2 niveau AA)

Toegankelijk is ook gewoon beter voor iedereen: fel licht, kleine schermen, haast, ouder worden.

| # | Regel | Niveau | Test |
|---|---|---|---|
| A1 | Tekstcontrast minstens **4,5:1**; grote tekst (vanaf 24 px of 18,5 px vet) minstens **3:1** | MUST | Auto |
| A2 | Contrast van niet-tekst (randen van velden, iconen, grafieklijnen) minstens **3:1** | MUST | Hand |
| A3 | Kleur nooit als enige drager van betekenis: altijd ook een woord, icoon, vorm of patroon | MUST | Hand |
| A4 | Elk veld heeft een label (zichtbaar of aria-label in tabellen) | MUST | Auto |
| A5 | Alles werkt met het toetsenbord; zichtbare focusring van minstens 2 px | MUST | Auto |
| A6 | Focus wordt niet verborgen door vaste balken of pop-ups (WCAG 2.4.11) | MUST | Hand |
| A7 | Aanraakdoelen minstens **24 × 24 px** (WCAG 2.5.8, AA); **onze norm 44 × 44 px** op touch (Apple 44 pt, Material 48 dp) | MUST 24 / SHOULD 44 | Auto |
| A8 | Slepen nooit als enige manier: altijd ook knoppen of pijlen (WCAG 2.5.7) | MUST | Hand |
| A9 | Niets wat de gebruiker al invulde opnieuw vragen in hetzelfde proces (WCAG 3.3.7) | SHOULD | Hand |
| A10 | Animaties kort (tot 250 ms) en uit bij "verminder beweging" | SHOULD | Hand |
| A11 | Taal van de pagina ingesteld (`lang="nl-BE"`), koppen in logische volgorde (h1, h2, h3) | SHOULD | Auto |
| A12 | Zoomen tot 200 % zonder dat inhoud verdwijnt of zijwaarts scrolt | SHOULD | Hand |

---

## 3. Kleur en tokens

Kleur heeft een rol, geen smaak. Elke kleur in de code is een **token** (CSS-variabele) met één betekenis. Losse kleurcodes in de code zijn verboden (lint).

**Rollen (vul in per merk: BuMa, klant)**

| Token | Rol | Regel |
|---|---|---|
| `--brand` | logo, lijnen, actieve tab, grote vlakken | mag fel zijn; niet voor gewone tekst als het contrast onder 4,5:1 ligt |
| `--brand-text` | tekst en gevulde primaire knop | donkerdere variant van het merk, minstens 4,5:1 |
| `--ink` / `--muted` | tekst / uitleg en labels | `--muted` minstens 4,5:1 op de achtergrond |
| `--bg` / `--panel` / `--line` | achtergrond / kaarten / scheidingslijnen | kaarten onderscheiden door rand of schaduw, niet enkel door kleur |
| `--ok` / `--warn` / `--bad` | goed / aandacht / fout | altijd samen met een woord of icoon (A3) |
| `--focus` | focusring | zichtbaar op elke achtergrond |

**Regels**
- **K1** Hoogstens **3 accentkleuren** per scherm naast zwart en grijs. (SHOULD)
- **K2** Donkere modus heeft eigen waarden per token, geen automatische omkering; ze wordt apart getest. (SHOULD)
- **K3** **Categorieën in grafieken:** een kleurenblind-veilig palet. Ongeveer 8 % van de mannen ziet rood en groen slecht uit elkaar. Standaard is het Okabe-Ito-palet: `#0072B2` blauw, `#E69F00` oranje, `#009E73` groen, `#D55E00` vermiljoen, `#56B4E9` hemelsblauw, `#CC79A7` paars, `#F0E442` geel, `#000000` zwart. (MUST voor grafieken)
- **K4** **Nooit rood tegenover groen als enige verschil.** Goed of slecht = blauw tegenover oranje; of rood en groen met een groot verschil in lichtheid plus een pijl of label. (MUST)
- **K5** **Volgordes en schalen** (heatmap, intensiteit): één kleur van licht naar donker of viridis/cividis; nooit een regenboog. (SHOULD)
- **K6** **Grijs is een kleur:** context, vorige periode en referentie in grijs; het actuele cijfer in de accentkleur. (SHOULD)

---

## 4. Typografie, groottes en spacing

| Element | Grootte | Regel |
|---|---|---|
| Kerngetal (KPI) | 28 tot 40 px | tabelcijfers (`font-variant-numeric: tabular-nums`) |
| Titel scherm | 24 tot 32 px | hoogstens 2 regels |
| Sectietitel | 17 tot 20 px | |
| Lopende tekst | 15 tot 16 px | regels hoogstens 70 tekens breed, regelafstand 1,4 tot 1,6 |
| Invoerveld | **minstens 16 px** | onder 16 px zoomt iOS in bij elke tik |
| Klein (labels, eenheden, assen) | **minstens 12 px** | |

- **T1** Hoogstens 2 lettertypes (titel en tekst) en 5 groottes per app. (SHOULD)
- **T2** Spacing in veelvouden van 4 en 8 px: 4, 8, 12, 16, 24, 32, 48. (SHOULD)
- **T3** Nabijheid groepeert: verwante dingen dicht bij elkaar, groepen ver genoeg uit elkaar (Gestalt). (SHOULD)
- **T4** Getallen altijd met eenheid; decimale komma en punt voor duizendtallen (nl-BE: 1.234,5 kg; € 12.300). Afronden op wat beslissingen nodig hebben. (MUST)
- **T5** Datums: "6 nov 2026" in tekst; "06/11/2026" in tabellen; nooit Amerikaans formaat. (SHOULD)

---

## 5. Structuur en lay-out

- **L1 Leesrichting:** het oog leest van linksboven naar rechtsonder (F- en Z-patroon). Het belangrijkste staat linksboven en is het grootst. (MUST)
- **L2 Vaste zones:**

| Zone | Inhoud |
|---|---|
| Boven | merk, context (klant, periode, filter), navigatie: altijd op dezelfde plaats |
| Kop | titel + één zin: de boodschap of de taak |
| Midden | inhoud in kaarten; op gsm één kolom |
| Onder | status (bewaard, fout) en de primaire actie, binnen bereik van de duim op touch |

- **L3 Geleidelijk tonen:** hoofdzaak open, details ingeklapt of op een tweede niveau (overzicht, dan detail). (SHOULD)
- **L4 Responsief:** werkt op gsm (390 px), iPad (820 en 1180 px) en pc (1366 px); nergens zijwaarts scrollen behalve binnen een tabel met eigen scrollkader. (MUST)
- **L5 Consistente patronen:** dezelfde kaart, tabel en knop overal; een nieuw patroon komt eerst in het Design System. (SHOULD)
- **L6 Navigatie:** hoogstens 7 tabs of menu-items op één niveau; de actieve is duidelijk gemarkeerd. (SHOULD)
- **L7 Lege toestand:** zegt wat hier komt en wat de eerste stap is, met een knop naar die stap. (MUST)

---

## 6. Oog-logica: visuele hiërarchie

- **O1 Volgorde van aandacht:** grootte, gewicht, kleur, plaats. Het belangrijkste wint op minstens twee daarvan. (SHOULD)
- **O2 Eén blikvanger per scherm:** één primaire knop of één kerngetal, niet allebei even luid. (MUST)
- **O3 Leesvolgorde = werkvolgorde:** de gebruiker leest in de volgorde waarin hij werkt of beslist. (SHOULD)
- **O4 5-secondentest:** wie het scherm 5 seconden ziet, kan zeggen waar hij is, wat de boodschap is en wat hij moet doen. (MUST, Hand)
- **O5 Knijptest:** met half dichtgeknepen ogen blijft enkel het belangrijkste over. (SHOULD, Hand)
- **O6 Witruimte is ontwerp:** liever minder elementen met lucht dan alles op één scherm. (SHOULD)

---

## 7. Knoppen en acties

| Soort | Gebruik | Regel |
|---|---|---|
| Primair | de hoofdactie (Bewaren, Versturen, Klaar) | **hoogstens 1 per scherm**, gevuld in `--brand-text` |
| Secundair | andere acties | witte knop met rand |
| Tekstknop | kleine hulpacties | nooit voor iets belangrijks |
| Gevaar | verwijderen | rood, met bevestiging, weg van de primaire knop |

- **B1** Labels zijn werkwoorden die zeggen wat er gebeurt: "Factuur versturen", niet "OK" of "Bevestigen". (MUST)
- **B2** Elke knop heeft de toestanden normaal, hover, ingedrukt, focus, uitgeschakeld en bezig. (SHOULD)
- **B3** Een uitgeschakelde knop zegt waarom ("Vul eerst de datum in"). (SHOULD)
- **B4** Wat niet terug kan, vraagt bevestiging met de naam van wat verdwijnt ("Training van 4 nov verwijderen?"); liever nog: ongedaan maken binnen 5 seconden. (MUST)
- **B5** Na een klik binnen 0,1 seconde zichtbare reactie (knop ingedrukt, "Bezig…"); dubbelklikken mag niets dubbel doen. (MUST)

---

## 8. Formulieren en invullen

| # | Regel | Niveau |
|---|---|---|
| F1 | **Eén kolom.** Enkel echt samenhorende velden op één rij (postcode en gemeente) | SHOULD |
| F2 | **Label boven het veld**, kort en concreet. Nooit enkel placeholdertekst als label: die verdwijnt bij het typen en geeft meer fouten | MUST |
| F3 | **Zo weinig mogelijk velden.** Elk veld moet zijn plaats verdienen; wat de app al weet, wordt vooraf ingevuld | MUST |
| F4 | Meer dan 6 velden: **groeperen** in secties met een titel; lange processen in stappen met een voortgangsaanduiding | SHOULD |
| F5 | **Optionele velden markeren** met "(optioneel)", geen sterretjes voor verplichte velden | SHOULD |
| F6 | **Validatie bij het verlaten van het veld**, niet bij elke toetsaanslag; bij versturen nog eens alles | SHOULD |
| F7 | **Foutmelding bij het veld en bovenaan een overzicht** ("Er is een probleem") met links naar elk veld, ook bij één fout | MUST |
| F8 | **Fouttekst zegt wat en hoe:** "Vul een datum in, bv. 06/11/2026", nooit "ongeldig" of een code | MUST |
| F9 | **Juist toetsenbord:** `inputmode="decimal"` voor bedragen, `numeric` voor aantallen, `type="email"`, `type="tel"`, `autocomplete` voor naam en adres | SHOULD |
| F10 | **Automatisch bewaren** met zichtbare status ("Opgeslagen om 10:42"); niets gaat verloren bij sluiten of netwerkfout | MUST bij lange formulieren |
| F11 | **Bewaren met fouten** moet kunnen (als concept); versturen pas als alles klopt | SHOULD |
| F12 | **Hulp bij het veld:** een korte hint onder het label, niet in een tooltip die je moet zoeken | SHOULD |
| F13 | **Voor versturen:** een samenvatting om na te kijken bij belangrijke formulieren (offerte, bestelling) | SHOULD |

---

## 9. Dashboards en rapporten

Gebaseerd op Stephen Few en de SUCCESS-regels van IBCS.

**Inhoud**
- **D1 Eén publiek, één vraag.** Voor wie is dit dashboard en welke beslissing helpt het? Twee publieken = twee dashboards. (MUST)
- **D2 Titel = boodschap.** "Omzet Q3 3 % onder plan door Nederland", niet "Omzet Q3" (IBCS SAY). (MUST)
- **D3 Hoogstens 7 elementen** per scherm; wat relevant maar niet essentieel is, gaat naar een detailniveau. (SHOULD)
- **D4 Het belangrijkste linksboven en het grootst;** samenhangende elementen naast elkaar. (MUST)
- **D5 Elk getal met context:** doel, vorige periode of trend. Een los getal zegt niets. (MUST)
- **D6 Hoogstens 2 alarmen** tegelijk; uitzonderingen vallen op door markering, de rest blijft rustig. (SHOULD)
- **D7 Bron en datum** bij elk getal of onderaan elk dashboard ("Bron: Zoho Books, stand 6 nov 2026 10:00"). (MUST)

**Notatie (IBCS UNIFY): dezelfde betekenis ziet er overal hetzelfde uit**
- **D8** Actueel = gevuld donker; vorige periode = gevuld grijs; plan of budget = omlijnd; prognose = gearceerd. (SHOULD)
- **D9** Tijd loopt horizontaal van links naar rechts; categorieën (klanten, regio's) verticaal, gesorteerd op waarde. (SHOULD)
- **D10** Afwijkingen: positief en negatief met kleur **en** teken (+/−), met dezelfde schaal in alle grafieken van één rapport. (MUST)

**Grafiekkeuze**

| Vraag | Grafiek |
|---|---|
| Hoe evolueert iets in de tijd? | lijn (veel punten) of kolommen (weinig periodes) |
| Hoe verhouden items zich? | horizontale staven, gesorteerd |
| Waar komt het verschil vandaan? | waterval (brug) |
| Deel van een geheel (2 tot 4 delen) | gestapelde staaf; taart enkel bij 2 of 3 delen |
| Spreiding of verband | spreidingsdiagram |
| Exacte waarden opzoeken | tabel |

- **D11** Nooit 3D, geen afgesneden assen bij staven (start op 0), geen dubbele y-as. (MUST)
- **D12** Labels direct bij de lijn of staaf in plaats van een aparte legende. (SHOULD)
- **D13** Hoogstens 5 tot 6 kleuren per grafiek (K3); meer categorieën = groeperen in "Overige". (SHOULD)

---

## 10. Tabellen

- **TA1** Tekst links, **getallen rechts** uitgelijnd; kopjes volgen de uitlijning van hun kolom; nooit centreren. (MUST)
- **TA2** **Tabelcijfers** (`tabular-nums`) en evenveel decimalen per kolom. (MUST)
- **TA3** Nominale nummers (factuurnummer, postcode, telefoon) links: je rekent er niet mee. (SHOULD)
- **TA4** **Vaste kopregel** bij lange tabellen; vaste eerste kolom bij brede tabellen. (SHOULD)
- **TA5** Rustige rijen: dunne horizontale lijnen of lichte zebra, geen volledig rooster. (SHOULD)
- **TA6** Sorteren op de kolom die het meest gescand wordt (nieuwste eerst, grootste eerst) en zichtbaar maken waarop gesorteerd is. (SHOULD)
- **TA7** Totalen onderaan en vet; eenheid in de kop, niet in elke cel ("Bedrag (€)"). (SHOULD)
- **TA8** Op gsm: tabel scrolt binnen haar kader of wordt een lijst van kaarten. (MUST)

---

## 11. Snelheid, status en feedback

Nielsen: 0,1 s voelt onmiddellijk, 1 s houdt de gedachtegang vast, 10 s is de grens van de aandacht. Doherty: onder 400 ms blijft de gebruiker in zijn ritme.

| Wachttijd | Wat tonen |
|---|---|
| tot 0,1 s | niets extra, enkel het resultaat |
| 0,1 tot 1 s | de knop toont "Bezig…" |
| 1 tot 10 s | een skelet of laadbalk met wat er laadt ("Facturen laden…") |
| meer dan 10 s | voortgang in %, mogelijkheid om verder te werken of te annuleren |

- **S1** Bewaarstatus altijd zichtbaar: bezig, opgeslagen (met uur) of mislukt; bij mislukken blijft de invoer staan en probeert de app het opnieuw. (MUST)
- **S2** Laden stopt na 10 seconden met een foutmelding en een knop "Opnieuw"; nooit een eindeloze draaier. (MUST)
- **S3** Bevestigingen (toasts) 2 tot 4 seconden; fouten blijven staan tot ze opgelost zijn. (SHOULD)
- **S4** Wijziging door iemand anders: een melding, nooit stil overschrijven wat de gebruiker aan het doen is. (MUST bij gedeelde data)
- **S5** Meldingen spaarzaam: wie te veel banners ziet, leest er geen meer. (SHOULD)

---

## 12. Tekst en microcopy

- **M1** Belgisch Nederlands, je-vorm tenzij de klant anders wil; korte zinnen (tot 20 woorden). (SHOULD)
- **M2** Geen streepje als leesteken; geen komma voor "en" of "of". (MUST in BuMa-teksten)
- **M3** Werkwoorden op knoppen, zelfstandige naamwoorden in titels. (SHOULD)
- **M4** Geen jargon of systeemtaal ("record", "null", "error 500"); leg afkortingen één keer uit. (MUST)
- **M5** Foutmeldingen: zonder schuld bij de gebruiker, met de oplossing ("Het netwerk viel weg. We proberen het opnieuw."). (MUST)
- **M6** Consistente woorden: één begrip = één woord in de hele app (niet "klant" en "relatie" door elkaar). (SHOULD)

---

## 13. Toestellen en testmatrix

| Toestel | Breedte | Wat testen |
|---|---|---|
| gsm | 390 px | invullen met één hand, geen zijwaarts scrollen, 16 px invoer |
| iPad staand / liggend | 820 / 1180 px | aanraakdoelen 44 px, tabellen leesbaar |
| pc | 1366 px | toetsenbord, focus, dichtheid van dashboards |
| licht en donker | | elk scherm in beide modi |

---

## 14. Specifiek voor claude.ai-artifacts

- **C1** Data die moet blijven of gedeeld wordt, staat in de database van de artifact, niet in localStorage (die is per browser en kan leeg zijn). (MUST)
- **C2** Geen `alert`, `confirm` of `prompt`: die worden geblokkeerd. Bouw dialogen in de pagina. (MUST)
- **C3** Bestanden aanbieden via de downloads-capability, niet via `<a download>`. (MUST)
- **C4** Werkt zonder netwerk naar andere sites (CSP): fonts en libraries enkel van de toegelaten CDN's. (MUST)
- **C5** Toont een duidelijke melding als de pagina buiten claude.ai of zonder aanmelden geopend wordt. (MUST)
- **C6** Versienummer zichtbaar onderaan, gelijk aan de CHANGELOG. (MUST)
- **C7** Veilige zones op iPhone: `viewport-fit=cover` enkel samen met `env(safe-area-inset-*)`. (SHOULD)
- **C8** Delen: start privé; deel met benoemde personen; nooit publiek bij persoons- of klantgegevens. (MUST)

---

## 15. Checklist bij elke publicatie

**Automatisch (in `check_all.sh`, blokkeert bij MUST)**
- [ ] A1 contrast tekst 4,5:1, licht en donker
- [ ] A4 elk veld een label
- [ ] A5 focusring zichtbaar
- [ ] A7 aanraakdoelen: 24 px (MUST), 44 px op touch (SHOULD)
- [ ] L4 nergens zijwaarts scrollen op 4 toestellen
- [ ] F2 / T-tabel: invoer 16 px, geen tekst onder 12 px
- [ ] O2 hoogstens 1 primaire knop per scherm
- [ ] Geen losse kleurcodes in de code (lint), tokens geladen
- [ ] Geen scriptfouten op eender welk scherm
- [ ] C6 versie zichtbaar en gelijk aan de CHANGELOG

**Met de hand (10 minuten, op iPad en gsm)**
- [ ] O4 5-secondentest per hoofdscherm
- [ ] D2 titels zeggen de boodschap; D5 elk getal heeft context; D7 bron en datum
- [ ] A3 / K4 kleur nooit alleen, geen rood tegenover groen als enige verschil
- [ ] F7 / F8 een fout uitlokken: melding bij het veld, overzicht bovenaan, oplossing in de tekst
- [ ] S1 netwerk uitzetten tijdens bewaren: status, invoer blijft, opnieuw proberen
- [ ] B4 iets verwijderen: bevestiging met naam
- [ ] M1 tot M6 teksten nalezen
- [ ] Donkere modus op screenshots nagekeken

**Bij een nieuwe creatie extra:** heuristische review door 2 tot 3 collega's met sectie 1 als leidraad; elk noteert apart, daarna samenleggen.

---

## 16. Startpunt tokens.css

```css
/* BuMa tokens: vul de merkkleuren in, de rollen blijven. Laden na de andere stijlen. */
:root{
  --brand:#XXXXXX; --brand-text:#XXXXXX;           /* brand-text minstens 4,5:1 op --bg */
  --ink:#1D1B19; --muted:#6E6963; --bg:#F5F4F1; --panel:#FFFFFF; --line:#E4E0DA;
  --ok:#2C7A4B; --warn:#8F5500; --bad:#BF3A2B; --focus:var(--brand-text);
  --cat-1:#0072B2; --cat-2:#E69F00; --cat-3:#009E73; --cat-4:#D55E00; --cat-5:#56B4E9; --cat-6:#CC79A7;
  --tap:44px; --input-font:16px; --text-min:12px; --radius:10px;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:24px; --space-6:32px;
}
@media (prefers-color-scheme: dark){:root{ /* eigen donkere waarden per token */ }}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.num,td.num{text-align:right;font-variant-numeric:tabular-nums}
@media (pointer:coarse){
  button,.btn,select,input:not([type=checkbox]):not([type=radio]),textarea,summary{min-height:var(--tap)}
  input,select,textarea{font-size:var(--input-font)}
}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
```

---

## Bronnen
- [W3C: What's new in WCAG 2.2](https://w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [TetraLogical: What's new in WCAG 2.2 (24 px minimum, 44 px enhanced)](https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2)
- [Nielsen's 10 usability heuristics (samenvatting)](https://www.simonwhatley.co.uk/writing/jakob-nielsen-ten-usability-heuristics/)
- [Nielsen: response time limits (0,1 / 1 / 10 s)](https://www.jmduke.com/posts/response-times.md)
- [Laws of UX: Doherty Threshold (400 ms)](https://lawsofux.com/doherty-threshold/)
- [Stephen Few, dashboard best practices (via Esri)](https://services.twdb.texas.gov/arcgis/help/en/dashboards/10.9.1/reference/author-effective-dashboards.htm)
- [IBCS Standards 1.2: SUCCESS-formule](https://ibcs.com/standards/)
- [GOV.UK Design System: error summary](https://design-system.service.gov.uk/components/error-summary)
- [Formulieren: labels boven het veld, validatie bij verlaten (overzicht van onderzoek)](https://releaselens.pages.dev/blog/form-design-best-practices)
- [Aanraakdoelen: Apple 44 pt, Material 48 dp](https://profiletree.com/?p=56534)
- [Kleurenblind-veilige paletten (NCEAS)](https://nceas.ucsb.edu/sites/default/files/2022-06/Colorblind%20Safe%20Color%20Schemes.pdf)
- [Okabe-Ito-palet](https://kindatechnical.com/data-visualization/how-to-make-data-visualizations-accessible-for-colorblind-users.html)
- [Maersk Design System: tabellen](https://designsystem.maersk.com/components/table/)
- [Adobe Spectrum: tabellen en tabelcijfers](https://spectrum.adobe.com/page/table)
