export interface CompositeData {
    name: string
    code: string
    price: string
    ratio: string
    status: -1 | 0 | 1
    change: string
}

export interface MetalItemData extends CompositeData {
    max: string
    min: string
    yEnd: string
    isClose: boolean
}

export type MetalData = Record<'au' | 'ag' | 'aum', MetalItemData>

export interface StorageData {
    interval: number
    fundSource: 0 | 1 // 全局数据源
    holdFundsSource: Record<string, 0 | 1>
    selfSelectedFundsSource: Record<string, 0 | 1>
}


export interface BaseFundData {
    key: number;
    code: string
    name: string;
    netTime: string
    estimateTime: string
    weight: number
    estimateChange: string // 预估涨跌幅
    net: string // 净值
    estimateNet: string // 预估净值
    status: 0 | 1 | -1
    updateTime: string
}