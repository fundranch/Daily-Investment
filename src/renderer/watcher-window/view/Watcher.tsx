import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useConfigStore } from '../store/config';
import { BaseFundData, MetalData, MetalType } from '../../../types';
import { getColorByStatus } from '../../main-window/utils/color';
// import { useFundStore } from '../../main-window/store/fund';

const Wrapper = styled.div` 
    padding-inline: 10px;
    .metal-item {
        display: grid;
        grid-template-columns: 2fr 1fr 60px;
        grid-template-rows: 40px;
        align-items: center;
        gap: 20px;
    }
    .fund-item {
        display: grid;
        grid-template-columns: 2fr 60px;
        grid-template-rows: 40px;
        align-items: center;
        gap: 20px;
    }
    .metal-item, .fund-item {
        .name {
            white-space: nowrap;
            font-size: 13px;
            font-weight: 800;
            color: #333;
            text-overflow: ellipsis;
            overflow: hidden;
        }
        .price, .ratio, .change {
            justify-self: flex-end;
            font-size: 14px;
            font-weight: 800;
        }
    }
`;

export function Watcher() {
    const watchList = useConfigStore(useShallow(state => ({
        metal: state.data.watcher?.metal,
        fund: state.data.watcher?.fund
    })));
    const [metalData, setMetalData] = useState<MetalData>();

    const [fundData, setFundData] = useState<Partial<BaseFundData>[]>([]);
    useEffect(() => {
        window.electron.ipcRenderer.on('metal-data-update', (metal: any) => {
            setMetalData(metal);
        });
        window.electron.ipcRenderer.on('self-selected-fund-update', (data: any) => {
            updateFundData(data);
        });
        window.electron.ipcRenderer.on('hold-fund-update', (data: any) => {
            updateFundData(data);
        });
    }, []);

    function updateFundData(data: any[]) {
        setFundData(state => {
            return state.map(i => {
                const target = data.find(c => c.code === i.code);
                if(!target) return i;
                return {
                    ...i,
                    name: target.name,
                    estimateChange: target.estimateChange,
                    status: target.status
                };
            });
        });
    }

    useEffect(() => {
        setFundData(watchList.fund?.map(code => ({
            code,
            name: '--',
            estimateChange: '--',
            status: 0
        })) || []);
    }, [watchList.fund]);

    return <Wrapper>
        {
            watchList?.metal?.map((i) => {
                const value = metalData?.[i];
                return value && (<div className='metal-item' style={{ color: getColorByStatus(value.status) }}>
                    <div className='name'>{value.name}</div>
                    <div className='price'>{value.price}</div>
                    <div className='ratio'>{value.ratio}</div>
                </div>);
            })
        }
        {
            fundData.map(i => (
                <div className='fund-item' key={i.code}>
                    <div className='name'>{i.name}</div>
                    <div className='change' style={{ color: getColorByStatus(i.status!) }}>{i.estimateChange}</div>
                </div>
            ))
        }
    </Wrapper>;
}