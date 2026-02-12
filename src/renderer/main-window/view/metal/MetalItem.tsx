import styled from 'styled-components';
import { GoldTwoTone } from '@ant-design/icons';
import { shallow } from 'zustand/shallow';
import { Tag } from 'antd';
import { useMetalStore } from '../../store/metal';
import { getColorByStatus } from '../../utils/color';
import { useChartStore } from '../../store/chart';

interface Props {
    type: 'au' | 'ag' | 'aum' | 'aums'
}

const Wrapper = styled.div<{color: string}>`
    cursor: pointer;
    height: 100%;
    min-width: 220px;
    flex: 1 0 220px;
    overflow: hidden;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    position: relative;
    .anticon {
        position: absolute;
        font-size: 160px;
        margin-right: 10px;
        right: -20px;
        bottom: -20px;
        z-index: 10;
        opacity: 0.08;
        filter: blur(1.5px);
    }
    .name, .body, .bottom {
        z-index: 100;
    }
    .name {
        flex: 0;
        color: #333;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        .ant-tag {
            font-size: 10px !important;
            padding: 0px 4px;
        }
    }
    .body {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 4px;
        color: ${({ color }) => color};
        align-items: baseline;
        .price {
            font-size: 22px;
        }
        .ratio, .change {
            font-size: 12px;
            justify-self: flex-end;
        }
    }
    .bottom {
        flex: 0;
        display: flex;
        gap: 4px;
        justify-content: flex-start;
        align-items: center;
        font-size: 12px;
        div {
            flex: 1;
            color: #949494;
            span {
                padding-left: 4px;
            }
        }
    }
`;

export function MetalItem(props: Props) {
    const metalData = useMetalStore(state => state.data[props.type]);
    const color = getColorByStatus(metalData?.status);

    const chartType = useChartStore(state => state.type + state.key);
    const setChartType = useChartStore(state => state.setConfig);

    function handleSelectMetal() {
        if(chartType === `metal${props.type}`) return;
        window.electron.ipcRenderer.sendMessage('select-chart-type', { type: 'metal', key: props.type });
        setChartType('metal', props.type);
    }

    return <Wrapper className='box' color={color} onClick={handleSelectMetal}>
        <GoldTwoTone twoToneColor={ props.type !== 'ag' ? '#fb944a' : '#959595'} />
        <div className='name'>
            {metalData?.name || '--'}
            {metalData?.isClose && <Tag color='#108ee9' variant='filled'>休市中</Tag>}
        </div>
        <div className='body'>
            <div className='price'>{metalData?.price || '--'}</div>
            <div className='ratio'>{metalData?.ratio || '--'}</div>
            <div className='change'>{metalData?.change || '--'}</div>
        </div>
        {/* <div className='bottom'>
            <div>最高<span style={{ color: maxColor }}>{metalData?.max || '--'}</span></div>
            <div>最低<span style={{ color: minColor }}>{metalData?.min || '--'}</span></div>
        </div> */}
    </Wrapper>;
}