import type { Metadata } from "next";
import { CategoryPageView } from "@/components/agency/category-page";
import { getPublishedContent, getViewContent } from "@/lib/data/content";
import { getRecentEvents } from "@/lib/data/events";
import { getFeaturedPhotos } from "@/lib/data/photos";
import { getPublishedVideos } from "@/lib/data/videos";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = (await getPublishedContent()).pages.business;
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

export default async function BusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const [content, featured, projects, videos] = await Promise.all([
    getViewContent(preview === "1"),
    getFeaturedPhotos(12, "business"),
    getRecentEvents(0, "business"),
    getPublishedVideos("business", 4),
  ]);
  return (
    <CategoryPageView
      content={content}
      slug="business"
      featured={featured}
      projects={projects}
      videos={videos}
    />
  );
}
