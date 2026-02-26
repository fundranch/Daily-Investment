import { Form, InputNumber, Modal, Select } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
// @ts-ignore
import { v4 } from 'uuid';
import { NotificationData } from '../../../../../types';
import { getFundList, METAL_OPTIONS, NOTIFICATION_TYPE, TIMER_OPTIONS } from '../utils';

interface NotificationFormModalHandle {
    open: () => void
}
const NotificationFormModal = forwardRef<NotificationFormModalHandle, { handleAddData:(P: NotificationData & {id: string}) => void }>((props, ref) => {
    const [open, setOpen] = useState(false);

    const [options, setOptions] = useState<{label: string, value: string}[]>([]);

    const [form] = Form.useForm<NotificationData>();

    useImperativeHandle(ref, () => ({
        async open() {
            form.setFieldsValue({
                type: 'amplitude',
                code: undefined,
                threshold: 0.10
            });
            setOpen(true);
            // 获取基金列表
            const data = await getFundList();
            setOptions(METAL_OPTIONS.concat(data));
        }
    }));

    const type = Form.useWatch('type', form);

    function handleChangeType(data: NotificationData['type']) {
        if(data !== 'timer') return;
        form.setFieldValue('timer', 1000 * 60);
    }

    async function handleOk() {
        try {
            await form.validateFields();
            const data = form.getFieldsValue();
            props.handleAddData({
                ...data,
                name: options.find(i => i.value === data.code)?.label || '',
                id: v4()
            });
            setOpen(false);
        } catch(e) {
            console.error(e);
        }
    }

    function handleClose() {
        setOpen(false);
    }
    

    return <Modal
        open={open}
        title="新增通知"
        width={350}
        maskClosable={false}
        classNames={{ root: 'setting-modal' }}
        onCancel={handleClose}
        onOk={handleOk}
        okText="确定"
        getContainer={false}
        cancelText='取消'
        styles={{ mask: { backdropFilter: 'unset' } }}
    >
        <Form form={form} size='small' labelCol={{ span: 5 }} requiredMark={false}>
            <Form.Item label='目标' name="code" rules={[{ required: true, message: '通知目标必填' }]}>
                <Select options={options} />
            </Form.Item>
            <Form.Item label='类型' name="type">
                <Select options={NOTIFICATION_TYPE} onChange={handleChangeType} />
            </Form.Item>
            {
                type === 'timer' && 
                <Form.Item label='轮询' name="timer">
                    <Select options={TIMER_OPTIONS} />
                </Form.Item>
            }
            <Form.Item label='涨幅' name="threshold" getValueFromEvent={(value) => Math.round(value * 100) / 100 }>
                <InputNumber
                    style={{ width: '100%' }}
                    controls={false}
                    min={0.01}
                    max={100}
                    prefix='±'
                    suffix='%'
                />
            </Form.Item>
        </Form>
    </Modal>;
});

NotificationFormModal.displayName = 'NotificationFormModal';

export { NotificationFormModal };