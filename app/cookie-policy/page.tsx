import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { CookieSettingsButton } from "@/components/legal/cookie-settings-button";
import { company } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Cookie Policy di Lifeshot: cookie tecnici, funzionali e di terze parti utilizzati dal sito.",
  robots: { index: true, follow: true },
};

export default function CookiePolicyPage() {
  return (
    <LegalShell title="Cookie Policy" updated="giugno 2026">
      <p>
        Questo sito utilizza i cookie e tecnologie simili per garantirne il
        funzionamento e, solo previo consenso, per migliorare l&apos;esperienza
        e mostrare contenuti di terze parti. Di seguito le categorie utilizzate.
      </p>

      <h2>1. Cosa sono i cookie</h2>
      <p>
        I cookie sono piccoli file di testo salvati sul tuo dispositivo durante
        la navigazione. Possono essere &laquo;tecnici&raquo; (necessari) oppure
        richiedere il tuo consenso esplicito.
      </p>

      <h2>2. Cookie tecnici / necessari</h2>
      <p>
        Sempre attivi perché indispensabili al funzionamento del sito: ad
        esempio la sessione di amministrazione (area riservata) e la memoria
        della tua scelta sui cookie. Non richiedono consenso.
      </p>
      <ul>
        <li>
          <strong>lifeshot_admin</strong> — sessione dell&apos;area
          amministrativa (solo per gli operatori).
        </li>
        <li>
          <strong>lifeshot-cookie-consent</strong> — memorizza le tue
          preferenze sui cookie (localStorage), così il banner non riappare.
        </li>
      </ul>

      <h2>3. Cookie funzionali</h2>
      <p>
        Migliorano l&apos;esperienza ricordando preferenze d&apos;uso. Vengono
        attivati solo se acconsenti. La loro disattivazione non pregiudica le
        funzioni essenziali.
      </p>

      <h2>4. Cookie e contenuti di terze parti</h2>
      <p>
        Per mostrare alcuni contenuti embeddati (es. i <strong>reel e video di
        Instagram</strong> nella pagina Video) carichiamo widget forniti da
        terze parti, che possono installare propri cookie. Questi contenuti
        restano <strong>bloccati finché non dai il consenso</strong>: al loro
        posto vedi un segnaposto con la possibilità di attivarli.
      </p>
      <ul>
        <li>
          <strong>Instagram / Meta</strong> — embed dei reel (script{" "}
          <em>instagram.com/embed.js</em>).
        </li>
        <li>
          <strong>YouTube / Google</strong> — eventuale riproduzione di video in
          embed.
        </li>
      </ul>
      <p>
        Il trattamento da parte di questi soggetti è regolato dalle rispettive
        informative privacy.
      </p>

      <h2>5. Gestione del consenso</h2>
      <p>
        Alla prima visita un banner ti permette di{" "}
        <strong>accettare tutti</strong>, <strong>rifiutare</strong> o{" "}
        <strong>personalizzare</strong> le categorie. Puoi modificare la tua
        scelta in qualsiasi momento:{" "}
        <CookieSettingsButton className="font-medium text-primary underline-offset-2 hover:underline" />
        .
      </p>

      <h2>6. Titolare</h2>
      <p>
        {company.legalName} — {company.address} — P. IVA {company.vat} ·{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>. Vedi anche la{" "}
        <a href="/privacy-policy">Privacy Policy</a>.
      </p>
    </LegalShell>
  );
}
