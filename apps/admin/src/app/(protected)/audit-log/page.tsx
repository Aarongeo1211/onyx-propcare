"use client";

import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  UPDATE_STATUS: "text-sky-400",
  ARCHIVE: "text-red-400",
  UPDATE_USER: "text-amber-400",
  DEACTIVATE_USER: "text-red-400",
};

export default function AuditLogPage() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (entityFilter) params.set("entity", entityFilter);
        const res = await fetch(`${API_URL}/api/v1/admin/audit-logs?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setLogs(data.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, entityFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        (l.entityId && l.entityId.toLowerCase().includes(q))
    );
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Audit Log</h1>
        <p className="text-sm text-cream/35 mt-1">Track admin actions across the platform.</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, email, entity..."
            className="w-full bg-onyx-900/50 border border-cream/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cream/25" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-onyx-900/50 border border-cream/8 rounded-xl px-3 py-2.5 text-sm text-cream focus:outline-none focus:border-gold/30"
          >
            <option value="">All entities</option>
            <option value="property">Properties</option>
            <option value="user">Users</option>
          </select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-cream/8 bg-onyx-900/25 overflow-hidden"
      >
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-cream/5">
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Time</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Action</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Entity</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Actor</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/[0.03]">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-4 rounded bg-onyx-800/50 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-cream/25">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              filtered.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="hover:bg-cream/[0.02]"
                >
                  <td className="px-5 py-3 text-xs text-cream/35 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-medium ${actionColors[log.action] || "text-cream/60"}`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-cream/55">{log.entity}</span>
                    {log.entityId && (
                      <span className="text-xs text-cream/20 ml-1.5 font-mono">
                        {log.entityId.slice(0, 8)}...
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-cream/55">{log.actorEmail}</p>
                    <p className="text-[10px] text-cream/25">{log.actorRole}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-cream/30 max-w-[200px] truncate">
                    {log.details ? JSON.stringify(log.details) : "—"}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
