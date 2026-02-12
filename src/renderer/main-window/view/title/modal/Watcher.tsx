import { Checkbox, Form, Modal, Switch } from 'antd';
import React, { forwardRef, useEffect } from 'react';
import styled from 'styled-components';
import { useConfigStore } from '../../../store/config';
import { MetalType } from '../../../../../types';

const Wrapper = styled.div`
    .metal-check-box .ant-checkbox-label {
        font-size: 12px;
        color: #333;
    }
`;

interface WatcherModalHandle {
    open: () => void
}

const WatcherModal = forwardRef<WatcherModalHandle, {}>((props, ref) => {
    const [form] = Form.useForm<{open: boolean, fund: string[], metal: MetalType[]}>();

    const configData = useConfigStore(state => state.data);
    const setConfigData = useConfigStore(state => state.setData);
    const [open, setOpen] = React.useState(false);

    React.useImperativeHandle(ref, () => ({
        open() {
            setOpen(true);
        }
    }));
    
    useEffect(() => {
        if(!open) return;
        form.setFieldsValue({
            open: configData.watcher?.open,
            metal: configData.watcher?.metal
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
                <Form.Item name="metal" label="有色选择">
                    <Checkbox.Group className='metal-check-box'>
                        <Checkbox value="au">
                            现货黄金
                        </Checkbox>
                        <Checkbox value="aums">
                            民生黄金
                        </Checkbox>
                        <Checkbox value="aum">
                            沪金主力
                        </Checkbox>
                        <Checkbox value="ag">
                            现货白银
                        </Checkbox>
                    </Checkbox.Group>
                </Form.Item>
            </Form>
        </Wrapper>
    </Modal>;
});

WatcherModal.displayName = 'WatcherModal';

export { WatcherModal };