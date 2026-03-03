import styled from 'styled-components';
import './App.css';
import { useEffect, useState } from 'react';
import { HomeFilled, HomeOutlined } from '@ant-design/icons';
// import { Button } from 'antd';
import { COLORS } from '../main-window/utils/color';
import ICON from '../../../assets/icon.png';
import { Watcher } from './view/Watcher';
import { useConfigStore } from './store/config';

const Wrapper = styled.div`
    overflow-y: scroll;
    -webkit-app-region: drag;
    &::-webkit-scrollbar {
        width: 0;
    }
    .watcher-title {
        width: 100%;
        height: 30px;
        cursor: move;
        padding: 5px;
        font-size: 13px;
        color: ${COLORS.win};
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;
        .title {
            flex: 1;
        }
        img {
            left: 0;
            flex: 0 0 25px;
            height: 25px;
        }
        .home {
            cursor: pointer;
            -webkit-app-region: no-drag;
            flex: 0 0 25px;
            color: #d3d3d3;
            font-size: 15px;
        }
        border-bottom: 1px solid #e9e9e9;
    }
`;

export default function App() {
    const setConfigData = useConfigStore(state => state.setData);
    const [hide, setHide] = useState(true);
    useEffect(() => {
        window.electron.ipcRenderer.on('update-setting-data', (data: any) => {
            setConfigData(data);
        });
        window.electron.ipcRenderer.invoke('get-setting-data').then((data) => {
            setConfigData(data);
        });
        window.electron.ipcRenderer.on('hide-watcher-title', (data) => {
            setHide(data as any);
        });
    }, []);
    function handleToHome() {
        window.electron.ipcRenderer.sendMessage('open-home');
    }
    return (
        <Wrapper className='watcher-title-wrapper'>
            {!hide && <div className='watcher-title'>
                <img src={ICON} alt="" />
                <span className='title'>小金管家</span>
                <HomeFilled className='home' onClick={handleToHome} />
            </div>}
            <Watcher />
        </Wrapper>
    );
}
