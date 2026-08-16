import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw, Search, Sparkles, Users, FileText, MessageSquare, Mail } from "lucide-react";
import { useApp } from "../context/AppContext";
import * as admin from "../lib/services/adminService";

function Card({ label, value, detail, icon: Icon }) {
  return <div className="border border-line rounded-2xl p-5 bg-panel/30"><div className="flex items-center justify-between mb-5"><span className="text-sm text-ink/45">{label}</span><Icon size={17} className="text-ink/35" /></div><div className="text-3xl font-bold tracking-tight">{value}</div>{detail && <div className="text-xs text-ink/40 mt-1">{detail}</div>}</div>;
}
function csvEscape(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function downloadCsv(users) {
  const rows = [["email", "name", "joined", "last_sign_in"], ...users.map((u) => [u.email, u.name, u.createdAt, u.lastSignInAt || ""])]
    .map((row) => row.map(csvEscape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([rows], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `asha-email-audience-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
}

export default function Admin() {
  const { session } = useApp();
  const [stats, setStats] = useState(null), [users, setUsers] = useState([]), [search, setSearch] = useState("");
  const [question, setQuestion] = useState(""), [insight, setInsight] = useState(null), [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true), [insightLoading, setInsightLoading] = useState(false), [error, setError] = useState("");

  async function load() {
    setLoading(true); setUsersLoading(true); setError("");
    try {
      const [nextStats, nextUsers] = await Promise.all([admin.getStats(), admin.getAllUsers()]);
      setStats(nextStats); setUsers(nextUsers);
    } catch (err) { setError(err.message); } finally { setLoading(false); setUsersLoading(false); }
  }
  useEffect(() => { if (session) load(); }, [session]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? users.filter((u) => `${u.email} ${u.name}`.toLowerCase().includes(query)) : users;
  }, [users, search]);

  async function handleInsight(event) {
    event.preventDefault(); if (!question.trim()) return; setInsightLoading(true); setError("");
    try { setInsight(await admin.askAsha(question.trim())); } catch (err) { setError(err.message); } finally { setInsightLoading(false); }
  }
  if (!session) return null;

  return <div className="min-h-screen bg-canvas text-ink">
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur"><div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3"><Link to="/chat" className="w-9 h-9 rounded-lg border border-line flex items-center justify-center hover:bg-panel transition"><ArrowLeft size={16} /></Link><div><h1 className="font-semibold">Asha Admin</h1><p className="text-[11px] text-ink/35">Product operations & insights</p></div></div>
      <button onClick={load} disabled={loading} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-line hover:bg-panel disabled:opacity-40"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
    </div></header>

    <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-8">
      {error && <div className="border border-red-500/20 bg-red-500/5 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>}
      <section><div className="mb-4"><h2 className="text-lg font-semibold">Overview</h2><p className="text-sm text-ink/40">A single view of Asha's platform activity.</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Total users" value={loading ? "—" : stats?.users?.total ?? 0} detail={stats ? `+${stats.users.newThisMonth} this month` : ""} icon={Users} />
          <Card label="Surveys" value={loading ? "—" : stats?.surveys?.total ?? 0} detail={stats ? `${stats.surveys.published} published` : ""} icon={FileText} />
          <Card label="Responses" value={loading ? "—" : stats?.responses ?? 0} detail="All surveys" icon={MessageSquare} />
          <Card label="Chats" value={loading ? "—" : stats?.chats ?? 0} detail={stats ? `${stats.userMessages} user messages` : ""} icon={Sparkles} />
        </div>
      </section>

      <section className="border border-line rounded-2xl overflow-hidden"><div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><div className="flex items-center gap-2"><Mail size={17} /><h2 className="font-semibold">Email audience</h2></div><p className="text-sm text-ink/40 mt-1">Manage the Asha audience and export it for Substack.</p></div>
        <button onClick={() => downloadCsv(filteredUsers)} disabled={!filteredUsers.length} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-ink text-canvas text-sm font-medium disabled:opacity-40"><Download size={15} /> Export CSV</button>
      </div><div className="p-4 border-b border-line"><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className="w-full bg-panel border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-ink/30" /></div></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-ink/35 border-b border-line"><th className="px-5 py-3 font-medium">Email</th><th className="px-5 py-3 font-medium">Name</th><th className="px-5 py-3 font-medium">Joined</th><th className="px-5 py-3 font-medium">Last sign in</th></tr></thead><tbody>
          {usersLoading ? <tr><td colSpan="4" className="px-5 py-10 text-center text-ink/35">Loading audience…</td></tr> : filteredUsers.slice(0, 100).map((u) => <tr key={u.id} className="border-b border-line last:border-0 hover:bg-panel/50"><td className="px-5 py-3.5">{u.email || "—"}</td><td className="px-5 py-3.5 text-ink/60">{u.name || "—"}</td><td className="px-5 py-3.5 text-ink/45">{new Date(u.createdAt).toLocaleDateString()}</td><td className="px-5 py-3.5 text-ink/45">{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : "Never"}</td></tr>)}
          {!usersLoading && !filteredUsers.length && <tr><td colSpan="4" className="px-5 py-10 text-center text-ink/35">No users found.</td></tr>}
        </tbody></table></div>{filteredUsers.length > 100 && <div className="px-5 py-3 border-t border-line text-xs text-ink/35">Showing the first 100 matches. Export CSV includes all loaded users.</div>}
      </section>

      <section className="border border-line rounded-2xl p-5 sm:p-6"><div className="flex items-start gap-3 mb-5"><div className="w-9 h-9 rounded-lg bg-panel flex items-center justify-center"><Sparkles size={17} /></div><div><h2 className="font-semibold">Ask Asha</h2><p className="text-sm text-ink/40 mt-1">Ask questions about current platform metrics. Asha only receives aggregated admin data.</p></div></div>
        <form onSubmit={handleInsight} className="flex flex-col sm:flex-row gap-2"><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What can you tell me about Asha's current activity?" className="flex-1 bg-panel border border-line rounded-lg px-3 py-3 text-sm outline-none focus:border-ink/30" /><button disabled={insightLoading || !question.trim()} className="px-5 py-3 rounded-lg bg-ink text-canvas text-sm font-medium disabled:opacity-40">{insightLoading ? "Thinking…" : "Ask Asha"}</button></form>
        {insight && <div className="mt-5 rounded-xl bg-panel border border-line p-5 space-y-4"><p className="text-sm leading-6">{insight.answer}</p>{insight.observations?.length > 0 && <div><h3 className="text-xs uppercase tracking-wide text-ink/35 font-semibold mb-2">Observations</h3><ul className="space-y-2 text-sm text-ink/65 list-disc pl-5">{insight.observations.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}{insight.nextSteps?.length > 0 && <div><h3 className="text-xs uppercase tracking-wide text-ink/35 font-semibold mb-2">Suggested next steps</h3><ul className="space-y-2 text-sm text-ink/65 list-disc pl-5">{insight.nextSteps.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}</div>}
      </section>
    </main>
  </div>;
}
