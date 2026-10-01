import { createFileRoute } from "@tanstack/react-router";
import { BrandBar, MarketingHomeLink } from "@/components/talent/kit";
import { useLocale } from "@/lib/i18n/provider";

export const Route = createFileRoute("/notice")({ component: NoticePage });

const COPY = {
  en: {
    kicker: "Public notice",
    title: "Privacy, terms, and candidate notice",
    lede: "These notes describe this product. They are not a law-firm opinion, and they are not inside an employer workspace.",
    back: "Back to the main page",
    sections: [
      {
        id: "privacy",
        title: "Privacy",
        paragraphs: [
          "RECRUIT4US keeps each employer’s candidates, applications, scores, notes, and files in that employer’s own company. A person at one company does not see another company’s records.",
          "An application can include the name and email you type, the answers you submit, and a résumé file. A timed assessment stores the answers you send and the time used. A proctored exam can ask for the camera in that browser. Written and code answers stay available for a person to review.",
          "Messages composed in the product are stored with that company. A message is not treated as delivered to an outside inbox unless a mail provider is actually connected and accepts it.",
          "The language choice is saved in this browser only. It is not an application answer and it is not a score.",
          "The demo company is fictional. Do not put a real résumé, a real government identifier, or another person’s private information into a demo.",
        ],
      },
      {
        id: "terms",
        title: "Terms",
        paragraphs: [
          "The workspace is for hiring work: jobs, applications, assessments, interviews, and offers. A score is evidence for a person to read. It is not an automatic hire or an automatic rejection.",
          "Demo assessments are original practice material. They are not a validated hiring test and they are not copied from another publisher’s item bank.",
          "You may use the product only for a company you belong to, or for a public careers page that company has published. Changing an identifier in the address bar does not grant access to another company’s records.",
          "If a connected service is unavailable, the product keeps the submitted work and shows the failure. It does not invent a passing score to move a candidate forward.",
        ],
      },
      {
        id: "notice",
        title: "Candidate notice",
        paragraphs: [
          "When you apply, the employer that posted the job receives your application. Other candidates do not. Internal notes written by that employer stay on their side of the product.",
          "An assessment has a time limit. You cannot skip a question that has no answer. Leaving the page does not add time back. After you submit, the receipt is the saved snapshot. A score appears to you only if that employer releases it.",
          "A personality questionnaire, when one is used, summarizes the answers on that form. It is not a clinical result and it is not allowed to be the cutoff that ends a candidacy.",
          "If the exam says the camera is on, the session is proctored in the browser. If it does not, no camera is required for that paper.",
          "You can read this notice before you apply. The employer’s own careers page is separate from this main page.",
        ],
      },
    ],
  },
  es: {
    kicker: "Aviso público",
    title: "Privacidad, términos y aviso para candidatos",
    lede: "Estas notas describen este producto. No son un dictamen de un bufete y no están dentro del espacio de un empleador.",
    back: "Volver a la página principal",
    sections: [
      {
        id: "privacy",
        title: "Privacidad",
        paragraphs: [
          "RECRUIT4US guarda los candidatos, las solicitudes, las puntuaciones, las notas y los archivos de cada empleador en la empresa de ese empleador. Una persona de una empresa no ve los registros de otra.",
          "Una solicitud puede incluir el nombre y el correo que escribes, las respuestas que envías y un archivo de currículum. Una evaluación con tiempo guarda las respuestas que mandas y el tiempo usado. Un examen vigilado puede pedir la cámara en ese navegador. Las respuestas escritas y de código quedan disponibles para que una persona las revise.",
          "Los mensajes redactados en el producto se guardan con esa empresa. Un mensaje no se trata como entregado a un buzón externo salvo que un proveedor de correo esté conectado de verdad y lo acepte.",
          "La elección de idioma se guarda solo en este navegador. No es una respuesta de la solicitud ni una puntuación.",
          "La empresa de demostración es ficticia. No pongas un currículum real, un identificador oficial real ni información privada de otra persona en una demostración.",
        ],
      },
      {
        id: "terms",
        title: "Términos",
        paragraphs: [
          "El espacio de trabajo es para el proceso de contratación: puestos, solicitudes, evaluaciones, entrevistas y ofertas. Una puntuación es evidencia para que una persona la lea. No es una contratación automática ni un rechazo automático.",
          "Las evaluaciones de demostración son material de práctica original. No son una prueba de contratación validada y no se copiaron del banco de otro editor.",
          "Puedes usar el producto solo para una empresa a la que perteneces, o para una página pública de empleos que esa empresa haya publicado. Cambiar un identificador en la barra de dirección no da acceso a los registros de otra empresa.",
          "Si un servicio conectado no está disponible, el producto conserva el trabajo enviado y muestra el fallo. No inventa una puntuación de aprobado para adelantar a un candidato.",
        ],
      },
      {
        id: "notice",
        title: "Aviso para candidatos",
        paragraphs: [
          "Cuando postulas, el empleador que publicó el puesto recibe tu solicitud. Las demás personas candidatas no. Las notas internas de ese empleador se quedan de su lado del producto.",
          "Una evaluación tiene un límite de tiempo. No puedes saltar una pregunta sin respuesta. Salir de la página no devuelve el tiempo. Después de enviar, el recibo es la copia guardada. La puntuación te aparece solo si ese empleador la publica.",
          "Un cuestionario de personalidad, cuando se usa, resume las respuestas de ese formulario. No es un resultado clínico y no puede ser el corte que termina una candidatura.",
          "Si el examen dice que la cámara está activa, la sesión está vigilada en el navegador. Si no lo dice, esa prueba no pide cámara.",
          "Puedes leer este aviso antes de postular. La página de empleos del empleador es distinta de esta página principal.",
        ],
      },
    ],
  },
} as const;

function NoticePage() {
  const { locale } = useLocale();
  const text = COPY[locale];
  return (
    <main data-keep-lang="" className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <header className="flex items-center justify-between gap-4">
        <MarketingHomeLink className="text-ink" />
        <MarketingHomeLink className="text-sm text-link">{text.back}</MarketingHomeLink>
      </header>
      <div className="mt-6">
        <BrandBar />
      </div>
      <p className="mt-10 text-sm font-medium text-link">{text.kicker}</p>
      <h1 className="mt-3 text-4xl leading-tight text-ink">{text.title}</h1>
      <p className="mt-4 text-base text-muted">{text.lede}</p>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label={text.title}>
        {text.sections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-sm text-ink">
            {section.title}
          </a>
        ))}
      </nav>
      <div className="mt-8 space-y-4">
        {text.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-6 rounded-[24px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(20,34,27,0.04)]">
            <h2 className="text-2xl text-ink">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
