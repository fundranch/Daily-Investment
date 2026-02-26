import { DeleteOutlined, FieldTimeOutlined, PlusOutlined, StockOutlined } from '@ant-design/icons';
import { Button, Modal, Table, TableProps, Tag } from 'antd';
import { ComponentRef, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import styled from 'styled-components';
// @ts-ignore
import { v4 } from 'uuid';
import { NotificationFormModal } from './NotificationForm';
import { NotificationData } from '../../../../../types';
import { NOTIFICATION_TYPE, TIMER_OPTIONS } from '../utils';
import { COLORS } from '../../../utils/color';
import { useConfigStore } from '../../../store/config';

const Wrapper = styled.div`
    .add-btn {
        font-size: 12px;
        margin-bottom: 8px;
    }
    .table {
        margin-bottom: 30px;
        .name {
            font-size: 12px;
            color: #333;
        }
        .type {
            
        }
        .threshold {
            color: ${COLORS.win};
            font-weight: 600;
            font-size: 12px;
        }
    }
`;
interface NotificationModalHandle {
    open: () => void
}

const NotificationModal = forwardRef<NotificationModalHandle, {}>((props, ref) => {
    const [open, setOpen] = useState(false);
    const notificationFormRef = useRef<ComponentRef<typeof NotificationFormModal>>(null);

    const [tableData, setTableData] = useState<(NotificationData & {id: string})[]>([]);

    const configData = useConfigStore(state => state.data);

    useImperativeHandle(ref, () => ({
        open() {
            if(Array.isArray(configData.notifies)) {
                setTableData(configData.notifies.map(i => ({ ...i, id: v4() })) || []);
            }
            setOpen(true);
        }
    }));

    const columns: TableProps<any>['columns'] = [
        {
            title: '目标',
            dataIndex: 'name',
            minWidth: 200,
            render: (value) => <div className='name'>{value}</div>
        },
        {
            title: '类型',
            dataIndex: 'type',
            minWidth: 180,
            render: (value, record) => {
                const icon = value === 'timer' ? <FieldTimeOutlined /> : <StockOutlined />;
                const color = value === 'timer' ? '#108ee9' : '#f50';
                let text = NOTIFICATION_TYPE.find(i => i.value === value)?.label;
                if(value === 'timer') {
                    text += ` (${TIMER_OPTIONS.find(i => i.value === record.timer)?.label})`;
                }
                return <div className='type'>
                    <Tag icon={icon} color={color} variant='filled'>{text}</Tag>
                </div>;
            }
        },
        {
            title: '阈值',
            dataIndex: 'threshold',
            minWidth: 100,
            render: (value) => <div className='threshold'>{`±${value}%`}</div>
        },
        {
            title: '操作',
            dataIndex: 'operation',
            width: 80,
            render(_, record) {
                return <Button type='text' icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />;
            }
        }
    ];

    function handleDelete(id: string) {
        setTableData(tableData.filter(i => i.id !== id));
    }

    function handleAddData(data: NotificationData & { id: string }) {
        setTableData([...tableData, data]);
    }

    function handleAdd() {
        notificationFormRef.current?.open();
    }

    async function handleOk() {
        const res = await window.electron.ipcRenderer.invoke('set-notifies-data', tableData);
        if(!res) return;
        setOpen(false);
    }

    function handleClose() {
        setOpen(false);
    }

    return <Modal
        open={open}
        width={600}
        destroyOnHidden
        title="通知设置"
        maskClosable={false}
        classNames={{ root: 'setting-modal' }}
        onCancel={handleClose}
        onOk={handleOk}
        okText="确定"
        cancelText='取消'
        styles={{ mask: { backdropFilter: 'unset' } }}
    >
        <Wrapper>
            <Button className='add-btn' icon={<PlusOutlined />} variant='text' size='small' color='primary' onClick={handleAdd}>新增通知</Button>
            <Table className='table' size='small' rowKey='id' columns={columns} dataSource={tableData} pagination={false} />
        </Wrapper>
        <NotificationFormModal ref={notificationFormRef} handleAddData={handleAddData} />
    </Modal>;
});

NotificationModal.displayName = 'NotificationModal';

export { NotificationModal };