import { Download, FileText } from "lucide-react";
import { useEditorialData } from "../EditorialDataContext";
import RevealOnScroll from "./RevealOnScroll";

export default function Resume() {
  const portfolioData = useEditorialData();
  const { resume, personal } = portfolioData;
  const hasFile = !resume.fileUrl.startsWith("[ADD");

  return (
    <section className="border-b border-line px-6 py-16 md:px-10">
      <div className="mx-auto max-w-content">
        <RevealOnScroll>
          <div className="flex flex-wrap items-center justify-between gap-6 border border-line p-8">
            <div className="flex items-center gap-4">
              <FileText className="text-accent" size={28} />
              <div>
                <p className="font-display text-xl">{personal.name}'s résumé</p>
                <p className="font-mono text-xs text-muted">
                  {hasFile ? `Last updated ${resume.lastUpdated}` : "[ADD RESUME FILE URL]"}
                </p>
              </div>
            </div>
            {hasFile ? (
              <a
                href={resume.fileUrl}
                download
                data-cursor="interactive"
                className="inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-xs transition-colors hover:border-accent hover:text-accent"
              >
                Download résumé <Download size={14} />
              </a>
            ) : (
              <span className="font-mono text-xs text-muted italic">Not uploaded yet</span>
            )}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
