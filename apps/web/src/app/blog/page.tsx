import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { getBlogPosts } from "@/lib/public-api";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

const TITLE = "Onyx Propcare Blog";
const DESCRIPTION =
  "Guides on buying verified land in India -- soil reports, water analysis, title checks, drone surveys, and what to know before you invest.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/blog"), type: "website" },
  twitter: { title: TITLE, description: DESCRIPTION, card: "summary_large_image" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const response = await getBlogPosts({ page, limit: 12 }).catch(() => null);
  const posts = response?.data || [];
  const pageUrl = absoluteUrl("/blog");

  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: TITLE,
    url: pageUrl,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.createdAt,
      author: { "@type": "Organization", name: post.authorName },
    })),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Blog", item: pageUrl },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-onyx-950">
      <JsonLd data={schema} />
      <section className="relative px-6 pb-8 pt-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gold/[0.02] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-cream/60">
            <Link href="/" className="hover:text-gold">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-cream/85">Blog</span>
          </nav>
          <h1 className="heading-lg mb-2 text-cream">
            Land Buying <span className="text-gradient-gold">Guides</span>
          </h1>
          <p className="mb-8 max-w-3xl text-lg font-body text-cream/86">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-cream/8 bg-onyx-900/50 transition-colors hover:border-gold/30"
                >
                  <div className="relative aspect-[16/9] w-full bg-onyx-800/50">
                    {post.coverImage ? (
                      <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-cream/30">
                        Onyx Propcare
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-2 text-xs text-cream/60">{formatDate(post.createdAt)}</p>
                    <h2 className="mb-2 font-display text-lg text-cream group-hover:text-gold">{post.title}</h2>
                    {post.excerpt && <p className="line-clamp-3 text-sm text-cream/80">{post.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>

            {response && response.pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={`/blog?page=${page - 1}`}
                    className="rounded-xl border border-cream/10 px-4 py-2 text-sm text-cream/80 hover:border-gold/30 hover:text-gold"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-cream/60">
                  Page {page} of {response.pagination.totalPages}
                </span>
                {page < response.pagination.totalPages && (
                  <Link
                    href={`/blog?page=${page + 1}`}
                    className="rounded-xl border border-cream/10 px-4 py-2 text-sm text-cream/80 hover:border-gold/30 hover:text-gold"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-cream/8 bg-onyx-900/40 p-10 text-center">
            <h3 className="mb-2 font-display text-2xl text-cream">New guides coming soon</h3>
            <p className="text-cream/80">Check back soon for land-buying guides and location insights.</p>
          </div>
        )}
      </section>
    </div>
  );
}
