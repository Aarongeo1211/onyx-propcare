"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Leaf,
  Users,
  Briefcase,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  UsersRound,
  TreePine,
  BadgeCheck,
  Phone,
  ArrowRight,
  Calendar,
  Handshake,
  Compass,
  Crown,
  MessageCircle,
} from "lucide-react";

const NAVY = "#152A52";
const ORANGE = "#F2791E";
const TEAL = "#1B96A6";

const CONTACT_PHONE = "+919886455199";
const CONTACT_PHONE_DISPLAY = "98864 55199";
const UPI_ID = "yespay.mabs0696619ikit4760@yesbankltd";
const UPI_PAY_LINK = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("Onyx Propcare")}&cu=INR`;
const WHATSAPP_LINK = `https://wa.me/919886455199?text=${encodeURIComponent("Hi! I'd like to know more about Onyx 40+ membership.")}`;

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

const pillars = [
  {
    icon: TreePine,
    title: "Experience Nature",
    tagline: "Reconnect with nature through carefully curated experiences.",
    items: [
      "Farm Visits",
      "Organic Farming Experiences",
      "Tree Plantation Drives",
      "Nature Walks",
      "Bird Watching",
      "Weekend Escapes",
      "Eco Tourism",
      "Glamping",
      "Motorhome Experiences",
    ],
  },
  {
    icon: Users,
    title: "Build Meaningful Relationships",
    tagline: "Meet people who share your values.",
    items: [
      "Coffee Meetups",
      "Weekend Socials",
      "Couples Meet",
      "Singles Meet",
      "Community Gatherings",
      "Birthday Celebrations",
      "Festival Celebrations",
      "Family Events",
    ],
  },
  {
    icon: Briefcase,
    title: "Grow Personally & Professionally",
    tagline: "Expand your network while creating opportunities.",
    items: [
      "Business Networking",
      "Business Referrals",
      "Entrepreneur Meetups",
      "Startup Showcase",
      "Investor Connect",
      "Vendor Network",
      "Mastermind Sessions",
    ],
  },
  {
    icon: HeartPulse,
    title: "Wellness & Learning",
    tagline: "A healthier body. A calmer mind.",
    items: [
      "Yoga Sessions",
      "Meditation",
      "Wellness Retreats",
      "Health Talks",
      "Nutrition Workshops",
      "Podcast Sessions",
      "Guest Speakers",
      "Life Coaching",
      "Skill Development",
    ],
  },
];

const differentiators = [
  "Verified Members",
  "Curated Experiences",
  "Safe & Trusted Community",
  "No Random Public Groups",
  "Business Networking",
  "Nature-Based Lifestyle",
  "Premium Events",
  "Lifelong Friendships",
];

const whyJoin = ["More friendships.", "More adventures.", "More laughter.", "More learning.", "More purpose.", "More memories."];

const eventWeeks = [
  { week: "Week 1", theme: "Business & Networking", items: ["Breakfast Meet", "Entrepreneur Connect", "Business Referral Circle"] },
  { week: "Week 2", theme: "Nature Experience", items: ["Farm Visit", "Organic Farming Workshop", "Nature Walk", "Tree Plantation"] },
  { week: "Week 3", theme: "Wellness & Learning", items: ["Yoga", "Meditation", "Podcast Recording", "Guest Speaker Session"] },
  { week: "Week 4", theme: "Social Celebration", items: ["Dinner Meet", "Birthday Celebration", "Music Evening", "Cultural Event"] },
];

const quarterlyExperiences = ["Resort Retreat", "Couples Weekend", "Adventure Day", "Leadership Summit", "Family Picnic", "Community Awards"];

const memberBenefits = [
  { title: "Lifestyle", items: ["Exclusive Experiences", "Weekend Getaways", "Curated Travel", "Member Discounts"] },
  { title: "Business", items: ["Networking Opportunities", "Business Referrals", "Featured Business Listings"] },
  { title: "Wellness", items: ["Yoga", "Meditation", "Podcasts", "Expert Talks"] },
  { title: "Personal Development", items: ["Trusted Network", "Lifelong Friendships", "Celebrations Together"] },
];

const whoCanJoin = [
  "Are 40 years and above",
  "Value meaningful relationships",
  "Enjoy nature and travel",
  "Believe in personal growth",
  "Respect diversity and community values",
  "Wish to contribute positively",
];

const values = [
  { title: "Respect", description: "Every member is treated with dignity." },
  { title: "Trust", description: "We build authentic relationships." },
  { title: "Integrity", description: "We uphold honesty and transparency." },
  { title: "Inclusion", description: "Everyone belongs." },
  { title: "Growth", description: "Every interaction should inspire learning." },
  { title: "Joy", description: "Celebrate life, every step of the way." },
];

const foundingPerks = [
  "Exclusive Founding Member recognition",
  "Priority access to premium events",
  "Opportunity to become Community Leaders",
  "Invitations to closed-door networking sessions",
  "Early access to future ONYX experiences and initiatives",
];

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-body font-medium uppercase tracking-wider"
      style={{ borderColor: `${ORANGE}33`, backgroundColor: `${ORANGE}12`, color: ORANGE }}
    >
      {children}
    </span>
  );
}

export function FortyPlusContent() {
  return (
    <div className="min-h-screen bg-onyx-950">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 md:pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-24 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.07] blur-[120px]"
            style={{ background: `radial-gradient(circle, ${ORANGE}, transparent 70%)` }}
          />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-10 md:grid-cols-2 md:items-center md:pb-24">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
            <div className="mb-6 flex items-center gap-3">
              <Image src="/40plus/logo.jpg" alt="Onyx 40+" width={56} height={56} className="rounded-xl" priority />
              <div>
                <p className="font-display text-sm font-semibold" style={{ color: NAVY }}>
                  ONYX 40+
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-cream/40">An Onyx initiative</p>
              </div>
            </div>

            <SectionBadge>Welcome to Onyx 40+ Community</SectionBadge>

            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-cream md:text-5xl lg:text-6xl">
              Where Life Begins Again <span style={{ color: ORANGE }}>After 40</span>
            </h1>

            <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
              Connect with like-minded people. Experience nature. Celebrate life. Grow personally and professionally.
            </p>
            <p className="mt-4 max-w-xl font-body leading-relaxed text-cream/55">
              An exclusive, members-only community designed for individuals above 40 who believe life is meant to be
              lived—not just worked through.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#membership"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: ORANGE, boxShadow: `0 12px 30px -10px ${ORANGE}88` }}
              >
                Become a Member
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#pillars"
                className="inline-flex items-center gap-2 rounded-full border-2 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-cream/5"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                Explore Membership
              </a>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md md:max-w-none"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-cream/10 shadow-2xl">
              <Image
                src="/40plus/hero.jpg"
                alt="Onyx 40+ — the journey begins now"
                width={1024}
                height={1536}
                priority
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── VISION / MISSION ─────────────────────────────────── */}
      <section className="border-y border-cream/8 bg-onyx-900/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionBadge>Our Vision</SectionBadge>
            <p className="mt-5 font-display text-2xl font-medium leading-snug text-cream md:text-3xl">
              To become India&apos;s most trusted lifestyle community for people above 40, inspiring meaningful
              relationships, wellness, lifelong learning, and memorable experiences through nature, travel, and human
              connection.
            </p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <SectionBadge>Our Mission</SectionBadge>
            <p className="mt-5 font-body text-cream/60">We create curated experiences that help members:</p>
            <ul className="mt-4 space-y-2.5">
              {[
                "Build genuine friendships",
                "Explore farms, resorts, and unique destinations",
                "Improve physical and mental well-being",
                "Expand professional and business networks",
                "Celebrate life's milestones together",
                "Continue learning and growing through inspiring conversations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 font-body text-sm text-cream/70">
                  <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: TEAL }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── WHY JOIN ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16 text-center md:py-20">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <h2 className="font-display text-2xl font-semibold text-cream md:text-3xl">
            Because life after 40 deserves more than routine.
          </h2>
        </motion.div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {whyJoin.map((line, i) => (
            <motion.span
              key={line}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-full border px-5 py-2.5 font-display text-base font-medium"
              style={{
                borderColor: i % 2 === 0 ? `${ORANGE}33` : `${TEAL}33`,
                color: i % 2 === 0 ? ORANGE : TEAL,
                backgroundColor: i % 2 === 0 ? `${ORANGE}0A` : `${TEAL}0A`,
              }}
            >
              {line}
            </motion.span>
          ))}
        </div>
      </section>

      {/* ── FOUR PILLARS ─────────────────────────────────────── */}
      <section id="pillars" className="border-y border-cream/8 bg-onyx-900/40 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
            <SectionBadge>Our Four Pillars</SectionBadge>
            <h2 className="mt-5 font-display text-3xl font-semibold text-cream md:text-4xl">
              Everything Onyx 40+ brings to your life
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
                className="rounded-2xl border border-cream/8 bg-onyx-950 p-7"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: i % 2 === 0 ? `${TEAL}15` : `${ORANGE}15` }}
                >
                  <pillar.icon className="h-6 w-6" style={{ color: i % 2 === 0 ? TEAL : ORANGE }} />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-cream">{pillar.title}</h3>
                <p className="mt-1.5 font-body text-sm text-cream/55">{pillar.tagline}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pillar.items.map((item) => (
                    <span key={item} className="rounded-full border border-cream/10 px-3 py-1 text-xs text-cream/60">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES ONYX DIFFERENT ────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
          <SectionBadge>What Makes Us Different</SectionBadge>
          <h2 className="mt-5 font-display text-3xl font-semibold text-cream md:text-4xl">Not just another group chat</h2>
        </motion.div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {differentiators.map((item, i) => (
            <motion.div
              key={item}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex items-center gap-2.5 rounded-xl border border-cream/8 bg-onyx-900/40 px-4 py-3.5"
            >
              <ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: TEAL }} />
              <span className="font-body text-sm text-cream/75">{item}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── MEMBERSHIP ───────────────────────────────────────── */}
      <section id="membership" className="border-y border-cream/8 bg-onyx-900/40 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionBadge>Membership</SectionBadge>
            <h2 className="mt-5 font-display text-3xl font-semibold text-cream md:text-4xl">Join Onyx 40+</h2>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-10 max-w-sm overflow-hidden rounded-3xl border-2 shadow-xl"
            style={{ borderColor: `${ORANGE}55` }}
          >
            <div className="px-8 py-8" style={{ backgroundColor: NAVY }}>
              <p className="font-body text-xs uppercase tracking-[0.25em]" style={{ color: `${ORANGE}` }}>
                Membership Plan
              </p>
              <p className="mt-3 font-display text-5xl font-semibold text-white">₹4,999</p>
              <p className="mt-1 font-body text-sm text-white/60">Valid for 5 months</p>
            </div>
            <div className="space-y-3 bg-onyx-950 px-8 py-8 text-left">
              {["WhatsApp Community Access", "1 Farm Visit", "1 Networking Event", "1 Movie", "Podcast Access", "Birthday Celebrations"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <BadgeCheck className="h-4 w-4 flex-shrink-0" style={{ color: TEAL }} />
                    <span className="font-body text-sm text-cream/75">{item}</span>
                  </div>
                )
              )}
              <a
                href={UPI_PAY_LINK}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: ORANGE }}
              >
                Pay via UPI
              </a>
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-semibold transition-colors hover:bg-cream/5"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                <Phone className="h-4 w-4" />
                Call to Join — {CONTACT_PHONE_DISPLAY}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── EVENTS CALENDAR ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
          <SectionBadge>Events Calendar</SectionBadge>
          <h2 className="mt-5 font-display text-3xl font-semibold text-cream md:text-4xl">
            Every month, a mix of curated experiences
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {eventWeeks.map((w, i) => (
            <motion.div
              key={w.week}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-cream/8 bg-onyx-900/40 p-6"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" style={{ color: ORANGE }} />
                <span className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: ORANGE }}>
                  {w.week}
                </span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold text-cream">{w.theme}</h3>
              <ul className="mt-3 space-y-1.5">
                {w.items.map((item) => (
                  <li key={item} className="font-body text-sm text-cream/55">
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 rounded-2xl border border-cream/8 bg-onyx-900/40 p-6"
        >
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4" style={{ color: TEAL }} />
            <span className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
              Quarterly Experiences
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {quarterlyExperiences.map((item) => (
              <span key={item} className="rounded-full border border-cream/10 px-3.5 py-1.5 text-sm text-cream/65">
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }} className="mt-8 text-center">
          <Link
            href="/40plus/events"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: NAVY }}
          >
            See Photos &amp; Videos from Past Events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── MEMBER BENEFITS ──────────────────────────────────── */}
      <section className="border-y border-cream/8 bg-onyx-900/40 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
            <SectionBadge>Member Benefits</SectionBadge>
            <h2 className="mt-5 font-display text-3xl font-semibold text-cream md:text-4xl">What you get, category by category</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {memberBenefits.map((group, i) => (
              <motion.div
                key={group.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-cream/8 bg-onyx-950 p-6"
              >
                <h3 className="font-display text-base font-semibold" style={{ color: i % 2 === 0 ? ORANGE : TEAL }}>
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="font-body text-sm text-cream/60">
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO CAN JOIN ─────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center">
          <SectionBadge>Who Can Join</SectionBadge>
          <h2 className="mt-5 font-display text-3xl font-semibold text-cream md:text-4xl">ONYX welcomes individuals who…</h2>
        </motion.div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {whoCanJoin.map((item, i) => (
            <motion.div
              key={item}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-cream/8 bg-onyx-900/40 px-5 py-4"
            >
              <UsersRound className="h-4 w-4 flex-shrink-0" style={{ color: ORANGE }} />
              <span className="font-body text-sm text-cream/75">{item}</span>
            </motion.div>
          ))}
        </div>
        <motion.p {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }} className="mt-6 text-center font-body text-xs text-cream/40">
          Membership is subject to verification and approval to maintain a trusted community.
        </motion.p>
      </section>

      {/* ── COMMUNITY VALUES ─────────────────────────────────── */}
      <section className="border-y border-cream/8 bg-onyx-900/40 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
            <SectionBadge>Our Community Values</SectionBadge>
          </motion.div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-cream/8 bg-onyx-950 p-6"
              >
                <h3 className="font-display text-lg font-semibold" style={{ color: i % 2 === 0 ? TEAL : ORANGE }}>
                  {value.title}
                </h3>
                <p className="mt-1.5 font-body text-sm text-cream/60">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUNDING MEMBER ──────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl px-8 py-12 text-center md:px-16 md:py-16"
          style={{ backgroundColor: NAVY }}
        >
          <Crown className="mx-auto h-9 w-9" style={{ color: ORANGE }} />
          <h2 className="mt-4 font-display text-3xl font-semibold text-white md:text-4xl">Become a Founding Member</h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-white/70">
            As an early member of ONYX 40+, you&apos;ll help shape the culture of a community that aims to redefine life
            after 40.
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
            {foundingPerks.map((perk) => (
              <div key={perk} className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: ORANGE }} />
                <span className="font-body text-sm text-white/80">{perk}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="px-6 pb-24 pt-4 text-center md:pb-32">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl">
          <Handshake className="mx-auto h-9 w-9" style={{ color: ORANGE }} />
          <h2 className="mt-4 font-display text-3xl font-semibold text-cream md:text-4xl">
            Ready to Begin Your Next Chapter?
          </h2>
          <p className="mt-4 font-body text-cream/60">
            Life isn&apos;t slowing down after 40—it&apos;s just getting more meaningful. Join a community where every
            conversation, every event, and every journey helps you connect, experience, and grow.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`tel:${CONTACT_PHONE}`}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: ORANGE, boxShadow: `0 12px 30px -10px ${ORANGE}88` }}
            >
              <Phone className="h-4 w-4" />
              Call Sunitha Singh — {CONTACT_PHONE_DISPLAY}
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-cream/5"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Us
            </a>
          </div>
          <p className="mt-8 font-body text-xs text-cream/35">Onyx 40+ is an initiative of Onyx, the mother company.</p>
        </motion.div>
      </section>
    </div>
  );
}
