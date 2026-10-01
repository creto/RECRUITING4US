import { lazy, Suspense, useEffect, useState } from "react";
import { usePath } from "./router";
import { useDocumentMeta } from "./meta";
import { Home } from "./Home";
import { SecurityPage } from "./pages/SecurityPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { ContactPage } from "./pages/ContactPage";
import { NotFound } from "./pages/NotFound";
import { Header } from "@/ui/Header";
import { Dock } from "@/ui/Dock";
import { Cursor } from "@/ui/Cursor";
import { Footer } from "@/ui/Footer";
import { useCopy } from "@/content/i18n";
import { initScroll, scrollToId, ScrollTrigger } from "@/motion/scroll";
import { useTrackSections } from "@/motion/activeSection";
import { watchSystemTheme } from "@/theme/theme";
import { webglSupported } from "@/three/quality";

const Stage = lazy(() => import("@/three/Stage"));

export function App() {
  const path = usePath();
  const t = useCopy();
  const [stage, setStage] = useState(false);

  useEffect(() => initScroll(), []);
  useEffect(() => watchSystemTheme(), []);
  useDocumentMeta(path);
  useTrackSections([path]);

  // The shared WebGL canvas loads right after first paint, never before it.
  useEffect(() => {
    if (!webglSupported()) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => setStage(true), { timeout: 700 });
    else setTimeout(() => setStage(true), 200);
  }, []);

  // Deep links (/#pipeline) land on their section once layout is ready.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const id = setTimeout(() => scrollToId(hash, true), 120);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  let page;
  switch (path) {
    case "/":
      page = <Home />;
      break;
    case "/seguridad":
      page = <SecurityPage />;
      break;
    case "/integraciones":
      page = <IntegrationsPage />;
      break;
    case "/contacto":
      page = <ContactPage />;
      break;
    default:
      page = <NotFound />;
  }

  return (
    <>
      <a className="skip-link" href="#contenido">
        {t.a11y.skip}
      </a>
      <Header />
      <Dock />
      <Cursor />
      <main id="contenido" tabIndex={-1}>
        {page}
      </main>
      <Footer />
      {stage && (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      )}
    </>
  );
}
