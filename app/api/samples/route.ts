import { NextResponse } from "next/server";
import { getTemplate } from "@/lib/templates/catalog";
import { roleById } from "@/lib/templates/roles";
import { sampleFor } from "@/lib/templates/samples";

/** Sample content for a template, written for a job title: GET /api/samples?template=clinic&role=paediatrician */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const template = getTemplate(params.get("template") ?? "");
  const role = params.get("role");
  if (!template || template.collection !== "studio") return NextResponse.json({ error: "Unknown template." }, { status: 404 });
  if (role && !roleById(role)) return NextResponse.json({ error: "Unknown job title." }, { status: 404 });
  return NextResponse.json({ content: sampleFor(template, role) }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
