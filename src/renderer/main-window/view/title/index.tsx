import { AlertOutlined, LineChartOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Popover, Tooltip } from 'antd';
import styled from 'styled-components';
import { useRef, ComponentRef, useEffect, useState } from 'react';
import { SettingModal } from './modal/setting';
import ICON from '../../../../../assets/icon.png';
import { WatcherModal } from './modal/Watcher';
import { NotificationModal } from './modal/Notification';
import { COLORS } from '../../utils/color';
import { eventBus } from '../../utils/event';
import { AIChat } from '../ai';

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
        cursor: pointer;
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

    const [open, setOpen] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setOpen(false);
        }, 3000);
    }, []);

    function handleOpenAI() {
        setOpen(false);
        eventBus.emit('open-ai');
    }

    return <Wrapper>
        <div className='title' onClick={handleOpenAI} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <Tooltip placement="right" title='点我可启用小金AI管家' open={open} color={COLORS.win} styles={{ root: { fontSize: 12 } }}>
                <img src={ICON} alt="" />
                小金管家
            </Tooltip>
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
        <AIChat />
    </Wrapper>;
}