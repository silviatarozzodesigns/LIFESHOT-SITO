import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/agency/project-view";
import { getProjectBySlug } from "@/lib/data/events";
import { getEventPhotos } from "@/lib/data/photos";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug("ristorazione", slug);
  if (!project) return {};
  return {
    title: { absolute: `${project.name} · Ristorazione · Lifeshot` },
    description:
      project.description.slice(0, 160) ||
      `${project.name}: un progetto Lifeshot per la ristorazione.`,
  };
}

/** Pagina progetto ristorazione: titolo → galleria scorrevole → descrizione */
export default async function ProgettoRistorazionePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug("ristorazione", slug);
  if (!project) notFound();
  const photos = await getEventPhotos(project.id);
  return <ProjectView project={project} photos={photos} category="ristorazione" />;
}
