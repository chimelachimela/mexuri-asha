import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SquarePen, FileText, BarChart3, Settings, User, LogOut, PanelLeft, Trash2, Menu, X, MessageSquare } from "lucide-react";
import { useApp } from "../context/AppContext";
import ConfirmModal from "./ConfirmModal";

const NAV_ITEMS = [
  { id: "new", label: "New Chat", icon: SquarePen, action: "newChat" },
  { id: "surveys", label: "Surveys", icon: FileText, path: "/surveys" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ activeChat, onSelectChat, onNewChat, onDeleteChat, collapsed, onToggleCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut, chats, theme, unseenSurveyCount } = useApp();
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState(null); // chat id pending delete confirmation

  // Mobile overlay open/close — independent of the desktop `collapsed`
  // width toggle. Kept local so no parent page needs to manage it.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes (selecting a nav
  // item or a chat should dismiss the overlay, not leave it hanging open).
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function handleNav(item) {
    if (item.action === "newChat") return onNewChat?.();
    if (item.path) navigate(item.path);
  }

  function handleSelectChat(id) {
    if (onSelectChat) {
      onSelectChat(id);
    } else {
      navigate(`/chat/${id}`);
    }
  }

  function handleDelete(e, chatId) {
    e.stopPropagation();
    setDeleteChatId(chatId);
  }

  function confirmDeleteChat() {
    onDeleteChat?.(deleteChatId);
    setDeleteChatId(null);
  }

  const width = collapsed ? "w-[72px]" : "w-[260px]";

  const body = (
    <>
      <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3">
        {!collapsed && (
          <div className="min-w-0">
            <img
              src={
                theme === "light"
                  ? "https://res.cloudinary.com/xtydyhi0/image/upload/v1784464670/Asha_Logo_forWhite_euepl3.svg"
                  : "https://res.cloudinary.com/xtydyhi0/image/upload/v1784464670/Asha_Logo_forBlack_mt8s2u.svg"
              }
              width={"50px"}
              alt=""
            />
          </div>
        )}
        {/* Close button — mobile overlay only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="focus-ring md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-ink/50 hover:text-ink hover:bg-panel2 transition ml-auto"
          title="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className={`flex flex-col gap-1 ${collapsed ? "items-center px-3" : "px-3"} mt-2`}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.path && location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              title={collapsed ? item.label : undefined}
              className={`focus-ring flex items-center gap-3 rounded-full transition text-sm ${collapsed ? "w-10 h-10 justify-center" : "w-full px-4 py-2.5"
                } ${isActive
                  ? "bg-accent/15 text-accent-soft font-medium"
                  : "text-ink/60 hover:text-ink hover:bg-panel2"
                }`}
            >
              <span className="relative">
                <item.icon size={18} strokeWidth={1.8} />
                {item.id === "surveys" && unseenSurveyCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-6 px-5 flex-1 min-h-0 flex flex-col">
          <div className="text-[11px] font-semibold text-ink/35 uppercase tracking-wide mb-2">Recents</div>
          <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-0.5">
            {chats.length === 0 && <div className="text-xs text-ink/25 py-2">No chats yet</div>}
            {chats.map((c) => (
              <div key={c.id} className="group relative">
                <button
                  onClick={() => handleSelectChat(c.id)}
                  className={`focus-ring block w-full text-left truncate text-sm pl-2.5 pr-8 py-2 rounded-lg transition ${activeChat === c.id ? "bg-accent/15 text-accent-soft" : "text-ink/55 hover:text-ink hover:bg-accent/[0.06]"
                    }`}
                >
                  {c.title || "New chat"}
                </button>
                {onDeleteChat && (
                  <button
                    onClick={(e) => handleDelete(e, c.id)}
                    title="Delete chat"
                    className="focus-ring absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-ink/30 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-panel2 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {collapsed && <div className="flex-1" />}

      <div className={`border-t border-line py-3 flex flex-col gap-1 ${collapsed ? "items-center px-3" : "px-3"}`}>
        <button
          onClick={() => navigate("/settings")}
          title={collapsed ? "Profile" : undefined}
          className={`focus-ring flex items-center gap-3 rounded-lg transition text-sm text-ink/60 hover:text-ink hover:bg-panel ${collapsed ? "w-10 h-10 justify-center" : "w-full px-3 py-2.5"
            }`}
        >
          {session?.avatarUrl && !avatarBroken ? (
            <img
              src={session.avatarUrl}
              alt=""
              onError={() => setAvatarBroken(true)}
              className="w-[18px] h-[18px] rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User size={18} strokeWidth={1.8} />
          )}
          {!collapsed && <span>{session?.name || "Profile"}</span>}
        </button>
        <button
          onClick={signOut}
          title={collapsed ? "Logout" : undefined}
          className={`focus-ring flex items-center gap-3 rounded-lg transition text-sm text-ink/60 hover:text-ink hover:bg-panel ${collapsed ? "w-10 h-10 justify-center" : "w-full px-3 py-2.5"
            }`}
        >
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed && <span>Log out</span>}
        </button>
        <button
          onClick={() => { window.location.href = "https://asha.com.ng/s/4w0-zukj-cht" }}
          title={collapsed ? "Give Feedback" : undefined}
          className={`focus-ring flex items-center gap-3 rounded-lg transition text-sm text-ink/60 hover:text-ink hover:bg-panel ${collapsed ? "w-10 h-10 justify-center" : "w-full px-3 py-2.5"
            }`}
        >
          <MessageSquare size={18} strokeWidth={1.8} />
          {!collapsed && <span>Give Feedback</span>}
        </button>
        {/* Collapse toggle — desktop only; the mobile drawer just closes via the X or backdrop */}
        <button
          onClick={onToggleCollapsed}
          title="Toggle sidebar"
          className={`focus-ring hidden md:flex items-center gap-3 rounded-lg transition text-sm text-ink/40 hover:text-ink hover:bg-panel ${collapsed ? "w-10 h-10 justify-center" : "w-full px-3 py-2.5"
            }`}
        >
          <PanelLeft size={18} strokeWidth={1.8} />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger trigger — floats over whatever page is open */}
      <button
        onClick={() => setMobileOpen(true)}
        className="focus-ring md:hidden fixed top-4 left-4 z-30 w-9 h-9 rounded-lg bg-panel border border-line flex items-center justify-center text-ink/70 hover:text-ink transition"
        title="Open menu"
      >
        <Menu size={17} />
      </button>

      {/* Desktop sidebar — normal flex participant, width toggles via `collapsed` */}
      <aside className={`hidden md:flex ${width} shrink-0 h-screen bg-canvas border-r border-line flex-col transition-all duration-200`}>
        {body}
      </aside>

      {/* Mobile: backdrop + sliding overlay drawer, always full-width regardless of `collapsed` */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-canvas border-r border-line flex flex-col transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {body}
      </aside>

      {deleteChatId && (
        <ConfirmModal
          title="Delete this chat?"
          description="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteChat}
          onCancel={() => setDeleteChatId(null)}
        />
      )}
    </>
  );
}
