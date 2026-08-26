"use client";

import { motion } from "framer-motion";
import { Search, Pencil, X, Save, AlertCircle, Check, Infinity as InfinityIcon } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const ROLES = ["BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"] as const;
type Role = typeof ROLES[number];

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  hasUnlimitedGrant?: boolean;
  _count?: { properties?: number; inquiries?: number };
}

const roleColors: Record<string, string> = {
  BUYER: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  SELLER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  AGENT: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  ADMIN: "bg-gold/10 text-gold border-gold/20",
  SUPER_ADMIN: "bg-gold/10 text-gold border-gold/20",
};

export default function UsersPage() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const currentUserRole = (session?.user as { role?: Role } | undefined)?.role;
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<User | null>(null);

  async function fetchUsers() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.role, user.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-cream">Users</h1>
        <p className="text-sm text-cream/35 mt-1">
          Review accounts, manage roles, activate or deactivate users.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/20" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or role"
          className="w-full bg-onyx-900/50 border border-cream/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/30"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-cream/8 bg-onyx-900/25 overflow-hidden"
      >
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className="border-b border-cream/5">
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">User</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Role</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Properties</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Inquiries</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Joined</th>
              <th className="text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Status</th>
              <th className="text-right px-5 py-3.5 text-xs uppercase tracking-[0.2em] text-cream/25">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/[0.03]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-4 rounded bg-onyx-800/50 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-cream/25">
                  No users match the current search.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-cream/[0.02]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-onyx-800/60 flex items-center justify-center text-xs text-cream/60 font-medium">
                        {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-cream">{user.name}</p>
                        <p className="text-xs text-cream/25">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] ${roleColors[user.role] || roleColors.BUYER}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-cream/55">{user._count?.properties ?? 0}</td>
                  <td className="px-5 py-4 text-sm text-cream/55">{user._count?.inquiries ?? 0}</td>
                  <td className="px-5 py-4 text-xs text-cream/35">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 text-xs ${user.isActive ? "text-emerald-400" : "text-cream/25"}`}>
                        <span className={`h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-400" : "bg-cream/20"}`} />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                      {user.hasUnlimitedGrant && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                          <InfinityIcon className="h-3 w-3" />
                          Unlimited
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setEditing(user)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-cream/60 hover:text-gold hover:bg-gold/5 border border-cream/10 hover:border-gold/30 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {editing && (
        <EditUserDrawer
          user={editing}
          token={token!}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          onClose={() => setEditing(null)}
          onUserUpdated={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
          }}
        />
      )}
    </div>
  );
}

function EditUserDrawer({
  user,
  token,
  currentUserRole,
  currentUserId,
  onClose,
  onUserUpdated,
}: {
  user: User;
  token: string;
  currentUserRole?: Role;
  currentUserId?: string;
  onClose: () => void;
  onUserUpdated: (u: User) => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [hasUnlimitedGrant, setHasUnlimitedGrant] = useState(user.hasUnlimitedGrant ?? false);
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantMsg, setGrantMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const isSelf = currentUserId === user.id;
  const canAssignAdmin = currentUserRole === "SUPER_ADMIN";
  const targetIsSuperAdmin = user.role === "SUPER_ADMIN" && currentUserRole !== "SUPER_ADMIN";

  async function toggleUnlimitedGrant() {
    setGrantBusy(true);
    setGrantMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/${user.id}/unlimited-plan`, {
        method: hasUnlimitedGrant ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const nextValue = !hasUnlimitedGrant;
        setHasUnlimitedGrant(nextValue);
        setGrantMsg({ type: "ok", text: nextValue ? "Unlimited listings granted" : "Exception revoked" });
        // Sync the table row but deliberately don't close the drawer here --
        // this used to call the same callback as "Save changes", which also
        // closed the drawer, so the confirmation message above never had a
        // chance to be seen before it vanished.
        onUserUpdated({ ...user, hasUnlimitedGrant: nextValue });
      } else {
        setGrantMsg({ type: "err", text: data.error || "Failed to update" });
      }
    } catch {
      setGrantMsg({ type: "err", text: "Network error" });
    } finally {
      setGrantBusy(false);
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          phone: phone || null,
          role,
          isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "ok", text: "User updated" });
        onUserUpdated(data.data);
        onClose();
      } else {
        const errText = Array.isArray(data.error) ? data.error[0]?.message : data.error;
        setMsg({ type: "err", text: errText || "Failed to update user" });
      }
    } catch {
      setMsg({ type: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-onyx-950/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        className="w-full max-w-md bg-onyx-900 border-l border-cream/10 h-full overflow-auto p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-cream">Edit user</h2>
            <p className="text-xs text-cream/40 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cream/5 rounded-lg text-cream/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        {targetIsSuperAdmin && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <AlertCircle className="w-4 h-4" />
            Only SUPER_ADMIN can modify SUPER_ADMIN accounts
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={isSelf || targetIsSuperAdmin}
              className="w-full px-3 py-2 bg-onyx-950/60 border border-cream/10 rounded-lg text-sm text-cream focus:outline-none focus:border-gold/40 disabled:opacity-40"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} disabled={(r === "ADMIN" || r === "SUPER_ADMIN") && !canAssignAdmin}>
                  {r}
                  {(r === "ADMIN" || r === "SUPER_ADMIN") && !canAssignAdmin ? " (SUPER_ADMIN only)" : ""}
                </option>
              ))}
            </select>
            {isSelf && <p className="text-[11px] text-cream/30 mt-1">Cannot change your own role</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cream/50 mb-1.5 block">Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsActive(true)}
                disabled={isSelf || targetIsSuperAdmin}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "border-cream/10 text-cream/40 hover:border-cream/20"
                } disabled:opacity-40`}
              >
                Active
              </button>
              <button
                onClick={() => setIsActive(false)}
                disabled={isSelf || targetIsSuperAdmin}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition ${
                  !isActive
                    ? "bg-red-500/15 border-red-500/30 text-red-400"
                    : "border-cream/10 text-cream/40 hover:border-cream/20"
                } disabled:opacity-40`}
              >
                Deactivated
              </button>
            </div>
            {isSelf && <p className="text-[11px] text-cream/30 mt-1">Cannot deactivate yourself</p>}
          </div>

          <div className="rounded-lg border border-cream/10 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-cream/50">Listing limit exception</p>
                <p className="mt-1 text-[11px] text-cream/30">
                  Bypasses the normal plan cap entirely -- for internal/VIP accounts only, not a substitute for a real plan.
                </p>
              </div>
              <button
                onClick={toggleUnlimitedGrant}
                disabled={grantBusy}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition disabled:opacity-50 ${
                  hasUnlimitedGrant
                    ? "bg-gold/15 border-gold/30 text-gold hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                    : "border-cream/10 text-cream/50 hover:border-gold/30 hover:text-gold"
                }`}
              >
                {grantBusy ? "..." : hasUnlimitedGrant ? "Revoke" : "Grant unlimited"}
              </button>
            </div>
            {grantMsg && (
              <p className={`mt-2 text-[11px] ${grantMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                {grantMsg.text}
              </p>
            )}
          </div>

          {msg && (
            <div
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                msg.type === "ok"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {msg.type === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={save}
              disabled={saving || targetIsSuperAdmin}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gold/15 hover:bg-gold/25 border border-gold/30 rounded-lg text-sm text-gold disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-cream/10 hover:border-cream/20 text-cream/60 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
