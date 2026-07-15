import type { Metadata } from "next";
import { CategoryPageView } from "@/components/agency/category-page";
import { getPublishedContent, getViewContent } from "@/lib/data/content";
import { getRecentEvents } from "@/lib/data/events";
import { getFeaturedPhotos } from "@/lib/data/photos";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = (await getPublishedContent()).pages.ristorazione;
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

export default async function RistorazionePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const [content, featured, projects] = await Promise.all([
    getViewContent(preview === "1"),
    getFeaturedPhotos(12, "ristorazione"),
    getRecentEvents(12, "ristorazione"),
  ]);
  return (
    <CategoryPageView
      content={content}
      slug="ristorazione"
      featured={featured}
      projects={projects}
    />
  );
}
