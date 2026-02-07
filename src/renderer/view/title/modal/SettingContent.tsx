import { Button, Form, Select } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useConfigStore } from '../../../store/config';

interface Props {
    setOpen: (p: boolean) => void
}

const Wrapper = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: space-between;
    .ant-form {
        flex: 1;
    }
    .btn {
        flex: 0;
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        .ant-btn {
            font-size: 12px;
            &:first-child {
                background-color: #fff;
            }
            &:last-child {
                background-color: #ff4144;
                color: #fff;
            }
        }
    }
`;

export function SetttingContent(props: Props) {
    const [form] = Form.useForm<{interval: number}>();

    const [loading, setLoading] = useState(false);

    const configData = useConfigStore(state => state.data);
    const setConfigData = useConfigStore(state => state.setData);

    useEffect(() => {
        form.setFieldValue('interval', configData.interval);
    }, [configData]);

    function handleCancel() {
        props.setOpen(false);
    }

    async function handleConfirm() {
        const formData = form.getFieldsValue();
        if(formData.interval === configData.interval) return;
        setLoading(true);
        try {
            const res = await window.electron.ipcRenderer.invoke('set-setting-data', { ...formData });
            if(!res) return;
            props.setOpen(false);
            setConfigData({ ...configData, ...formData });
        } catch(e) {
            console.error(e);
        }
        setLoading(false);
    }

    return <Wrapper>
        <Form form={form} size='small'>
            <Form.Item name="interval" label="轮训间隔" layout='horizontal'>
                <Select
                    style={{ width: 100, height: 20, fontSize: 10 }}
                    options={[
                        { label: '每半秒', value: 500 },
                        { label: '每秒', value: 1000 },
                        { label: '每5秒', value: 1000 * 5 },
                        { label: '每半分', value: 1000 * 30 },
                        { label: '每分', value: 1000 * 60 },
                        { label: '每5分', value: 1000 * 60 * 5 },
                    ]}/>
            </Form.Item>
        </Form>
        <div className='btn'>
            <Button size='small' color="default" variant="filled" onClick={handleCancel}>取消</Button>
            <Button size='small' color="default" variant="filled" loading={loading} onClick={handleConfirm}>确定</Button>
        </div>
    </Wrapper>;
}