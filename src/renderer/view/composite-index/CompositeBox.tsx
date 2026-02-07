import styled from 'styled-components';
import { CompositeData } from '../../../types';
import { getColorByStatus } from '../../utils/color';

const Wrapper = styled.div<{color: string}>`
    color: ${({ color }) => color};
    font-weight: bold;
    min-width: 0;
    flex: 0 0 120px;
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    .name {
        color: #333;
        font-size: 12px;
    }
    .count {
        font-size: 18px;
    }
    .change {
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
`;

interface Props extends CompositeData {

}

export function CompositeBox(props: Props) {

    const color = getColorByStatus(props.status);
    return <Wrapper color={color}>
        <div className='name'>{props.name}</div>
        <div className='count'>{props.price}</div>
        <div className='change'>
            <span>{props.change}</span>
            <span>{props.ratio}</span>
        </div>
    </Wrapper>;
}