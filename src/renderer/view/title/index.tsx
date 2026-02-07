import { SettingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styled from 'styled-components';
import { useRef, ComponentRef } from 'react';
import { SettingModal } from './modal/setting';
import ICON from '../../../../assets/icon.png';

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
        .ant-btn {
            color: #424242;
            letter-spacing: 2px;
            font-size: 12px;
            padding-inline: 10px !important;
        }
    }
`;

export function Title() {
    const settingModalRef = useRef<ComponentRef<typeof SettingModal>>(null);

    function handleOpenSetting() {
        settingModalRef.current?.open();
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
        </div>
        <SettingModal ref={settingModalRef}/>
    </Wrapper>;
}