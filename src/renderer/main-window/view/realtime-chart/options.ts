import dayjs from 'dayjs';
import * as echarts from 'echarts';
import { COLORS } from '../../utils/color';

export function getBaseOptions() {
    const options: echarts.EChartOption = {
        xAxis: {
            type: 'time',
            splitNumber: 5,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#f5f5f5' } },
            axisLabel: { 
                color: '#c9c9c9',
                fontSize: 10,
                formatter: (data: number) => dayjs(data).format('HH:mm')
            }
        },
        tooltip: {
            axisPointer: {
                lineStyle: {
                    color: '#edb357'
                }
            },
            trigger: 'axis',
            backgroundColor: '#fb944a',
            borderWidth: 0,
            textStyle: {
                color: '#fff',
                fontSize: 10
            },
            formatter: (obj: any) => {
                const time = obj[0].axisValueLabel;
                const value = obj[0].data[1];
                const handleValue = value || '--';
                return `${time}<br />实时金价 ${handleValue}`;
            }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f5f5f5' } },
            axisLabel: { color: '#c9c9c9', fontSize: 10 }
        } as any,
        grid: {
            top: 20,
            bottom: 20,
            left: 40,
            right: 40
        },
        series: [
            {
                name: 'realtime-line',
                data: [],
                type: 'line',
                lineStyle: {
                    color: '#ed9857',
                    width: 1
                },
                areaStyle: {
                    opacity: 0.2,
                    color: '#edb357'
                },
                itemStyle: { opacity: 0 },
                markPoint: {
                    symbol: 'rect',
                    symbolSize: (value: number) => [String(value).length * 6, 15],
                    label: {
                        fontSize: 10,
                        color: '#fff',
                        fontWeight: 900
                    },
                    data: [
                        {
                            name: 'min',
                            type: 'min',
                            itemStyle: {
                                color: COLORS.lose
                            },
                            symbolOffset: ['50%', '100%']
                        },
                        { 
                            name: 'max',
                            type: 'max',
                            itemStyle: {
                                color: COLORS.win
                            },
                            symbolOffset: ['50%', '-100%']
                        }
                    ] as any,
                }
            }
        ]
    };
    return options;
}