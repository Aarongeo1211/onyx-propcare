"use client";

const checks = [
  "Railway service variables are configured for API and both Next.js apps",
  "Database migrations have been applied and seed data is optional for non-production environments",
  "SMTP credentials are configured if transactional email is required",
  "Cloudinary credentials are configured if image uploads are enabled",
  "NEXTAUTH_SECRET and JWT_SECRET are aligned across the web, admin, and API services",
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Deployment Readiness</h1>
        <p className="text-sm text-cream/35 mt-1">This workspace now treats settings as an operational checklist rather than a fake save form.</p>
      </div>

      <div className="rounded-2xl border border-cream/8 bg-onyx-900/30 p-6">
        <p className="text-sm text-cream/55 leading-relaxed">
          Production configuration belongs in environment variables and platform services, not in browser-only forms. Use this page as a final pre-launch checklist before promoting the app on Railway.
        </p>

        <ul className="mt-6 space-y-3">
          {checks.map((check) => (
            <li key={check} className="flex items-start gap-3 rounded-xl border border-cream/8 bg-onyx-800/30 px-4 py-3 text-sm text-cream/65">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gold" />
              <span>{check}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
