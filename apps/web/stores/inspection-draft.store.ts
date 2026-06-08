import { create } from "zustand";

export interface PhotoSlot {
  localId: string;
  photoAngle: "FRONT" | "BACK" | "LEFT" | "RIGHT" | "INTERIOR" | "SERIAL" | "OTHER";
  previewUrl?: string; // object URL for local display
  status: "QUEUED" | "UPLOADING" | "UPLOADED" | "FAILED";
  progress?: number;
}

interface InspectionDraftState {
  step: number;
  localId: string | null;
  containerId: string;
  inspectionType: "ARRIVAL" | "DEPARTURE" | "PERIODIC";
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  photos: Record<string, PhotoSlot>; // keyed by photoAngle
  initDraft: () => void;
  setDraftInfo: (info: Partial<Omit<InspectionDraftState, "photos" | "initDraft" | "setDraftInfo">>) => void;
  setPhotoSlot: (angle: string, slot: Partial<PhotoSlot>) => void;
  clearPhotoSlot: (angle: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetDraft: () => void;
}

export const useInspectionDraftStore = create<InspectionDraftState>((set) => ({
  step: 1,
  localId: null,
  containerId: "",
  inspectionType: "ARRIVAL",
  locationName: "",
  latitude: null,
  longitude: null,
  notes: "",
  photos: {},

  initDraft: () => {
    set({
      step: 1,
      localId: `local_${Date.now()}_${Math.random().toString(36).substring(4)}`,
      containerId: "",
      inspectionType: "ARRIVAL",
      locationName: "",
      latitude: null,
      longitude: null,
      notes: "",
      photos: {},
    });
  },

  setDraftInfo: (info) => set((state) => ({ ...state, ...info })),

  setPhotoSlot: (angle, slot) =>
    set((state) => ({
      photos: {
        ...state.photos,
        [angle]: {
          ...state.photos[angle],
          ...slot,
        } as PhotoSlot,
      },
    })),

  clearPhotoSlot: (angle) =>
    set((state) => {
      const newPhotos = { ...state.photos };
      delete newPhotos[angle];
      return { photos: newPhotos };
    }),

  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  resetDraft: () =>
    set({
      step: 1,
      localId: null,
      containerId: "",
      inspectionType: "ARRIVAL",
      locationName: "",
      latitude: null,
      longitude: null,
      notes: "",
      photos: {},
    }),
}));
