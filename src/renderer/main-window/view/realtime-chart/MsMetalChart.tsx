import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Tag } from 'antd';
import { useMetalStore } from '../../store/metal';
import { getBaseOptions } from './options';
import { useResizeObserverDebounce } from '../../hooks/useResizeObserverDebounce';

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

export function MsMetalCharts() {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const chart = useRef<echarts.ECharts>(null);

    function calcYAxisSide(num: number, mathType: 'ceil' | 'floor') {
        return Math[mathType](num / 10) * 10;
    }

    const storeData = useMetalStore(state => state.data.aums);

    useEffect(() => {
        let min = Number.MAX_SAFE_INTEGER;
        let max = 0;
        const chartData: any = storeData?.chartData.map((i: any) => {
            const [date] = i.value;
            const price = Number(i.value[1]);
            if(price !== -1) {
                if(price > max) {
                    max = price;
                }
                if(price < min) {
                    min = price;
                }
            }
            return [new Date(date), price === -1 ? null : price];
        });
        const padding = (max - min) * 0.5;
        let yAxis: Record<string, number> = {};
        if(chartData?.length) {
            yAxis = {
                min: calcYAxisSide(min - padding, 'floor'),
                max: calcYAxisSide(max + padding, 'ceil')
            };
        }
        chart.current?.setOption({
            yAxis: { ...yAxis },
            series: [{ name: 'realtime-line', data: chartData || [] }]
        });
    }, [storeData?.chartData]);

    useEffect(() => {
        chart.current = echarts.init(wrapperRef.current!);
        chart.current!.setOption(getBaseOptions());
    }, []);

    useResizeObserverDebounce(wrapperRef, () => {
        chart.current?.resize();
    });

    function getTitle() {
        return '民生黄金实时价';
    }

    return <Wrapper>
        <div className='title'>
            {getTitle()}
            {storeData?.isClose && <Tag color='#108ee9' variant='filled'>休市中</Tag>}
        </div>
        <div className='chart' ref={wrapperRef} />
    </Wrapper>;
}