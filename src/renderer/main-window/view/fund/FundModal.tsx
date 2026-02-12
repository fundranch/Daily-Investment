import { Form, InputNumber, Modal, Select, Spin } from 'antd';
import { debounce } from 'lodash';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useFundStore } from '../../store/fund';


const Wrapper = styled.div`
    .ant-input-number {
        width: 100%;
    }
    .ant-form-item-label {
        padding-bottom: 4px;
    }
    .ant-select, .ant-input-number  {
        font-size: 12px !important;
    }
    .ant-form-item-explain-error {
        font-size: 12px;
    }
`;

interface FundModalHandle {
    open: (type: 'hold' | 'self-selected') => void
}

interface FormData {
    name: Record<'label' | 'value', string>
    holdPirce: number // 金额
    holdIncome: number
}

const FundModal = forwardRef<FundModalHandle>((props, ref) => {
    const [openType, setOpenType] = useState<'hold' | 'self-selected' | null>(null);

    useImperativeHandle(ref, () => ({
        open(type: 'hold' | 'self-selected') {
            setOpenType(type);
        }
    }));

    const [form] = Form.useForm<FormData>();

    const [isSearch, setSearch] = useState(false);

    const [options, setOptions] = useState<{label: string, value: string}[]>([]);

    const fundFetcher = useMemo(() => {
        return debounce((value) => {
            setOptions([]);
            setSearch(true);
            window.electron.ipcRenderer.invoke('fund-search', value).then((res) => {
                setOptions(res);
            }).finally(() => {
                setSearch(false);
            });
        }, 200);
    }, []);

    async function handleConfirm() {
        try {
            await form.validateFields();
            const formData = form.getFieldsValue();
            const res = await window.electron.ipcRenderer.invoke(`change-${openType}-fund` as any, 'add', {
                ...formData,
                code: formData.name.value,
                name: formData.name.label
            });
            if(res) {
                setOpenType(null);
            }
        } catch(e) {
            console.error(e);
        }
    }

    const selectedFund = Form.useWatch(['name'], form);
    const selfSelectedData = useFundStore(state => state.selfSelectedFunds);
    const holdData = useFundStore(state => state.holdFunds);
    // 判断当前基金是否已经被添加
    const isAdded = useMemo(() => {
        const data = openType === 'self-selected' ? selfSelectedData : holdData;
        return data.some(i => i.code === selectedFund?.value);
    }, [selectedFund]);

    function handleClose() {
        form.resetFields();
        setOptions([]);
        setOpenType(null);
    }
    
    return <Modal
        classNames={{ root: 'fund-modal' }}
        open={openType !== null}
        destroyOnHidden
        title={`新增${openType === 'hold' ? '持有' : '自选'}`}
        maskClosable={false}
        onCancel={handleClose}
        width={350}
        okButtonProps={{ size: 'small', disabled: isAdded }}
        okText={isAdded ? '该基金已加购' : '添加'}
        cancelButtonProps={{ size: 'small' }}
        cancelText="取消"
        onOk={handleConfirm}
    >
        <Wrapper>
            <Form form={form} size='small' layout='vertical' requiredMark={false}>
                <Form.Item label="基金代码或名称" name="name" rules={[{ required: true, message: '所选基金不得为空' }]}>
                    <Select
                        labelInValue
                        options={options}
                        notFoundContent={isSearch ? <Spin size="small" /> : '无数据'}
                        showSearch={{ filterOption: false, onSearch: fundFetcher }}
                    />
                </Form.Item>
                {openType === 'hold' && 
                    <>
                        <Form.Item label="持有金额" name='invested_amount'>
                            <InputNumber width='100%' controls={false} defaultValue={0} disabled />
                        </Form.Item>
                        <Form.Item label="持有收益" name='total_profit'>
                            <InputNumber width='100%' controls={false} defaultValue={0} disabled />
                        </Form.Item>
                    </>}
            </Form>
        </Wrapper>
    </Modal>;
});

FundModal.displayName = 'FundModal';

export { FundModal };