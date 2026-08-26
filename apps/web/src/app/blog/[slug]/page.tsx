import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { getBlogPostBySlug } from "@/lib/public-api";
import { absoluteUrl, truncateText } from "@/lib/site";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

async function loadPost(slug: string) {
  try {
    return await getBlogPostBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (!post) {
    return { title: "Post Not Found", robots: { index: false, follow: false } };
  }

  const description = post.metaDescription || truncateText(post.excerpt || post.title, 160);

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      url: absoluteUrl(`/blog/${post.slug}`),
      type: "article",
      publishedTime: post.createdAt,
      images: post.coverImage ? [{ url: post.coverImage, alt: post.title }] : undefined,
    },
    twitter: {
      title: post.title,
      description,
      card: "summary_large_image",
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (!post) {
    notFound();
  }

  const pageUrl = absoluteUrl(`/blog/${post.slug}`);
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    url: pageUrl,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: post.authorName },
    publisher: { "@type": "Organization", name: "Onyx Propcare" },
    image: post.coverImage || undefined,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-onyx-950">
      <JsonLd data={[schema, breadcrumbSchema]} />
      <article className="px-6 pb-20 pt-28">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-cream/60">
            <Link href="/" className="hover:text-gold">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:text-gold">
              Blog
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate text-cream/85">{post.title}</span>
          </nav>

          <p className="mb-3 text-xs text-cream/60">
            {formatDate(post.createdAt)} · {post.authorName}
          </p>
          <h1 className="heading-lg mb-6 text-cream">{post.title}</h1>

          {post.coverImage && (
            <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-cream/8">
              <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
            </div>
          )}

          <div
            className="prose-onyx max-w-none font-body text-cream/90"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-cream/8 pt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-cream/10 px-3 py-1 text-xs text-cream/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
