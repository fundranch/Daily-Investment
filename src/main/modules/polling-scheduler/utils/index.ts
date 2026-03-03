import dayjs from 'dayjs';
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
        const netTime = split[0];
        const net = split[1];
        const estimateTime = split[9];
        const estimateNet = netTime === estimateTime ? net : split[7];
        const estimateChange = netTime === estimateTime ? split[4] : split[5];
        return {
            netTime, // 最新净值时间
            net, // 最新净值
            estimateNet, // 预估净值
            estimateChange, // 预估涨跌幅
            estimateTime,
            updateTime: split[10]
        };
    } catch(e) {
        return null;
    }
}

// 处理数据源2的基金数据
export async function handleFundEstimateDataSource_1(target: Response) : Promise<Partial<BaseFundData> | null>  {
    try {
        const text = await target.text();
        // {"fundcode":"012886","name":"华夏中证光伏产业ETF发起式联接C","jzrq":"2026-02-10","dwjz":"0.7028","gsz":"0.6963","gszzl":"-0.93","gztime":"2026-02-11 15:00"}
        const json = text.match(/^jsonpgz\((.*)\);$/)?.[1];
        if(!json) return null;
        const data = JSON.parse(json);
        const timeSplit = data.gztime.split(' ');
        return {
            netTime: data.jzrq, // 最新净值时间
            net: data.dwjz, // 最新净值
            estimateNet: data.gsz, // 预估净值
            estimateChange: `${data.gszzl}%`, // 预估涨跌幅
            estimateTime: timeSplit[0],
            updateTime: timeSplit[1]
        };
    } catch(e) {
        console.log('eeeee', e);
        return null;
    }
}

// 数据修正，主要用于天天基金网估算净值延后导致数据推迟的问题
export function correctNetData(
    data: Partial<BaseFundData> | null,
    correct?: {code: string, net: string, time: string, change: string}
): Partial<BaseFundData> {
    if(!data || !correct) return data!;
    if(dayjs(data.estimateTime).isAfter(dayjs(correct.time), 'day')) return data;
    return {
        ...data,
        netTime: correct.time,
        net: String(correct.net),
        estimateNet: String(correct.net),
        estimateTime: correct.time,
        updateTime: '15:00',
        estimateChange: correct.change
    };
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

export function toFixed(num: string | number, fixTo = 2) {
    const fix = Number(Array.from({ length: fixTo }).reduce<string>((pre, i) => `${pre}0`, '1'));
    return Math.round(Number(num) * fix) / fix;
}