import { notFound } from "next/navigation";
import PortfolioEditor from "@/components/editor/PortfolioEditor";
import EditorialDeveloperEditor from "@/components/editor/EditorialDeveloperEditor";
import StudioEditor from "@/components/editor/studio/StudioEditor";
import { getTemplate } from "@/lib/templates/catalog";
import { isTemplateAvailable } from "@/lib/templates/approval";
import { isModeratorEmail } from "@/lib/community/rules";
import { getCurrentUser } from "@/utils/user-account";

export default async function EditorPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();
  // Templates waiting for the owner's approval can only be opened by admins.
  const viewer = await getCurrentUser().catch(() => null);
  if (!(await isTemplateAvailable(template, isModeratorEmail(viewer?.email)))) notFound();

  if (template.collection === "studio") return <StudioEditor template={template} />;
  return template.editor === "dedicated" ? <EditorialDeveloperEditor template={template} /> : <PortfolioEditor template={template} />;
}
