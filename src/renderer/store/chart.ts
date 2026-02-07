import { create } from 'zustand';

export interface MetalStore {
    type: 'metal' | 'fund'
    key: string
    setConfig: (type: 'metal' | 'fund', key: string) => void
}

export const useChartStore = create<MetalStore>((set, get) => ({
    type: 'metal' as const,
    key: '',
    setConfig(type, key) {
        set({ type, key });
    }
}));