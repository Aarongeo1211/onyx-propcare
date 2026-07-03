"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const subjects = [
  "General",
  "Property Inquiry",
  "Seller Support",
  "Partnership",
  "Other",
];

export function ContactPageContent() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
    } catch {
      // silently handle
    }
    setSending(false);
    setSent(true);
    setForm({ name: "", email: "", phone: "", subject: "General", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  const inputClass =
    "w-full bg-onyx-900/60 border border-cream/10 rounded-xl px-4 py-3 text-cream font-body text-sm placeholder:text-cream/80 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors duration-200";

  return (
    <div className="min-h-screen bg-onyx-950">
      {/* Hero */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-gold text-xs font-body uppercase tracking-wider mb-6"
            {...fadeUp}
            transition={{ duration: 0.6 }}
          >
            Contact Us
          </motion.span>

          <motion.h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-cream mb-4"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Get in Touch
          </motion.h1>

          <motion.p
            className="text-cream/78 font-body text-lg max-w-xl mx-auto"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Have a question about a property or need help with your account? We
            are here to help.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: Contact Info */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            {...fadeUp}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold text-cream mb-6">
                Contact Information
              </h2>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-gold/10 rounded-lg flex-shrink-0">
                    <Mail className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-body font-medium text-cream text-sm mb-0.5">
                      Email
                    </h4>
                    <p className="text-cream/86 font-body text-sm">
                      support@onyxpropcare.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-gold/10 rounded-lg flex-shrink-0">
                    <Phone className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-body font-medium text-cream text-sm mb-0.5">
                      Phone
                    </h4>
                    <p className="text-cream/86 font-body text-sm">
                      +91 81470 57801
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-gold/10 rounded-lg flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-body font-medium text-cream text-sm mb-0.5">
                      Office
                    </h4>
                    <p className="text-cream/86 font-body text-sm leading-relaxed">
                      Onyx Propcare Pvt. Ltd.<br />1st Floor, No.36, Shop No.4, Bidarahalli Hobli,<br />Dr SRK Nagar Post, Near Anjaneya Temple,<br />Byrathi, Bengaluru, Bengaluru Urban,<br />Karnataka, 560077
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-onyx-900/30 backdrop-blur-sm border border-cream/5 rounded-2xl p-6">
              <h3 className="font-body font-medium text-cream text-sm mb-2">
                Business Hours
              </h3>
              <p className="text-cream/86 font-body text-sm leading-relaxed">
                Monday - Friday: 9:00 AM - 6:00 PM IST
                <br />
                Saturday: 10:00 AM - 2:00 PM IST
                <br />
                Sunday: Closed
              </p>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            className="lg:col-span-3"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="bg-onyx-900/50 backdrop-blur-xl border border-cream/8 rounded-2xl p-6 md:p-8">
              <h2 className="font-display text-xl font-semibold text-cream mb-6">
                Send a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-cream/81 font-body text-xs mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-cream/81 font-body text-xs mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-cream/81 font-body text-xs mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-cream/81 font-body text-xs mb-1.5">
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-cream/81 font-body text-xs mb-1.5">
                    Message
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold-light text-onyx-950 font-body font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : "Send Message"}
                </button>

                {sent && (
                  <motion.p
                    className="text-gold font-body text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Message sent successfully. We will get back to you shortly.
                  </motion.p>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
