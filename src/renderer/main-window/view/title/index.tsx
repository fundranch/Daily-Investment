import { AlertOutlined, LineChartOutlined, SettingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styled from 'styled-components';
import { useRef, ComponentRef } from 'react';
import { SettingModal } from './modal/setting';
import ICON from '../../../../../assets/icon.png';
import { WatcherModal } from './modal/Watcher';
import { NotificationModal } from './modal/Notification';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    .title {
        flex: 0 0 150px;
        color: #fe5f57;
        font-weight: 1000;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        position: relative;
        padding-left: 60px;
        img {
            position: absolute;
            bottom: -15px;
            left: 0;
            width: 55px;
            height: 55px;
        }
    }
    .tool-list {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        .ant-btn {
            /* color: #424242; */
            letter-spacing: 2px;
            font-size: 12px;
            padding-inline: 10px !important;
        }
    }
`;

export function Title() {
    const settingModalRef = useRef<ComponentRef<typeof SettingModal>>(null);
    const watcherModalRef = useRef<ComponentRef<typeof WatcherModal>>(null);
    const notificationModal = useRef<ComponentRef<typeof NotificationModal>>(null);

    function handleOpenSetting() {
        settingModalRef.current?.open();
    }

    function handleOpenWatcher() {
        watcherModalRef.current?.open();
    }

    function handleOpenNotification() {
        notificationModal.current?.open();
    }

    return <Wrapper>
        <div className='title'>
            <img src={ICON} alt="" />
            小金管家
        </div>
        <div className="tool-list">
            <Button shape="round" size='middle' icon={<SettingOutlined />} onClick={handleOpenSetting}>
                设置
            </Button>
            <Button shape="round" color='gold' size='middle' icon={<AlertOutlined />} onClick={handleOpenNotification} variant="solid">
                通知
            </Button>
            <Button shape="round" type='primary' size='middle' icon={<LineChartOutlined />} onClick={handleOpenWatcher}>
                盯盘
            </Button>
        </div>
        <SettingModal ref={settingModalRef}/>
        <WatcherModal ref={watcherModalRef} />
        <NotificationModal ref={notificationModal} />
    </Wrapper>;
}