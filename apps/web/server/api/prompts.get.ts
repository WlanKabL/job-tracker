import { APPLICATION_SOURCE, COMPANY_SIZE, WORK_MODE } from "@job-tracker/shared";

const importSchemaExample = `{
  "company": {
    "name": "Acme GmbH",
    "website": "https://acme.de",
    "industry": "Software",
    "size": "51-200",
    "location": "Berlin, Deutschland"
  },
  "position": "Senior Full Stack Developer",
  "source": "linkedin",
  "sourceUrl": "https://www.linkedin.com/jobs/view/…",
  "location": "Berlin / Remote",
  "workMode": "hybrid",
  "salaryMin": 65000,
  "salaryMax": 85000,
  "salaryCurrency": "EUR",
  "salaryPeriod": "yearly",
  "techStack": ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS"],
  "requirements": [
    "5+ Jahre TypeScript",
    "Erfahrung mit React",
    "AWS Grundkenntnisse"
  ],
  "niceToHaves": ["Docker Erfahrung", "GraphQL"],
  "benefits": ["30 Tage Urlaub", "Workation möglich", "Mental-Health-Programm"],
  "description": "Originaler Anzeigetext (so kompakt wie möglich zusammengefasst, max ~800 Wörter)",
  "rating": 4,
  "contacts": [
    { "name": "Jane Doe", "role": "Recruiter", "email": "jane@acme.de" }
  ],
  "companyResearch": {
    "summary": "Kurzes Firmenprofil aus deiner Recherche",
    "fundingStatus": "Funding-Status / Profitabilität (oder weglassen wenn unbekannt)",
    "companySizeAssessment": "Falls die Anzeige die Größe nicht sagt: Begründung deiner Schätzung",
    "techStackHints": ["Public Tech-Hinweise aus StackShare/GitHub/Karriereseite"],
    "reviewSignals": ["1-3 Bullet-Points zu Glassdoor/Kununu, mit Score + Top-Pro/Top-Contra"],
    "newsSignals": ["aktuelle Layoffs/Funding/Pivots (max 12 Monate)"],
    "sources": ["URL bzw. Quellenname pro Punkt"]
  },
  "salaryResearch": {
    "estimatedRange": "60000-85000 EUR yearly",
    "advertisedRange": "70000-90000 EUR yearly plus Bonus (nur wenn Anzeige nennt)",
    "marketComparison": [
      "Glassdoor.de: …",
      "Levels.fyi: …",
      "Stepstone: …"
    ],
    "sources": ["Quellname + Jahr"],
    "note": "Optionale Ein-Satz-Einordnung"
  },
  "fitNotes": [
    "1-Satz-Bullets warum diese Rolle für mich passt oder nicht (basierend auf Memory)"
  ],
  "openQuestions": [
    "Konkrete Fragen die ich im Erstgespräch unbedingt klären sollte"
  ]
}`;

const enumLine = (label: string, values: readonly string[]) =>
    `${label}: ${values.map((v) => `"${v}"`).join(" | ")}`;

const memoryReminder = `WICHTIG — Vorwissen einbeziehen:
- Du kennst mich aus früheren Konversationen (gespeicherter Kontext / Memory). Nutze das Wissen über meinen Werdegang, meine Stack-Schwerpunkte, meine bisherigen Projekte und mein Senioritätslevel.
- Wenn du dir bei etwas unsicher bist, schreibe stattdessen [Klären: <Frage>].
- Wenn dir Memory-Inhalte über mich fehlen, gehe von einem deutschen Senior Full-Stack Developer mit TypeScript/Vue/Nuxt-Schwerpunkt aus, aber markiere diese Annahmen klar.`;

const webResearchReminder = `WEB-RECHERCHE (falls verfügbar):
- Recherchiere die Firma aktiv: Größe, Funding-Status, Tech-Stack-Hinweise (StackShare, GitHub-Org, Karriere-Seite), Glassdoor/Kununu Reviews, aktuelle News (Layoffs, Pivots, Funding).
- Recherchiere Gehaltsranges für die Rolle: Levels.fyi, Glassdoor.de, Stepstone Gehaltsreport, Gehalt.de. Quelle pro Range in Klammern angeben.
- Wenn keine Web-Recherche möglich ist: explizit sagen "(ohne Web-Recherche — basiert nur auf Marktwissen Stand 2025)".`;

const FENCE = "``````";

const extractPrompt = `Du bist ein präziser Daten-Extraktor für Stellenanzeigen.

${memoryReminder}

${webResearchReminder}

Wandle die unten eingefügte Stellenanzeige in ein JSON nach folgendem Schema um.

Hartes Format (strikt einhalten — der Importer validiert das, abweichende Top-Level-Felder werden abgewiesen):
- Antworte AUSSCHLIESSLICH mit EINEM JSON-Objekt, eingewickelt in genau einen Markdown-Code-Block mit SECHS Backticks am Anfang und Ende. Format der Antwort:
  ${FENCE}json
  { ... }
  ${FENCE}
- Kein erklärender Text vor oder nach dem Code-Block. Keine Kommentare im JSON.
- KEINE Top-Level-Felder erfinden außer denen aus dem Schema unten. Wenn du etwas berichten willst was nicht reinpasst, ablegen in companyResearch / salaryResearch / fitNotes / openQuestions.
- Wenn ein Feld in der Anzeige nicht steht: weglassen statt raten. Schreibe NIEMALS "Unknown" oder \`null\` oder ähnliche Platzhalter-Strings.
- URLs als nackte Strings ("https://x.de"), niemals als Markdown ("[x](https://x.de)").
- Emails als nackte Strings ("a@b.de"), niemals als Mailto-Markdown ("[a@b.de](mailto:a@b.de)").
- ${enumLine("Mögliche Werte für source", APPLICATION_SOURCE)}
- ${enumLine("Mögliche Werte für workMode", WORK_MODE)}
- ${enumLine("Mögliche Werte für company.size", COMPANY_SIZE)}
- salaryMin/salaryMax als Integer in der Hauptwährung (ohne Komma, ohne Tausenderpunkt).
- salaryPeriod aus { "yearly", "monthly", "hourly", "daily" }.

Felder, bei denen du aktiv schätzen darfst:
- "rating" (1–5): Wie gut passt die Rolle ZU MIR basierend auf Memory? 1 = würde ich absagen, 5 = Top-Match. Wenn du keinerlei Vorwissen über mich hast → Feld weglassen.
- "company.size": Wenn die Anzeige es nicht sagt, aber dein Recherche-Wissen klare Hinweise liefert → schätzen erlaubt.
- "salaryMin"/"salaryMax": Wenn die Anzeige nichts nennt aber dein salaryResearch eine Range liefert, darfst du sie nach oben in die Hauptfelder spiegeln.

Zielschema (alle Felder optional außer company.name und position; nichts anderes als unten erlaubt):
${FENCE}json
${importSchemaExample}
${FENCE}

Hier kommt die Anzeige:
---
[ANZEIGE EINFÜGEN]
---`;

const cheatsheetPrompt = `Du erstellst für mich ein Cheatsheet zur Vorbereitung auf eine Bewerbung / ein Interview.

${memoryReminder}

${webResearchReminder}

Stellenausschreibung:
---
[ANZEIGE EINFÜGEN]
---

Aufgabe — antworte in sauberem Markdown mit den folgenden Sektionen in genau dieser Reihenfolge:

## Kurz-Brief
- Was sucht die Firma WIRKLICH (nicht Buzzwords, sondern Kern-Pain)?
- Was ist das Top-Outcome, das ich in den ersten 6 Monaten liefern würde?

## Match-Score: X / 100
- Eine ehrliche Zahl basierend auf meinem Profil vs. den Anforderungen.
- 3–5 Bullets mit Begründung (Stack, Senioritätslevel, Domain, Standort, Gehalt).
- Spalte "Stärke" / "Lücke" für jeden Punkt.

## Erfolgswahrscheinlichkeit
- Geschätzte P(Einladung Interview): X %
- Geschätzte P(Angebot wenn Interview): Y %
- Geschätzte P(Angebot insgesamt): X% × Y%
- Begründung: was sind die 2–3 Faktoren, die das am stärksten beeinflussen?

## Firma — Kurz-Profil
Aus Web-Recherche (wenn möglich):
- Gründungsjahr, Größe, Funding-Status / Profitabilität
- Tech-Stack (aus StackShare/GitHub/Karriere-Seite)
- Kultur-Signale (Glassdoor/Kununu — Top-Pro, Top-Contra)
- Aktuelle News (max 12 Monate alt)

## Top-3-Anker für mich
Drei Punkte aus meinem Profil, die ich im Anschreiben + Gespräch hervorheben sollte. Konkret, mit STAR-Beispielen wo möglich.

## Risiken / Lücken
Wo passe ich (noch) nicht 1:1 — und wie kann ich es einordnen / kompensieren.

## Interview-Fragen, die kommen werden
5 Stück, sortiert nach Wahrscheinlichkeit. Jeweils mit Antwort-Rohling im STAR-Format (Situation, Task, Action, Result).

## Eigene Fragen am Ende
3 Fragen, die ich stellen sollte (Team-Größe, Onboarding, Erwartungen erste 90 Tage, Tech-Schulden, Karrierepfad). Mit kurzem Why pro Frage.

## Gehalts-Anker
- Marktrange für Rolle + Standort + Senioritätslevel (Quellen nennen).
- Meine realistische Forderung: X – Y EUR (basierend auf Memory über meine bisherigen Gehälter).
- Verhandlungs-Reservezone (wo würde ich runter gehen wenn nötig).

Sei konkret. Vermeide Floskeln. Bei Unklarheit: [Klären: <was>].`;

const coverLetterPrompt = `Schreibe ein knackiges deutsches Anschreiben für die folgende Stelle.

${memoryReminder}

Stellenausschreibung:
---
[ANZEIGE EINFÜGEN]
---

Format-Vorgaben:
- Maximal 250 Wörter, Brief-Stil (kein "Sehr geehrte Damen und Herren" ohne Recherche — wenn aus der Anzeige ein Recruiter-Name hervorgeht, ihn verwenden, sonst "Hallo zusammen,").
- Direkter Einstieg — kein "Hiermit bewerbe ich mich…", kein "Mit großem Interesse…".
- Erster Absatz: konkrete These warum ich gerade DIESE Firma jetzt spannend finde (basierend auf Recherche / Anzeige, nicht generisch).
- Zweiter Absatz: ein Beispiel aus meinem Profil mit messbarem Resultat, das auf die Top-3-Anforderungen einzahlt.
- Dritter Absatz: was ich konkret in den ersten 90 Tagen einbringen würde.
- Letzter Satz: Gesprächsangebot mit Verfügbarkeit.

Tonfall: professionell, aber menschlich. Aktive Sätze. Keine Korporat-Sprache. Keine Adjektiv-Sammlungen ("dynamisch, kommunikativ, teamfähig" → verboten).

Liefere nur den fertigen Brief-Text. Falls Vorwissen fehlt: Platzhalter in [eckigen Klammern].`;

const followUpPrompt = `Formuliere eine freundliche, kurze Follow-Up-Mail auf eine Bewerbung, auf die ich seit X Tagen nichts gehört habe.

${memoryReminder}

Kontext:
- Position: [POSITION]
- Firma: [FIRMA]
- Beworben am: [DATUM]
- Tage ohne Antwort: [N]
- Recruiter-Kontakt (falls bekannt): [NAME/EMAIL]

Anforderungen:
- Maximal 90 Wörter.
- Höflich, nicht passiv-aggressiv, nicht bettelnd.
- Wiederhole knapp, warum ich passe (1 Satz, basierend auf Memory über mein Profil).
- Frage konkret nach dem Stand des Prozesses + erwartetem Zeitplan.
- Biete kurze Erreichbarkeit (Telefonat / Call) an.
- Schlusssatz: positiv, nicht resigniert.

Liefere nur den E-Mail-Text mit Betreffzeile.`;

const salaryPrompt = `Hilf mir bei der Gehaltsverhandlung für ein konkretes Angebot.

${memoryReminder}

${webResearchReminder}

Kontext:
- Position: [POSITION]
- Firma: [FIRMA], Größe: [SIZE], Standort: [ORT], Branche: [BRANCHE]
- Aktuelles Angebot: [BETRAG] [WÄHRUNG] [JÄHRLICH/MONATLICH]
- Mein Wunschgehalt: [BETRAG]
- Variable Bestandteile im Angebot: [Bonus / Equity / Sonstiges]
- Mein letztes Gehalt: [aus Memory falls bekannt, sonst Platzhalter]

Antworte in klarem Markdown:

## Realismus-Check
- Wo liegt das Angebot im Markt-Korridor für diese Rolle/Größe/Stadt? (Quellen: Levels.fyi, Glassdoor.de, Stepstone, Kununu Gehaltsreport — pro Range Quelle nennen).
- Wo liegt mein Wunsch im Korridor?
- Verhandlungsspielraum geschätzt: X – Y EUR über aktuellem Angebot.

## 3 Argumente die wirklich ziehen
Faktenbasiert, keine Floskeln. Pro Argument: was ist die Evidenz, wie verkaufe ich es.

## Verhandlungs-Strategie
- Eröffnungs-Forderung: konkrete Zahl + Erläuterung warum.
- Erwartete Gegenreaktion und meine Antwort darauf.
- Fallback-Optionen: wenn die Firma "Budget ausgeschöpft" sagt → welche nicht-monetären Komponenten verhandle ich (Boni-Trigger, mehr Urlaub, Equity, Remote-Tage, Weiterbildungsbudget, Sign-on)?

## Walk-away-Linie
- Unter welchem Wert sage ich ab? Warum?

## Wording-Vorlagen
3–4 Sätze die ich tatsächlich sagen kann — freundlich, ruhig, faktisch. Eine Variante für E-Mail, eine für Telefonat.

## Red Flags
Aspekte am aktuellen Angebot, die hinterfragt werden sollten (Klauseln, Probezeit-Sonderregeln, On-Call-Verpflichtungen, etc.).`;

const successProbabilityPrompt = `Schätze die Erfolgswahrscheinlichkeit für diese konkrete Bewerbung.

${memoryReminder}

${webResearchReminder}

Stellenausschreibung:
---
[ANZEIGE EINFÜGEN]
---

Liefere in Markdown:

## TL;DR
- P(Einladung Phone-Screen): X %
- P(Interview-Loop wenn Phone): Y %
- P(Angebot wenn Interview-Loop): Z %
- P(Angebot insgesamt): X % × Y % × Z %
- Ehrlichkeits-Hinweis: Die Schätzung ist eine Mischung aus harten Faktoren (Anforderungs-Match) und weichen (Markt-Sättigung, Pool-Größe). Genauigkeit ± 15 %.

## Annahmen
Die 3–5 wichtigsten Annahmen, die meine Schätzung tragen (z.B. "Anzeige läuft seit > 4 Wochen → Pool kleiner als gedacht", "Firma hatte vor 2 Monaten Layoffs → Hiring Freeze möglich").

## Was den Score nach oben treibt
Konkret pro Faktor: warum + um wie viel.

## Was den Score nach unten zieht
Konkret pro Faktor.

## Hebel die ICH noch ziehen kann
3 Maßnahmen, die meine Erfolgs-Wahrscheinlichkeit messbar erhöhen würden, bevor ich abschicke:
- z.B. Recruiter direkt anschreiben statt nur über System bewerben
- z.B. Eine spezifische Repo / Side-Project, das ich in der Bewerbung verlinken sollte
- z.B. Anschreiben anpassen auf konkretes Detail aus aktueller Firma-News

## Empfehlung
- "Voll reinhauen" / "Bewerben aber niedrige Priorität" / "Skippen, Zeit besser woanders investieren" — mit ein-Satz-Begründung.`;

export default defineEventHandler(() => ({
    prompts: {
        extract: { id: "extract", template: extractPrompt },
        cheatsheet: { id: "cheatsheet", template: cheatsheetPrompt },
        coverLetter: { id: "coverLetter", template: coverLetterPrompt },
        followUp: { id: "followUp", template: followUpPrompt },
        salary: { id: "salary", template: salaryPrompt },
        successProbability: { id: "successProbability", template: successProbabilityPrompt },
    },
    schemaExample: importSchemaExample,
}));
