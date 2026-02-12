import styled from 'styled-components';
import { MetalCharts } from './MetalChart';
import { useChartStore } from '../../store/chart';
import { MsMetalCharts } from './MsMetalChart';

const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    &>div {
        height: 100%;
        width: 100%;
    }
`;

export function RealTimeChart() {
    const chartType = useChartStore(state => state.key);
    return <Wrapper className="box">
        {chartType === 'aums' ? <MsMetalCharts /> : <MetalCharts />}
    </Wrapper>;
}