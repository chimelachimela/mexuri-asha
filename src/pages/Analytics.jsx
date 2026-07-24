import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import * as db from "../lib/services/dbService";

export default function Analytics() {
  const { session } = useApp();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    db.listSurveys(session.id).then(setSurveys);
  }, [session.id]);

  const totalResponses = surveys.reduce((sum, s) => sum + s.responses.length, 0);
  const published = surveys.filter((s) => s.status === "published").length;
  const maxResponses = Math.max(1, ...surveys.map((s) => s.responses.length));

  return (
    <div className="h-screen w-full bg-canvas flex overflow-hidden">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} onNewChat={() => navigate("/chat")} />

      <div className="flex-1 min-w-0 overflow-y-auto px-6 sm:px-10 pt-16 pb-8 md:pt-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Analytics</h1>
          <p className="text-ink/40 text-sm mb-8">Response activity across all your surveys.</p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <Stat label="Surveys" value={surveys.length} />
            <Stat label="Published" value={published} />
            <Stat label="Responses" value={totalResponses} />
          </div>

          {surveys.length === 0 ? (
            <div className="border border-dashed border-line2 rounded-xl py-16 text-center text-sm text-ink/40">
              Once you have surveys collecting responses, you'll see the breakdown here.
            </div>
          ) : (
            <div className="space-y-3">
              {surveys.map((s) => (
                <div key={s.id} className="border border-line rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate">{s.title}</span>
                    <span className="text-xs text-ink/40 shrink-0 ml-3">{s.responses.length} responses</span>
                  </div>
                  <div className="h-2 bg-panel2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-from to-accent-to"
                      style={{ width: `${(s.responses.length / maxResponses) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border border-line rounded-xl p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-ink/40 mt-0.5">{label}</div>
    </div>
  );
}
