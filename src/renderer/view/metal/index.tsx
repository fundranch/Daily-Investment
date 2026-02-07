import styled from 'styled-components';
import { useEffect } from 'react';
import { useMetalStore } from '../../store/metal';
import { MetalItem } from './MetalItem';

const Wrapper = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    overflow-x: auto;
    gap: 15px;
    &::-webkit-scrollbar {
        height: 0;
    }
`;

export function Metal() {
    const setMetalData = useMetalStore(state => state.setData);
    useEffect(() => {
        window.electron.ipcRenderer.on('metal-data-update', (data) => {
            setMetalData(data as any);
        });
    }, []);
    return <Wrapper>
        <MetalItem type='au' />
        <MetalItem type='aum' />
        <MetalItem type='ag' />
    </Wrapper>;
}