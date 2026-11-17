import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { company, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Licenza e uso delle immagini",
  description:
    "Condizioni d'uso delle foto Lifeshot: puoi usarle e condividerle liberamente, a condizione di citare sempre Lifeshot come autore.",
  robots: { index: true, follow: true },
};

export default function LicenzaImmaginiPage() {
  return (
    <LegalShell title="Licenza e uso delle immagini" updated="novembre 2026">
      <p>
        Tutte le foto pubblicate su questo sito sono realizzate da{" "}
        <strong>Lifeshot</strong> ({company.legalName}) e sono protette dal
        diritto d&apos;autore. Vogliamo però che il nostro lavoro giri: per
        questo ne consentiamo l&apos;uso in modo semplice.
      </p>

      <h2>1. Cosa puoi fare</h2>
      <p>
        Puoi <strong>usare e condividere liberamente</strong> le nostre foto —
        ad esempio pubblicarle sui social, stamparle o inserirle nei tuoi
        contenuti — a una sola condizione: <strong>citare sempre Lifeshot</strong>{" "}
        come autore dello scatto.
      </p>

      <h2>2. Come citarci</h2>
      <p>È sufficiente una di queste modalità:</p>
      <ul>
        <li>
          taggare il profilo{" "}
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {site.instagramHandle}
          </a>{" "}
          nei post e nelle storie sui social;
        </li>
        <li>
          indicare la dicitura <strong>&laquo;Foto © Lifeshot&raquo;</strong> (o
          &laquo;Foto: Lifeshot&raquo;) accanto all&apos;immagine, quando non è
          possibile taggarci.
        </li>
      </ul>

      <h2>3. Cosa ti chiediamo di non fare</h2>
      <ul>
        <li>
          rimuovere o coprire la <strong>filigrana</strong> e il credito presenti
          sulle foto;
        </li>
        <li>
          attribuire a te o ad altri la <strong>paternità</strong> dello scatto;
        </li>
        <li>
          usare le immagini in contesti offensivi, diffamatori o illeciti.
        </li>
      </ul>

      <h2>4. Progetti particolari e usi commerciali</h2>
      <p>
        Per progetti pubblicitari o usi commerciali di rilievo, o anche solo in
        caso di dubbi, ti invitiamo a scriverci: troveremo insieme la soluzione
        migliore. La citazione resta comunque sempre gradita e dovuta.
      </p>

      <h2>5. Contatti</h2>
      <p>
        Per qualsiasi richiesta sull&apos;uso delle immagini puoi scriverci dalla
        pagina <a href="/contatti">Contatti</a> o via email a{" "}
        <a href={`mailto:${company.email}`}>{company.email}</a>.
      </p>
    </LegalShell>
  );
}
