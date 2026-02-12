import { create } from 'zustand';
import { BaseFundData } from '../../../types';

export interface SelfSelectedFund extends BaseFundData {
    added_nav: string
    isHold: boolean
}

export interface HoldFund extends BaseFundData {
    todayProfit: number // 当日涨幅
    invested_amount: number
    total_profit: number
}

export interface FundStore {
    selfSelectedFunds: SelfSelectedFund[]
    setSelfSelectedFunds: (p: SelfSelectedFund[]) => void
    holdFunds: HoldFund[]
    setHoldFunds: (p: HoldFund[]) => void
}

export const useFundStore = create<FundStore>((set, get) => ({
    selfSelectedFunds: [],
    setSelfSelectedFunds(data) {
        set({ selfSelectedFunds: data });
    },
    holdFunds: [],
    setHoldFunds(data) {
        set({ holdFunds: data });
    }
}));