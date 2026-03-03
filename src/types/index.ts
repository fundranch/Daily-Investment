export interface CompositeData {
    name: string
    code: string
    price: string
    ratio: string
    status: -1 | 0 | 1
    change: string
}

export interface MetalItemData extends CompositeData {
    max?: string
    min?: string
    yEnd?: string
    isClose: boolean
    chartData?: any
}

export type MetalType = 'au' | 'ag' | 'aum' | 'aums'
export type MetalData = Record<MetalType, MetalItemData>


// 记录消息数据格式
export interface NotificationData {
    code: string
    name: string
    type: 'timer' | 'amplitude' // 定时器 或者 震幅 模式
    timer?: number // 定时器时间
    threshold: number
}

export interface StorageData {
    interval: number
    fundSource: 0 | 1 // 全局数据源
    watcher: {
        open: boolean
        metal: MetalType[] // 有色盯盘项
        fund: string[] // 基金盯盘项
        opacity: number // 透明度
    }
    notifies: NotificationData[]
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