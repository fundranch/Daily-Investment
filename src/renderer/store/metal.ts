import { create } from 'zustand';
import { MetalData } from '../../types';

export interface MetalStore {
    data: MetalData
    setData: (p: MetalData) => void
}

export const useMetalStore = create<MetalStore>((set, get) => ({
    data: {} as any,
    setData(data) {
        set({ data });
    }
}));