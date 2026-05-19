import { create } from 'zustand';

import { saveHotspot, getHotspotsByDoc } from './db';

export type Hotspot = {
  id: string;
  pdf_id: string; // Added to match DB schema
  page: number;
  shape: {
    type: "circle";
    cx: number; // normalized (0–1)
    cy: number;
    r: number;
  };
  text?: string; // extracted context
  question?: string;
  answer?: string;
  createdAt: number;
};

interface HotspotState {
  docId: string | null;
  hotspots: Hotspot[];
  activeHotspotId: string | null;
  mode: "read" | "mark";
  chatOpen: boolean;
  
  // Actions
  setDocId: (id: string) => void;
  loadHotspots: (docId: string) => Promise<void>;
  addHotspot: (hotspot: Hotspot) => void;
  removeHotspot: (id: string) => void;
  setActiveHotspot: (id: string | null) => void;
  setMode: (mode: "read" | "mark") => void;
  setChatOpen: (open: boolean) => void;
  updateHotspot: (id: string, updates: Partial<Hotspot>) => void;
}

export const useHotspotStore = create<HotspotState>((set, get) => ({
  docId: null,
  hotspots: [],
  activeHotspotId: null,
  mode: "read",
  chatOpen: false,

  setDocId: (id) => set({ docId: id }),

  loadHotspots: async (docId) => {
    const hotspots = await getHotspotsByDoc(docId);
    set({ hotspots: hotspots.map(h => ({ ...h, createdAt: h.created_at })) as unknown as Hotspot[] });
  },

  addHotspot: (hotspot) => {
    set((state) => ({ 
      hotspots: [...state.hotspots, hotspot] 
    }));
    const { createdAt, ...rest } = hotspot;
    saveHotspot({
      ...rest,
      created_at: createdAt,
      pdf_id: get().docId || ''
    });
  },
  
  removeHotspot: (id) => {
    set((state) => ({ 
      hotspots: state.hotspots.filter(h => h.id !== id) 
    }));
    // Note: In a real app we'd also delete from DB
  },
  
  setActiveHotspot: (id) => set({ activeHotspotId: id }),
  
  setMode: (mode) => set({ mode }),
  
  setChatOpen: (open) => set({ chatOpen: open }),
  
  updateHotspot: (id, updates) => set((state) => ({
    hotspots: state.hotspots.map(h => h.id === id ? { ...h, ...updates } : h)
  })),
}));
