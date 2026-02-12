import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Tabs, TabsProps } from 'antd';
import { ComponentRef, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { HoldFundTable } from './HoldFundTable';
import { FundModal } from './FundModal';
import { SelfSelectedFundTable } from './SelfSelectedFundTable';
import { useFundStore } from '../../store/fund';

const Wrapper = styled.div`
    height: 100%;
    .title {
        height: 20px;
        color: #333;
        font-size: 14px;
        letter-spacing: 1px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        .anticon {
            color: #949494;
            cursor: pointer;
        }
    }
    .body {
        height: calc(100% - 20px);
        padding-top: 4px;
        .ant-tabs {
            height: 100%;
        }
        .ant-tabs-nav {
            height: 35px;
            margin-bottom: 5px;
        }
        .ant-tabs-nav::before {
            border-bottom: none;
        }
        .ant-tabs-tab {
            font-size: 12px;
            color: #aeaeae;
        }
    }
`;

export function Fund() {
    const [activeKey, setActiveKey] = useState<'hold' | 'self-selected'>('hold');
    const fundModalRef = useRef<ComponentRef<typeof FundModal>>(null);

    const setHoldFunds = useFundStore(state => state.setHoldFunds);
    const setSelfSelectedFunds = useFundStore(state => state.setSelfSelectedFunds);
    useEffect(() => {
        window.electron.ipcRenderer.on('self-selected-fund-update', (data: any) => {
            setSelfSelectedFunds(data);
        });
        window.electron.ipcRenderer.on('hold-fund-update', (data: any) => {
            setHoldFunds(data);
        });
    }, []);


    function handleReloadFund() {
        window.electron.ipcRenderer.sendMessage('refresh-polling');
    }

    // 添加基金
    function handleAddFund() {
        fundModalRef.current?.open(activeKey);
    }
    const items: TabsProps['items'] = [
        {
            key: 'hold',
            label: '持有',
            children: <HoldFundTable />,
        },
        {
            key: 'self-selected',
            label: '自选',
            children: <SelfSelectedFundTable />,
        },
    ];
    return <Wrapper className="box">
        <div className='title'>
            基金
            <SyncOutlined onClick={handleReloadFund} />
        </div>
        <div className='body'>
            <Tabs
                activeKey={activeKey}
                size='small'
                items={items}
                onChange={e => setActiveKey(e as any)}
                tabBarExtraContent={
                    <Button size='small'title={`添加${activeKey === 'hold' ? '持有' : '自选'}`} icon={<PlusOutlined />} type="text" onClick={handleAddFund} />
                }
            />
            <FundModal ref={fundModalRef} />
        </div>
    </Wrapper>;
}