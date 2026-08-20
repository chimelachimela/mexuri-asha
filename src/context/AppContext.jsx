import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authService from "../lib/services/authService";
import * as db from "../lib/services/dbService";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("asha_theme") || "dark");
  const [chats, setChats] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [sheets, setSheets] = useState([]);

  const refreshSheets = useCallback(async () => {
    if (!session?.id) return;
    setSheets(await db.listSheets(session.id));
  }, [session?.id]);

  useEffect(() => {
    if (session?.id) refreshSheets();
    else setSheets([]);
  }, [session?.id, refreshSheets]);

  useEffect(() => {
    let mounted = true;
    authService.initSession().then((s) => {
      if (mounted) {
        setSession(s);
        setAuthLoading(false);
      }
    });
    const unsub = authService.onAuthChange((s) => {
      setSession(s);
      setAuthLoading(false);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("asha_theme", theme);
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const refreshChats = useCallback(async () => {
    if (!session?.id) return;
    setChats(await db.listChats(session.id));
  }, [session?.id]);

  useEffect(() => {
    if (session?.id) refreshChats();
    else setChats([]);
  }, [session?.id, refreshChats]);

  const refreshSurveys = useCallback(async () => {
    if (!session?.id) return;
    setSurveys(await db.listSurveys(session.id));
  }, [session?.id]);

  useEffect(() => {
    if (session?.id) refreshSurveys();
    else setSurveys([]);
  }, [session?.id, refreshSurveys]);

  // Local-only list updates — avoids a full DB refetch just to reorder or
  // rename a chat in the sidebar; the source of truth is still Supabase,
  // this just keeps the UI snappy in between.
  const addChatToList = useCallback((chat) => {
    setChats((prev) => [chat, ...prev]);
  }, []);

  const upsertChatMeta = useCallback((chatId, patch) => {
    setChats((prev) => {
      const existing = prev.find((c) => c.id === chatId);
      if (!existing) return prev;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      return [updated, ...prev.filter((c) => c.id !== chatId)];
    });
  }, []);

  const removeChatFromList = useCallback((chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  }, []);

  // Called right after db.createSurvey() succeeds, so the badge appears
  // immediately without waiting on a refetch.
  const addSurveyToList = useCallback((survey) => {
    setSurveys((prev) => [survey, ...prev]);
  }, []);

  const markSurveySeen = useCallback(async (surveyId) => {
    await db.markSurveySeen(surveyId);
    setSurveys((prev) =>
      prev.map((s) => (s.id === surveyId ? { ...s, seenAt: s.seenAt || new Date().toISOString() } : s))
    );
  }, []);

  const unseenSurveyCount = surveys.filter((s) => !s.seenAt).length;

  const addSheetToList = useCallback((sheet) => {
    setSheets((prev) => [sheet, ...prev]);
  }, []);

  const updateSheetInList = useCallback((sheetId, patch) => {
    setSheets((prev) => prev.map((s) => (s.id === sheetId ? { ...s, ...patch } : s)));
  }, []);

  const removeSheetFromList = useCallback((sheetId) => {
    setSheets((prev) => prev.filter((s) => s.id !== sheetId));
  }, []);

  const signInWithGoogle = useCallback(() => authService.signInWithGoogle(), []);

  const completeOnboarding = useCallback(async (patch) => {
    const s = await authService.updateProfile({ ...patch, onboarded: true });
    setSession(s);
    return s;
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const s = await authService.updateProfile(patch);
    setSession(s);
    return s;
  }, []);

  const refreshSession = useCallback(async () => {
    const s = await authService.refreshSession();
    setSession(s);
    return s;
  }, []);

  const acceptTerms = useCallback(async () => {
    const s = await authService.acceptTerms();
    setSession(s);
    return s;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await authService.deleteAccount();
    setSession(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        session,
        authLoading,
        theme,
        setTheme,
        signInWithGoogle,
        completeOnboarding,
        updateProfile,
        refreshSession,
        acceptTerms,
        signOut,
        deleteAccount,
        chats,
        refreshChats,
        addChatToList,
        upsertChatMeta,
        removeChatFromList,
        surveys,
        refreshSurveys,
        addSurveyToList,
        markSurveySeen,
        unseenSurveyCount,
        sheets,
        refreshSheets,
        addSheetToList,
        updateSheetInList,
        removeSheetFromList,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}