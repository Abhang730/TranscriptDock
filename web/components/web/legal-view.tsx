import { OPERATOR, OPERATOR_EMAIL, LEGAL_EFFECTIVE } from "@/lib/legal/shared";
import type { LegalDoc } from "@/lib/legal/shared";

export function LegalView({ doc }: { doc: LegalDoc }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="border-2 border-[#0b0b0b] bg-[#0b0b0b] px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-[#efece2]">
            Legal
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0b0b0b] sm:text-3xl">
            {doc.title}
          </h1>
        </div>
        <p className="max-w-2xl text-base leading-relaxed text-[#3a3a3a]">
          {doc.intro}
        </p>
        <address className="not-italic text-xs leading-relaxed text-[#6b6b6b]">
          Operator: {OPERATOR}. Effective {LEGAL_EFFECTIVE}. Questions:{" "}
          {OPERATOR_EMAIL}. These details are placeholders and must be replaced
          with verified operator information before a commercial launch.
        </address>
      </header>

      <div className="mt-10 flex flex-col gap-8">
        {doc.sections.map((section, index) => (
          <section key={section.heading} className="flex flex-col gap-2">
            {index > 0 ? (
              <hr className="mb-4 border-2 border-[#0b0b0b]" />
            ) : null}
            <h2 className="text-lg font-extrabold leading-snug text-[#0b0b0b]">
              {section.heading}
            </h2>
            <p className="leading-relaxed text-[#3a3a3a]">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
