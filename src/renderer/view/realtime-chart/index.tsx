import styled from 'styled-components';
import { MetalCharts } from './MetalChart';

const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    &>div {
        height: 100%;
        width: 100%;
    }
`;

export function RealTimeChart() {
    return <Wrapper className="box">
        <MetalCharts />
    </Wrapper>;
}