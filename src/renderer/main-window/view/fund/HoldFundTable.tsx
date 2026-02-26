import styled from 'styled-components';
import { Table, TableProps } from 'antd';
import { useRef, useState } from 'react';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { useResizeObserverDebounce } from '../../hooks/useResizeObserverDebounce';
import { HoldFund, useFundStore } from '../../store/fund';
import { ValueColumns } from './components/ValueColumns';
import { COLORS, getColorByStatus } from '../../utils/color';

type DataType = HoldFund

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
        .info {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            .anticon {
                font-size: 12px;
                margin-left: 4px;
            }
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

export function HoldFundTable() {
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
                        {record.status === 1 && <CaretUpOutlined style={{ color: COLORS.win }} /> }
                        {record.status === -1 && <CaretDownOutlined style={{ color: COLORS.lose }} />  }
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
            render(value, record) {
                return <ValueColumns status={record.status} value={value} time={`${record.estimateTime} ${record.updateTime}`} />;
            }
        },
        {
            title: '当日收益',
            dataIndex: 'todayProfit',
            key: 'todayProfit',
            align: 'right',
            width: 90,
            render(value, record) {
                const ratio = ((value / record.invested_amount) * 100 || 0).toFixed(2);
                return <ValueColumns status={value} value={`${value}元`} time={`收益率：${ratio}%`} />;
            }
        },
        {
            title: '持有收益',
            dataIndex: 'total_profit',
            key: 'total_profit',
            align: 'right',
            width: 90,
            render(value, record) {
                // TODO 优化金额运算规则
                return <ValueColumns status={0} value={`${value}元`} time={`最新：${Number(value) + Number(record.todayProfit)}元`} />;
            }
        },
        {
            title: '持有金额',
            dataIndex: 'invested_amount',
            key: 'invested_amount',
            align: 'right',
            width: 90,
            render(value, record) {
                // TODO 优化金额运算规则
                return <ValueColumns status={0} value={`${value}元`} time={`最新：${Number(value) + Number(record.todayProfit)}元`} />;
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
                return <ValueColumns status={record.status} value={value} time={record.netTime} />;
            }
        }
    ];

    const tableData = useFundStore(state => state.holdFunds);

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
        window.electron.ipcRenderer.sendMessage('browser-context-menu', 'hold-fund', { code: record.code });
    }

    function handleGetSummary(data: readonly DataType[]) {
        const num = data.reduce((pre, i) => {
            return pre + Number(i.todayProfit);
        }, 0);
        return <Table.Summary fixed>
            <Table.Summary.Row>
                <Table.Summary.Cell index={0}>当日总计</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align='right'>
                    <div style={{ color: getColorByStatus(num) }}>{num}元</div>
                </Table.Summary.Cell>
            </Table.Summary.Row>
        </Table.Summary>;
    }
    return <Wrapper ref={wrapperRef}>
        <Table
            onRow={(record) => {
                return {
                    onContextMenu: (e) => handleContextMenu(e, record),
                };
            }}
            summary={(data) => handleGetSummary(data)}
            pagination={false}
            size='small'
            columns={columns}
            dataSource={tableData}
            scroll={{ ...scroll }}
        />
    </Wrapper>;
}