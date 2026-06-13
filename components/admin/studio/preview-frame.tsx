"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * PREVIEW FRAME — anteprima a fedeltà 1:1.
 *
 * Renderizza i `children` (la PagePreview React, ancora interattiva grazie
 * a createPortal) DENTRO un <iframe>. Così le media query `sm:`, `lg:`…
 * valutano la larghezza dell'IFRAME (390/768/100%), non quella della
 * finestra del browser: la modalità mobile mostra davvero il layout mobile.
 *
 * Gli stili del sito vengono clonati dall'head del documento padre nell'head
 * dell'iframe (in dev sono <style>, in produzione <link>): un MutationObserver
 * li tiene allineati durante l'hot-reload. L'altezza dell'iframe segue il
 * contenuto via ResizeObserver.
 */
export function PreviewFrame({
  children,
  className,
  title = "Anteprima",
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function setup() {
      const doc = iframe?.contentDocument;
      const win = iframe?.contentWindow;
      if (!doc || !win) return;

      // Reset documento iframe
      doc.documentElement.classList.add("dark");
      const cssFont = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--font-sans");
      if (cssFont) doc.documentElement.style.setProperty("--font-sans", cssFont);

      // Clona gli stili del sito padre nell'head dell'iframe
      const syncStyles = () => {
        const head = doc.head;
        head
          .querySelectorAll("[data-cloned-style]")
          .forEach((n) => n.remove());
        document
          .querySelectorAll('style, link[rel="stylesheet"]')
          .forEach((node) => {
            const clone = node.cloneNode(true) as HTMLElement;
            clone.setAttribute("data-cloned-style", "");
            head.appendChild(clone);
          });
      };
      syncStyles();
      const observer = new MutationObserver(syncStyles);
      observer.observe(document.head, { childList: true, subtree: true });

      // Container montaggio React
      doc.body.className = "font-sans bg-background text-foreground";
      doc.body.style.margin = "0";
      const container = doc.createElement("div");
      doc.body.appendChild(container);
      setMountNode(container);

      // Altezza auto in base al contenuto
      const FrameResizeObserver = (
        win as unknown as { ResizeObserver: typeof ResizeObserver }
      ).ResizeObserver;
      const ro = new FrameResizeObserver(() => {
        setHeight(doc.body.scrollHeight);
      });
      ro.observe(doc.body);

      return () => {
        observer.disconnect();
        ro.disconnect();
      };
    }

    // L'iframe srcDoc/about:blank è già pronto: setup immediato + onload
    const cleanup = setup();
    iframe.addEventListener("load", setup);
    return () => {
      cleanup?.();
      iframe.removeEventListener("load", setup);
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      className={className}
      style={{ width: "100%", height, border: "0", display: "block" }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}
