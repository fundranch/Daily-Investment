import { GetProp, Menu, MenuProps, Modal } from 'antd';
import React, { forwardRef, useState } from 'react';
import styled from 'styled-components';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { SettingContent } from './SettingContent';

type MenuItem = GetProp<MenuProps, 'items'>[number];

const Wrapper = styled.div`
    display: flex;
    gap: 15px;
    .ant-menu {
        flex: 0 0 40px;
        border: none !important;
        .ant-menu-title-content {
            font-size: 11px;
            font-weight: 800;
            margin-left: 6px !important;
        }
    }
    .split {
        flex: 0 0 1px;
        margin-block: 5px;
        background-color: #f7f7f7;
    }
    .content {
        height: 250px;
        flex: 1;
        margin-block: 5px;
    }
`;

interface SettingModalHandle {
    open: () => void
}

const SettingModal = forwardRef<SettingModalHandle, {}>((props, ref) => {
    const [open, setOpen] = React.useState(false);
    React.useImperativeHandle(ref, () => ({
        open() {
            setOpen(true);
        }
    }));
    const items: MenuItem[] = [
        {
            key: 'setting',
            icon: <SettingOutlined />,
            label: '系统设置',
        },
        {
            key: 'about',
            icon: <InfoCircleOutlined />,
            label: '关于',
        }
    ];

    const [activeMenu, setActiveMenu] = useState<'setting' | 'about'>('setting');

    function getContent() {
        if(activeMenu === 'setting') {
            return <SettingContent setOpen={setOpen} />;
        } 
        return null;
    }

    function handleClose() {
        setOpen(false);
    }
    
    return <Modal open={open} destroyOnHidden title="设置" maskClosable={false} footer={null} classNames={{ root: 'setting-modal' }} onCancel={handleClose}>
        <Wrapper>
            <Menu
                defaultSelectedKeys={['setting']}
                mode='vertical'
                items={items}
                onClick={({ key }) => setActiveMenu(key as any)}
            />
            <div className='split' />
            <div className='content'>
                {getContent()}
            </div>
        </Wrapper>
    </Modal>;
});

SettingModal.displayName = 'SettingModal';

export { SettingModal };