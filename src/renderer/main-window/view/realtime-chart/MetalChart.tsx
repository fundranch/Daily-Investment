import * as echarts from 'echarts';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { debounce } from 'lodash';
import { Tag } from 'antd';
import { COLORS } from '../../utils/color';
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

export function MetalCharts() {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const chart = useRef<echarts.ECharts>(null);

    const [type, setType] = useState<'au' | 'ag' | 'aum'>();

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
        chart.current!.setOption(getBaseOptions());
        initUpdateListener();
    }, []);

    useResizeObserverDebounce(wrapperRef, () => {
        chart.current?.resize();
    });

    function getTitle() {
        let name = '';
        if(type === 'ag') {
            name = '现货白银';
        } else if(type === 'au') {
            name = '现货黄金';
        } else if(type === 'aum') {
            name = '沪金';
        } else if(type === 'aums') {
            name = '民生黄金';
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