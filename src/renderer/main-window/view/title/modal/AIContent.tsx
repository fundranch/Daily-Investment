import { Button, Form, Input } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

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

export function AIContent(props: Props) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm<{apiKey: string, model: string}>();

    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-ai-model-config').then(data => {
            if(!data) return;
            form.setFieldsValue({ ...data });
        });
    }, []);

    function handleCancel() {
        props.setOpen(false);
    }

    async function handleConfirm() {
        const formData = form.getFieldsValue();
        setLoading(true);
        try {
            const res = await window.electron.ipcRenderer.invoke('set-ai-model-config', { ...formData });
            if(!res) return;
            props.setOpen(false);
        } catch(e) {
            console.error(e);
        }
        setLoading(false);
    }
    return <Wrapper>
        <Form form={form} size='small' layout='horizontal' labelCol={{ span: 5 }}>
            <Form.Item name="model" label="模型名称">
                <Input />
            </Form.Item>
            <Form.Item name="baseURI" label="BaseURI">
                <Input />
            </Form.Item>
            <Form.Item name="apiKey" label="ApiKey">
                <Input.Password />
            </Form.Item>
        </Form>
        <div className='btn'>
            <Button size='small' color="default" variant="filled" onClick={handleCancel}>取消</Button>
            <Button size='small' color="default" variant="filled" loading={loading} onClick={handleConfirm}>确定</Button>
        </div>
    </Wrapper>;
}