import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
export interface StorySlide {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  filter?: string;
  caption?: string;
  createdAt: string;
}
export interface StoryGroup {
  userId: string;
  userName: string;
  avatar?: string;
  slides: StorySlide[];
  seen: boolean;
}
interface Context {
  groups: StoryGroup[];
  addStory: (
    slide: Omit<StorySlide, "id" | "createdAt">,
    meta: { userId: string; userName: string; avatar?: string },
  ) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  markSeen: (id: string) => void;
  refreshFromFeed: (authors?: unknown[]) => void;
}
const StoriesContext = createContext<Context | undefined>(undefined);
export const StoriesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const seen = useRef(new Set<string>());
  const refresh = useCallback(async () => {
    if (!user) {
      setGroups([]);
      return;
    }
    const { data } = await api.get("/social/historias");
    const map = new Map<string, StoryGroup>();
    for (const row of data.data) {
      let g = map.get(row.userId);
      if (!g) {
        g = {
          userId: row.userId,
          userName: row.userName,
          avatar: row.avatar || undefined,
          slides: [],
          seen: true,
        };
        map.set(row.userId, g);
      }
      g.slides.push(row);
      if (!seen.current.has(row.id)) g.seen = false;
    }
    setGroups([...map.values()]);
  }, [user?.id]);
  useEffect(() => {
    seen.current.clear();
    setGroups([]);
    refresh().catch(() => {});
    const timer = setInterval(() => refresh().catch(() => {}), 60000);
    return () => clearInterval(timer);
  }, [refresh]);
  const addStory = useCallback(
    async (slide: Omit<StorySlide, "id" | "createdAt">) => {
      await api.post("/social/historias", slide);
      await refresh();
    },
    [refresh],
  );
  const deleteStory = useCallback(async (id: string) => {
    await api.delete("/social/historias/" + id);
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, slides: g.slides.filter((s) => s.id !== id) }))
        .filter((g) => g.slides.length),
    );
  }, []);
  const markSeen = useCallback((id: string) => {
    setGroups((prev) => {
      const group = prev.find((g) => g.userId === id);
      if (!group || group.seen) return prev;
      group.slides.forEach((s) => seen.current.add(s.id));
      return prev.map((g) => (g.userId === id ? { ...g, seen: true } : g));
    });
  }, []);
  return (
    <StoriesContext.Provider
      value={{
        groups,
        addStory,
        deleteStory,
        markSeen,
        refreshFromFeed: () => {
          refresh().catch(() => {});
        },
      }}
    >
      {children}
    </StoriesContext.Provider>
  );
};
export function useStories() {
  const ctx = useContext(StoriesContext);
  if (!ctx) throw Error("StoriesProvider");
  return ctx;
}
