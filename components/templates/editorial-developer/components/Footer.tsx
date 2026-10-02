import { useEditorialData } from "../EditorialDataContext";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

export default function Footer() {
  const portfolioData = useEditorialData();
  const { personal } = portfolioData;
  const year = new Date().getFullYear();

  return (
    <footer className="px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-content flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg">{personal.name}</p>
          <p className="font-mono text-xs text-muted">{personal.location}</p>
        </div>
        <ul className="flex flex-wrap gap-6">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="font-mono text-xs text-muted underline-hover">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="font-mono text-xs text-muted">
          © {year} {personal.name}. Designed &amp; engineered by {personal.name}.
        </p>
      </div>
    </footer>
  );
}
