import styled from 'styled-components';
import { COLORS, getColorByStatus } from '../../../utils/color';

interface Props {
    value: string
    time: string
    status: 0 | -1 | 1
    resetColor?: boolean
}

const Wrapper = styled.div`
    text-align: right;
    .value {
        font-size: 11px;
    }
    .time {
        font-size: 8px;
        color: #6f6f6f;
    }
`;

export function ValueColumns(props: Props) {
    return <Wrapper>
        <div className="value" style={{ color: props.resetColor ? COLORS.tie : getColorByStatus(props.status) }}>{props.value}</div>
        <div className="time">{props.time}</div>
    </Wrapper>;
}