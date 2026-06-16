import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { company, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sul trattamento dei dati personali di Lifeshot ai sensi del GDPR (Reg. UE 2016/679).",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="giugno 2026">
      <p>
        La presente informativa descrive le modalità di trattamento dei dati
        personali degli utenti che consultano e interagiscono con questo sito,
        ai sensi del Regolamento (UE) 2016/679 (&laquo;GDPR&raquo;) e della
        normativa italiana applicabile.
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Il Titolare del trattamento è <strong>{company.legalName}</strong>, con
        sede legale in {company.address}, P. IVA {company.vat}. Per qualsiasi
        richiesta relativa ai tuoi dati puoi scrivere a{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>.
      </p>

      <h2>2. Dati raccolti tramite il form di contatto</h2>
      <p>
        Quando utilizzi il form della pagina <a href="/contatti">Contatti</a> o
        il modulo &laquo;Invita Lifeshot al tuo evento&raquo;, raccogliamo i
        dati che ci fornisci volontariamente:
      </p>
      <ul>
        <li>
          <strong>Nome</strong> ed eventuali riferimenti che inserisci;
        </li>
        <li>
          <strong>Indirizzo email</strong>;
        </li>
        <li>
          il <strong>contenuto del messaggio</strong> (es. dettagli
          dell&apos;evento, numero di gara, richieste).
        </li>
      </ul>
      <p>
        <strong>Finalità:</strong> rispondere alle tue richieste e gestire la
        comunicazione. <strong>Base giuridica:</strong> esecuzione di misure
        precontrattuali e legittimo interesse a riscontrare i contatti.
      </p>

      <h2>3. Acquisti e pagamenti</h2>
      <p>
        <strong>Sul sito non vengono effettuati pagamenti.</strong> L&apos;eventuale
        acquisto delle foto o dei servizi si concorda direttamente con noi
        tramite messaggio privato (DM su Instagram) o via email. Di conseguenza
        il sito <strong>non raccoglie né tratta dati di pagamento</strong> (carte,
        IBAN o simili).
      </p>

      <h2>4. Dati e immagini archiviati</h2>
      <ul>
        <li>
          <strong>Immagini e file</strong> (foto degli eventi, anteprime
          filigranate, asset del sito) sono archiviati su{" "}
          <strong>Cloudflare R2</strong>.
        </li>
        <li>
          <strong>Dati strutturati</strong> (eventi, metadati delle foto come
          numero di gara, contenuti del sito) sono archiviati su un database{" "}
          <strong>MongoDB</strong>.
        </li>
      </ul>
      <p>
        Questi fornitori, insieme alla piattaforma di hosting e al servizio di
        invio email dei moduli di contatto, agiscono come{" "}
        <strong>responsabili del trattamento</strong>. Alcuni dati possono
        essere trattati su server situati al di fuori dello Spazio Economico
        Europeo, in tal caso con adeguate garanzie (es. clausole contrattuali
        standard della Commissione UE).
      </p>
      <p>
        Le foto che ritraggono persone vengono pubblicate e vendute nel contesto
        di eventi sportivi; per richieste di rimozione di una tua immagine puoi
        contattarci all&apos;indirizzo sopra indicato.
      </p>

      <h2>5. Cookie</h2>
      <p>
        Il sito utilizza cookie tecnici necessari e, previo consenso, cookie
        funzionali e di terze parti. Il dettaglio è nella{" "}
        <a href="/cookie-policy">Cookie Policy</a>.
      </p>

      <h2>6. Conservazione dei dati</h2>
      <p>
        I dati sono conservati per il tempo strettamente necessario alle
        finalità indicate e agli obblighi di legge (es. fiscali e contabili),
        dopodiché vengono cancellati o anonimizzati.
      </p>

      <h2>7. Diritti dell&apos;interessato</h2>
      <p>
        Puoi esercitare in qualsiasi momento i diritti previsti dagli artt.
        15-22 GDPR: accesso, rettifica, cancellazione, limitazione, portabilità
        e opposizione, scrivendo a{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>. Hai inoltre il
        diritto di proporre reclamo all&apos;Autorità Garante per la Protezione
        dei Dati Personali (
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
          garanteprivacy.it
        </a>
        ).
      </p>

      <h2>8. Contatti</h2>
      <p>
        Titolare: {company.legalName} — {company.address} — P. IVA {company.vat}.
        Email: <a href={`mailto:${company.email}`}>{company.email}</a> ·
        Instagram: <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">{site.instagramHandle}</a>.
      </p>
    </LegalShell>
  );
}
