import { create } from 'zustand';
import { CompositeData } from '../../../types';

export interface CompositeStore {
    data: CompositeData[]
    setData: (p: CompositeData[]) => void
}

export const useCompositeStore = create<CompositeStore>((set, get) => ({
    data: [],
    setData(data) {
        set({ data });
    }
}));