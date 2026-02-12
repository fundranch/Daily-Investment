import styled from 'styled-components';
import './App.css';
import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { Title } from './view/title';
import { CompositeIndex } from './view/composite-index';
import { Fund } from './view/fund';
import { Metal } from './view/metal';
import { RealTimeChart } from './view/realtime-chart';
import { useConfigStore } from './store/config';

const Wrapper = styled.div`
    padding: 15px 30px;
    background-color: #eeedf2;
    height: 100%;
    overflow-y: scroll;
    .main-body {
        display: grid;
        height: calc(100% - 32px - 20px);
        grid-template-columns: 3fr 2fr;
        gap: 15px;
        overflow-y: auto;
        .left, .right {
            height: 100%;
            min-width: 0;
            min-height: 700px;
        }
        .left {
            display: grid;
            gap: 15px;
            grid-template-columns: 100%;
            grid-template-rows: 100px 100px 1fr;
        }
    }
`;

export default function App() {
    const setConfigData = useConfigStore(state => state.setData);
    useEffect(() => {
        window.electron.ipcRenderer.sendMessage('refresh-polling');
        window.electron.ipcRenderer.invoke('get-setting-data').then((data) => {
            setConfigData(data);
        }).catch((e) => { console.error(e); });

        return () => {
            // pollingScheduler.stop();
        };
    }, []);
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#ff4144',
                },
                components: {
                    Menu: {
                        itemHeight: 30,
                        itemBorderRadius: 5,
                        iconSize: 12,
                        itemColor: '#333'
                    },
                    Form: {
                        labelFontSize: 11,
                        labelColor: '#333'
                    },
                    Select: {
                        optionFontSize: 12,
                        optionHeight: 24,
                        optionPadding: '4px 10px'
                    },
                    Tabs: {
                        horizontalItemGutter: 15
                    },
                    Table: {
                        headerBg: '#fff',
                        headerColor: '#aeaeae',
                        cellFontSizeSM: 10
                    }
                }
            }}
        >
            <Wrapper>
                <Title />
                <div className='main-body'>
                    <div className='left'>
                        <CompositeIndex />
                        <Metal />
                        <RealTimeChart />
                    </div>
                    <div className='right'>
                        <Fund />
                    </div>
                </div>
            </Wrapper>
        </ConfigProvider>
        
    );
}
