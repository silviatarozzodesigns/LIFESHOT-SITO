import type { Metadata } from "next";
import { CategoryPageView } from "@/components/agency/category-page";
import { getPublishedContent, getViewContent } from "@/lib/data/content";

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
  const content = await getViewContent(preview === "1");
  return <CategoryPageView content={content} slug="business" />;
}
