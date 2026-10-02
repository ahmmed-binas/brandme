import { notFound } from "next/navigation";
import PortfolioEditor from "@/components/editor/PortfolioEditor";
import EditorialDeveloperEditor from "@/components/editor/EditorialDeveloperEditor";
import StudioEditor from "@/components/editor/studio/StudioEditor";
import { getTemplate } from "@/lib/templates/catalog";
import { isTemplateAvailable } from "@/lib/templates/approval";
import { isModeratorEmail } from "@/lib/community/rules";
import { getCurrentUser } from "@/utils/user-account";
import { ROLES, roleById } from "@/lib/templates/roles";
import { sampleFor } from "@/lib/templates/samples";

export default async function EditorPage({ params, searchParams }: { params: Promise<{ templateId: string }>; searchParams: Promise<{ role?: string }> }) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();
  // Templates waiting for the owner's approval can only be opened by admins.
  const viewer = await getCurrentUser().catch(() => null);
  if (!(await isTemplateAvailable(template, isModeratorEmail(viewer?.email)))) notFound();

  if (template.collection === "studio") {
    // Sample content is written for the chosen job title; suggest the titles this design suits first.
    const role = roleById((await searchParams).role);
    const suits = (profession: string) => Boolean(template.professions?.includes(profession as never));
    const roles = [...ROLES].sort((a, b) => Number(suits(b.profession)) - Number(suits(a.profession)) || a.label.localeCompare(b.label)).map((item) => ({ id: item.id, label: item.label, suggested: suits(item.profession) }));
    return <StudioEditor template={template} sample={sampleFor(template, role?.id)} role={role?.id ?? ""} roles={roles} />;
  }
  return template.editor === "dedicated" ? <EditorialDeveloperEditor template={template} /> : <PortfolioEditor template={template} />;
}
