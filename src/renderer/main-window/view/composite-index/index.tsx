import { useEffect } from 'react';
import styled from 'styled-components';
import { useCompositeStore } from '../../store/composite';
import { CompositeBox } from './CompositeBox';

const Wrapper = styled.div`
    width: 100%;
    height: 100%;
    padding-inline: 8px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    overflow: auto hidden;
    gap: 8px;
     &::-webkit-scrollbar {
        height: 0;
    }
    .split-line {
        background-color: #f4f4f4;
        flex: 0 0 1px;
        height: 60px;
    }
`;

export function CompositeIndex() {
    const setCompositeData = useCompositeStore(state => state.setData);
    const compositeData = useCompositeStore(state => state.data);
    useEffect(() => {
        window.electron.ipcRenderer.on('composite-data-update', (data) => {
            setCompositeData(data as any);
        });
    }, []);
    return <Wrapper className='box'>
        {compositeData.map((i, index) => <>
            <CompositeBox key={i.code} {...i} />
            {index !== compositeData.length - 1 && <div className='split-line' />}
        </>)}
    </Wrapper>;
}