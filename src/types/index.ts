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
    holdFunds: number[]
    optionalFunds: number[]
}