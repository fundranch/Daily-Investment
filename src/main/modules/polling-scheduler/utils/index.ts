import { BaseFundData } from '../../../../types';

export function handleMetalApiData(target: string) {
    const data = `{${target.replace(/^var .* = {/, '')}`;
    return JSON.parse(data);
}

export function digitLength(num: number) {
    return Math.abs(num).toString().split('.')[0].length;
}

// 2026-02-09|2.2930|2.2930|0.0380|1.66%|1.42%|0.0325|2.3255|2.2550|2026-02-10|15:00:00
// 处理数据源1的基金数据
export async function handleFundEstimateDataSource_0(target: Response): Promise<Partial<BaseFundData> | null> {
    try {
        const text = await target.text();
        const split = text.split('|');
        return {
            netTime: split[0], // 最新净值时间
            net: split[1], // 最新净值
            estimateNet: split[7], // 预估净值
            estimateChange: split[5], // 预估涨跌幅
            estimateTime: split[9],
            updateTime: split[10]
        };
    } catch(e) {
        return null;
    }
}

// 处理数据源2的基金数据
export function handleFundEstimateDataSource_1() {
    return null;
}

// 获取状态
export function getFundStatus(estimate: any, latest: any): -1 | 0 | 1 {
    if(Number(estimate) - Number(latest) < 0) {
        return -1;
    }
    if(Number(estimate) - Number(latest) > 0) {
        return 1;
    }
    return 0;
}