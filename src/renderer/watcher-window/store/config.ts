import { create } from 'zustand';
import { StorageData } from '../../../types';

export interface StorageStore {
    data: StorageData
    setData: (p: StorageData) => void
}

export const useConfigStore = create<StorageStore>((set, get) => ({
    data: {} as any,
    setData(data) {
        set({ data });
    }
}));