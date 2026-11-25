import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Catalog } from "@/components/catalog/Catalog";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCatalog, getCategories, getCategory, getLiveCategories } from "@/lib/content";

export function generateStaticParams() {
  return getCategories().map((c) => ({ id: c.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getCategory(id);
  if (!c) return {};
  return { title: c.name, description: `${c.summary} ${c.whyItMatters}`, alternates: { canonical: `/categories/${c.id}` } };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) notFound();
  if (category.status === "upcoming") redirect(`/upcoming#${category.id}`);

  const items = getCatalog();
  const categories = getLiveCategories().map(({ id, sector, name, singular, filters }) => ({ id, sector, name, singular, filters }));

  return (
    <>
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/parts" className="hover:text-fg">
                  Parts
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg-muted">
                {category.name}
              </li>
            </ol>
          </nav>
        }
        title={category.name}
        lead={
          <>
            {category.summary} <span className="text-fg-subtle">{category.whyItMatters}</span>
          </>
        }
      />
      <Container className="pb-24">
          <Catalog items={items} categories={categories} fixedCategory={category.id} />
      </Container>
    </>
  );
}
