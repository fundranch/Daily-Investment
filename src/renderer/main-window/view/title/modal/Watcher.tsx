import { Checkbox, Form, Modal, Slider, Switch } from 'antd';
import React, { forwardRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useConfigStore } from '../../../store/config';
import { MetalType } from '../../../../../types';
import { getFundList, METAL_OPTIONS } from '../utils';

const Wrapper = styled.div`
    .metal-check-box .ant-checkbox-label {
        font-size: 12px;
        color: #333;
    }
    .metal-check-box.fund {
        flex-direction: column;
        gap: 4px;
    }
    .fund-choose .ant-form-item-control {
        max-height: 220px;
        overflow-y: scroll;
    }
`;

interface WatcherModalHandle {
    open: () => void
}

const WatcherModal = forwardRef<WatcherModalHandle, {}>((props, ref) => {
    const [form] = Form.useForm<{
        open: boolean,
        fund: string[],
        metal: MetalType[],
        opacity: number
    }>();

    const configData = useConfigStore(state => state.data);
    const setConfigData = useConfigStore(state => state.setData);
    const [open, setOpen] = React.useState(false);

    const [fundList, setFundList] = useState<{label: string, value: string}[]>([]);
    React.useImperativeHandle(ref, () => ({
        async open() {
            setOpen(true);
            // 获取基金列表
            const data = await getFundList();
            setFundList(data);
        }
    }));
    
    useEffect(() => {
        form.setFieldsValue({
            open: configData.watcher?.open,
            metal: configData.watcher?.metal,
            fund: configData.watcher?.fund,
            opacity: configData.watcher?.opacity || 1
        });
    }, [configData, open]);
    
    async function handleOk() {
        const data = form.getFieldsValue();
        const res = await window.electron.ipcRenderer.invoke('set-watcher-data', data);
        if(!res) return;
        setConfigData({ ...configData, watcher: data });
        setOpen(false);
    }

    function handleClose() {
        setOpen(false);
        form.resetFields();
    }
    
    return <Modal
        open={open}
        destroyOnHidden
        title="盯盘设置"
        maskClosable={false}
        classNames={{ root: 'setting-modal' }}
        onCancel={handleClose}
        onOk={handleOk}
        okText="确定"
        cancelText='取消'
    >
        <Wrapper>
            <Form size='small' form={form} labelCol={{ span: 4 }} labelAlign='left'>
                <Form.Item name="open" label="小窗盯盘">
                    <Switch />
                </Form.Item>
                <Form.Item name="opacity" label="透明度">
                    <Slider min={0} max={1} step={0.1} style={{ width: '20%' }} />
                </Form.Item>
                <Form.Item name="metal" label="有色选择">
                    <Checkbox.Group className='metal-check-box'>
                        {METAL_OPTIONS.map(i => <Checkbox value={i.value}>{i.label}</Checkbox>)}
                    </Checkbox.Group>
                </Form.Item>
                <Form.Item name="fund" label="基金选择" className='fund-choose'>
                    <Checkbox.Group className='metal-check-box fund'>
                        {fundList.map(i => (
                            <Checkbox value={i.value}>
                                {i.label}
                            </Checkbox>
                        ))}
                    </Checkbox.Group>
                </Form.Item>
            </Form>
        </Wrapper>
    </Modal>;
});

WatcherModal.displayName = 'WatcherModal';

export { WatcherModal };