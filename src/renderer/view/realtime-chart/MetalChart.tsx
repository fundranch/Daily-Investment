import * as echarts from 'echarts';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { debounce } from 'lodash';
import { Tag } from 'antd';
import { COLORS } from '../../utils/color';
import { useMetalStore } from '../../store/metal';

const Wrapper = styled.div`
    width: 100%;
    height: 100%;
    padding: 10px;
    .title {
        color: #333;
        height: 30px;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        .ant-tag {
            font-size: 10px !important;
            padding: 0px 4px;
        }
    }
    .chart {
        height: calc(100% - 30px);
    }
`;

export function MetalCharts() {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const chart = useRef<echarts.ECharts>(null);
    const observer = useRef<ResizeObserver>(null);

    const [type, setType] = useState<'au' | 'ag' | 'aum'>();

    function getOptions() {
        const options: echarts.EChartOption = {
            xAxis: {
                type: 'time',
                boundaryGap: false,
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
                left: 25,
                right: 25
            },
            series: [
                {
                    name: 'realtime-line',
                    data: [],
                    type: 'line',
                    lineStyle: {
                        color: '#ed9857',
                        width: 0.8
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

    function calcYAxisSide(num: number, mathType: 'ceil' | 'floor') {
        return Math[mathType](num / 10) * 10;
    }

    function initUpdateListener() {
        window.electron.ipcRenderer.on('chart-data-update', (data: any) => {
            let min = Number.MAX_SAFE_INTEGER;
            let max = 0;
            const chartData: any = data.data.map((i: any) => {
                if(i.price !== -1) {
                    if(i.price > max) {
                        max = i.price;
                    }
                    if(i.price < min) {
                        min = i.price;
                    }
                }
                return [new Date(i.date), i.price === -1 ? null : i.price];
            });
            const padding = (max - min) * 0.5;
            chart.current?.setOption({
                yAxis: {
                    min: calcYAxisSide(min - padding, 'floor'),
                    max: calcYAxisSide(max + padding, 'ceil')
                },
                series: [{ name: 'realtime-line', data: chartData || [] }]
            });
            setType(data.key);
        });
    }

    useEffect(() => {
        chart.current = echarts.init(wrapperRef.current!);
        chart.current!.setOption(getOptions());
        const resize = debounce(() => { chart.current?.resize(); }, 100);
        observer.current = new ResizeObserver(() => {
            resize();
        });
        observer.current.observe(wrapperRef.current!);
        initUpdateListener();
        return () => {
            observer.current?.disconnect();
        };
    }, []);

    function getTitle() {
        let name = '';
        if(type === 'ag') {
            name = '现货白银';
        } else if(type === 'au') {
            name = '现货黄金';
        } else if(type === 'aum') {
            name = '沪金';
        }
        return `${name}实时价`;
    }

    const metalData = useMetalStore(state => state.data);
    const isClose = type ? metalData[type]?.isClose : false;

    return <Wrapper>
        <div className='title'>
            {getTitle()}
            {isClose && <Tag color='#108ee9' variant='filled'>休市中</Tag>}
        </div>
        <div className='chart' ref={wrapperRef} />
    </Wrapper>;
}