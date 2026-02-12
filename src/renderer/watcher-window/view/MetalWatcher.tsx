import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { useConfigStore } from '../store/config';
import { MetalData, MetalType } from '../../../types';
import { getColorByStatus } from '../../main-window/utils/color';

const Wrapper = styled.div` 
    padding-inline: 10px;
    .metal-item {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        grid-template-rows: 40px;
        align-items: center;
        gap: 20px;
        .name {
            font-size: 13px;
            font-weight: 800;
            color: #333;
        }
        .price, .ratio {
            justify-self: flex-end;
            font-size: 14px;
            font-weight: 800;
        }
    }
`;

export function MetalWatcher() {
    const watchMetalList = useConfigStore(state => state.data.watcher?.metal);
    const [data, setData] = useState<MetalData>();
    useEffect(() => {
        window.electron.ipcRenderer.on('metal-data-update', (metal: any) => {
            setData(metal);
        });
    }, []);

    const keys: MetalType[] = ['aums'];

    return <Wrapper>
        {
            keys.map((i) => {
                const value = data?.[i];
                return value && (<div className='metal-item' style={{ color: getColorByStatus(value.status) }}>
                    <div className='name'>{value.name}</div>
                    <div className='price'>{value.price}</div>
                    <div className='ratio'>{value.ratio}</div>
                </div>);
            })
        }
    </Wrapper>;
}