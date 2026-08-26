import Anthropic from "@anthropic-ai/sdk";
import sanitizeHtml from "sanitize-html";
import { prisma } from "@onyx/db";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { cache } from "../lib/redis";

const MODEL = "claude-sonnet-4-5-20250929";

// Evergreen guide topics tied to the platform's actual differentiators
// (soil/water/legal/drone verification) rather than generic real-estate
// clickbait -- keeps auto-published content on-brand and defensible.
const EVERGREEN_TOPICS = [
  "How to read a soil health report before buying farmland in India",
  "Water table depth and borewell viability: what buyers should check",
  "Understanding land title clarity and encumbrance certificates in India",
  "What NA (Non-Agricultural) order status means for a plot, and why it matters",
  "How drone surveys and orthographic maps help verify a plot's real boundaries",
  "Freehold vs leasehold land: what the difference actually means for a buyer",
  "A first-time buyer's checklist before visiting a farmland listing",
  "Why soil fertility grade matters more than price per acre for farmland",
  "How to evaluate road access and boundary walls before buying a plot",
  "NRI's guide to buying land in India remotely: what to verify first",
];

function htmlSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(base: string) {
  let slug = base;
  let suffix = 1;
  while (await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

interface TopicCandidate {
  key: string; // stable identifier, stored on BlogPost.sourceTopic to avoid repeats
  prompt: string; // what to actually ask the model to write about
}

// Real inventory gets first priority -- a guide tied to an actual district
// with active listings is far more defensible (and useful) than generic
// content, and it creates a natural internal link to that location's
// landing page. Falls back to the evergreen list once locations run dry.
async function pickNextTopic(): Promise<TopicCandidate | null> {
  const covered = new Set(
    (await prisma.blogPost.findMany({ select: { sourceTopic: true } }))
      .map((p) => p.sourceTopic)
      .filter((t): t is string => Boolean(t))
  );

  const locationRows = await prisma.property.groupBy({
    by: ["state", "district"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });

  const locationCandidates = locationRows
    .filter((r) => r._count._all >= 2)
    .map((r) => ({
      key: `location:${r.state.trim().toLowerCase()}:${r.district.trim().toLowerCase()}`,
      prompt: `Buying land in ${r.district.trim()}, ${r.state.trim()}: what to know before you invest`,
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  for (const candidate of locationCandidates) {
    if (!covered.has(candidate.key)) {
      return { key: candidate.key, prompt: candidate.prompt };
    }
  }

  for (const topic of EVERGREEN_TOPICS) {
    const key = `evergreen:${htmlSlug(topic)}`;
    if (!covered.has(key)) {
      return { key, prompt: topic };
    }
  }

  return null; // every topic covered -- nothing to generate this run
}

const BLOG_POST_TOOL = {
  name: "submit_blog_post",
  description: "Submit the finished blog post",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "SEO-friendly title, under 70 characters" },
      excerpt: { type: "string", description: "1-2 sentence summary, under 160 characters" },
      metaDescription: { type: "string", description: "SEO meta description, under 160 characters" },
      tags: { type: "array", items: { type: "string" }, description: "3-6 lowercase topic tags" },
      contentHtml: {
        type: "string",
        description:
          "The full post body as semantic HTML using only h2, h3, p, ul, ol, li, strong, em, and blockquote tags. No inline styles, no scripts, no images. 700-1100 words.",
      },
    },
    required: ["title", "excerpt", "metaDescription", "tags", "contentHtml"],
  },
};

async function generateDraft(anthropic: Anthropic, topic: TopicCandidate) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system:
      "You are a content writer for Onyx Propcare, an Indian land marketplace that differentiates itself on verified data: soil reports, water analysis, legal title checks, and drone surveys. Write informative, plainly-worded blog content for prospective land buyers. Do not state specific legal procedures, tax rates, or regulatory figures as fact -- those vary by state and change over time; write generally and suggest the reader confirm current specifics with a local advocate or revenue office where relevant. Do not fabricate statistics, prices, or named case studies. Write in a grounded, practical tone -- no hype, no generic filler.",
    messages: [
      {
        role: "user",
        content: `Write a blog post on this topic: "${topic.prompt}". Call submit_blog_post with the finished post.`,
      },
    ],
    tools: [BLOG_POST_TOOL],
    tool_choice: { type: "tool", name: "submit_blog_post" },
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return a submit_blog_post tool call");
  }

  return toolUse.input as {
    title: string;
    excerpt: string;
    metaDescription: string;
    tags: string[];
    contentHtml: string;
  };
}

export async function runBlogGenerator() {
  if (!env.ANTHROPIC_API_KEY) {
    logger.info("Blog generator skipped -- ANTHROPIC_API_KEY not configured");
    return { generated: false, reason: "not_configured" };
  }
  if (!env.BLOG_AUTOPUBLISH_ENABLED) {
    logger.info("Blog generator skipped -- BLOG_AUTOPUBLISH_ENABLED is false");
    return { generated: false, reason: "disabled" };
  }

  const topic = await pickNextTopic();
  if (!topic) {
    logger.info("Blog generator: no uncovered topics remain");
    return { generated: false, reason: "no_topics" };
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const draft = await generateDraft(anthropic, topic);
    const slug = await ensureUniqueSlug(htmlSlug(draft.title));
    const contentHtml = sanitizeHtml(draft.contentHtml, {
      allowedTags: ["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "blockquote"],
      allowedAttributes: {},
    });

    const post = await prisma.blogPost.create({
      data: {
        title: draft.title,
        slug,
        content: contentHtml,
        excerpt: draft.excerpt,
        metaDescription: draft.metaDescription,
        tags: draft.tags,
        authorName: "Onyx Propcare Team",
        isPublished: true,
        generatedBy: "ai-auto",
        sourceTopic: topic.key,
      },
    });

    await cache.invalidatePrefix("blog:list:");
    logger.info({ postId: post.id, slug: post.slug, topic: topic.key }, "Blog generator: published new post");
    return { generated: true, postId: post.id, slug: post.slug };
  } catch (err) {
    logger.error({ err, topic: topic.key }, "Blog generator: failed to generate/publish post");
    return { generated: false, reason: "error" };
  }
}
