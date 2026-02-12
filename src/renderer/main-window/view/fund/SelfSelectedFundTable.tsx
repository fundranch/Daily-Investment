import styled from 'styled-components';
import { Table, TableProps } from 'antd';
import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useResizeObserverDebounce } from '../../hooks/useResizeObserverDebounce';
import { SelfSelectedFund, useFundStore } from '../../store/fund';
import { ValueColumns } from './components/ValueColumns';

type DataType = SelfSelectedFund

const Wrapper = styled.div`
    .table-name {
        .name {
            color: #333;
            font-size: 11px;
        }
        .code {
            font-size: 8px;
            color: #6f6f6f;
        }
        .hold {
            color: #0957d0;
            font-size: 9px;
            margin-left: 5px;
        }
    }
    .table-estimate {
        text-align: right;
        .value {
            font-size: 11px;
        }
        .time {
            font-size: 8px;
            color: #6f6f6f;
        }
    }
`;

export function SelfSelectedFundTable() {

    const columns: TableProps<DataType>['columns'] = [
        {
            title: '基金名称',
            dataIndex: 'name',
            key: 'name',
            width: 140,
            fixed: true,
            render(value, record) {
                return <div className='table-name'>
                    <div className='name'>{value}</div>
                    <div className='info'>
                        <span className='code'>{record.code}</span>
                        {record.isHold && <span className='hold'>持有</span>}
                    </div>
                </div>;
            }
        },
        {
            title: '当日涨幅',
            dataIndex: 'estimateChange',
            key: 'estimateChange',
            fixed: true,
            width: 110,
            align: 'right',
            render(value, record) {
                return <ValueColumns status={record.status} value={value} time={`${record.estimateTime} ${record.updateTime}`} />;
            }
        },
        {
            title: '添加后涨幅',
            dataIndex: 'holdIncome',
            key: 'holdIncome',
            width: 80,
            align: 'right',
            render(value, record) {
                const time = dayjs(value).format('YYYY-MM-DD');
                const data = (((Number(record.added_nav) - Number(record.net)) / Number(record.net)) * 100).toFixed(2);
                return <ValueColumns status={record.status} value={`${data}%`} time={time} />;
            }
        },
        {
            title: '当日净值',
            dataIndex: 'estimateNet',
            key: 'estimateNet',
            align: 'right',
            width: 80,
            render(value, record) {
                return <ValueColumns status={record.status} value={value} time={record.estimateTime} />;
            }
        },
        {
            title: '最新净值',
            dataIndex: 'net',
            key: 'net',
            align: 'right',
            width: 80,
            render(value, record) {
                return <ValueColumns status={record.status} resetColor value={value} time={record.netTime} />;
            }
        }
    ];

    const tableData = useFundStore(state => state.selfSelectedFunds);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scroll, setScroll] = useState<{x: number, y: number}>({} as any);
    useResizeObserverDebounce(wrapperRef, (entries) => {
        const bbox = entries[0].contentRect;
        setScroll({
            x: bbox.width,
            y: bbox.height
        });
    }, 100);

    function handleContextMenu(e: any, record: DataType) {
        e.stopPropagation();
        if(!record.code) return;
        window.electron.ipcRenderer.sendMessage('browser-context-menu', 'self-selected-fund', { code: record.code });
    }
    return <Wrapper ref={wrapperRef}>
        <Table
            onRow={(record) => {
                return {
                    onContextMenu: (e) => handleContextMenu(e, record),
                };
            }}
            rowKey='code'
            pagination={false}
            size='small'
            dataSource={tableData}
            columns={columns}
            scroll={{ ...scroll }}
        />
    </Wrapper>;
}