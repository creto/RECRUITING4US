import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translateText, type Locale } from "./translate.ts";

const KEY = "recruit4us-locale";

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: "en",
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "es" || saved === "en") setLocaleState(saved);
  }, []);

  function setLocale(next: Locale) {
    window.localStorage.setItem(KEY, next);
    setLocaleState(next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
      <div data-keep-lang="" className="fixed bottom-4 left-4 z-40">
        <LanguageSwitch />
      </div>
      <LocaleApply locale={locale} />
    </LocaleContext.Provider>
  );
}

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <div
      data-keep-lang=""
      className="inline-flex overflow-hidden rounded-full border border-[#d7e1da] bg-white text-sm shadow-[0_8px_24px_rgba(20,34,27,0.08)]"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        className={`min-h-10 px-3 ${locale === "en" ? "bg-[#cefa90] text-[#14221b]" : "text-[#14221b]"}`}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        English
      </button>
      <button
        type="button"
        className={`min-h-10 px-3 ${locale === "es" ? "bg-[#cefa90] text-[#14221b]" : "text-[#14221b]"}`}
        aria-pressed={locale === "es"}
        onClick={() => setLocale("es")}
      >
        Español
      </button>
    </div>
  );
}

const SKIP = "input, textarea, script, style, [data-keep-lang], .font-mono";
const originals = new WeakMap<Text, string>();
const attributes = ["placeholder", "aria-label", "title"] as const;

function LocaleApply({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    let frame = 0;

    function remember(node: Text) {
      if (!originals.has(node)) originals.set(node, node.data);
      return originals.get(node) ?? node.data;
    }

    function skip(node: Node | null) {
      const parent = node?.parentElement;
      if (!parent) return true;
      return Boolean(parent.closest(SKIP));
    }

    function applyText(node: Text) {
      if (skip(node)) return;
      const source = remember(node);
      const next = translateText(source, locale);
      if (node.data !== next) node.data = next;
    }

    function applyElement(element: Element) {
      if (element.closest("[data-keep-lang]")) return;
      for (const name of attributes) {
        const value = element.getAttribute(name);
        if (!value) continue;
        const memory = element.getAttribute(`data-i18n-${name}`);
        const source = memory ?? value;
        if (!memory) element.setAttribute(`data-i18n-${name}`, source);
        const next = translateText(source, locale);
        if (element.getAttribute(name) !== next) element.setAttribute(name, next);
      }
    }

    function walk(root: ParentNode) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        applyText(current as Text);
        current = walker.nextNode();
      }
      if (root instanceof Element || root instanceof Document) {
        root.querySelectorAll("*").forEach(applyElement);
      }
    }

    function run() {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      walk(document.body);
    }

    run();
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [locale]);

  return null;
}
