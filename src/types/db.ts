export interface SelfSelectedFundDb {
    name: string
    code: string
    weight: number // 权重
    added_at: number // 自选时间
    added_nav: number // 自选净值
}

export interface HoldFundDb {
    name: string
    code: string
    weight: number // 权重
    added_at: number // 持有时间
    invested_amount: number // 持有金额
    total_profit: number // 持有总收益
    net: number // 最新净值
    total_profit_update: number // 持有收益更新时间
}