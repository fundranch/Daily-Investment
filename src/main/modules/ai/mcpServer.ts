import { inject, injectable } from 'inversify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inmemory.js';
import { HoldFundDbService } from '../db/hold-fund-db';
import { SelfSelectedFundDbService } from '../db/self-selected-fund-db';


@injectable()
export class MCPServer {
    @inject(HoldFundDbService) private holdFundDb: HoldFundDbService;

    @inject(SelfSelectedFundDbService) private selfSelectedFundDb: SelfSelectedFundDbService;

    public get server() {
        return this._server;
    }

    private _server: McpServer;

    private _transport: Readonly<InMemoryTransport>;

    constructor() {
        this.init();
    }

    // 传输层连接
    public async connect(transport: InMemoryTransport) {
        if(!this._server) {
            this.init();
        }
        await this._server.connect(transport);
        this._transport = transport;
    }

    private async init() {
        this._server = new McpServer({
            name: 'fund-assistant-server',
            version: '1.0.0'
        });
        this.initTools();
    }

    private initTools() {
        this.initReadFundList();
        this.initUpdateHoldFund();
        this.initDeleteFund();
    }

    // 读取数据库列表
    private initReadFundList() {
        this._server.registerTool('read-fund-list-db', {
            title: 'read-fund-list-db',
            description: '读取本地数据库中的基金数据，基金分为自选(selfSelected)基金和持有(hold)基金',
            inputSchema: {
                type: z.enum(['selfSelected', 'hold']),
            },
        }, ({ type }) => {
            if(type !== 'selfSelected' && type !== 'hold') {
                return {
                    content: [{
                        type: 'text',
                        text: '查询本地基金数据失败'
                    }]
                };
            }
            const data = type === 'selfSelected' 
                ? this.selfSelectedFundDb.getAllFunds()
                : this.holdFundDb.getAllFunds();
            return {
                content: [{
                    type: 'text',
                    text: `查询到 ${data.length} 条基金数据`
                },
                {
                    type: 'text',
                    text: `查询到的基金JSON数据为，${JSON.stringify(data)}`
                }]
            };
        });
    }

    // 更新数据库基金数据
    private initUpdateHoldFund() {
        this._server.registerTool('update-hold-fund', {
            title: 'read-fund-list-db',
            description: `更新本地数据库中的持有基金数据；
                          查找持有基金数据库数据，若存在目标基金，则用code字段作为标识进行后续的更新，同时获取当前的持有金额（invested_amount）和持有总收益（total_profit）
                          可以更新持有金额（new_invested_amount）或者持有总收益（new_total_profit）中的一个或多个字段,可以不用两个字段都传，更新一个也可行
                        `,
            inputSchema: {
                code: z.string(),
                invested_amount: z.number().min(0),
                total_profit: z.number(),
                new_invested_amount: z.number().min(0).optional(),
                new_total_profit: z.number().optional()
            },
        }, ({ code, invested_amount, total_profit, new_invested_amount, new_total_profit }) => {
            if(!code) {
                return {
                    content: [{
                        type: 'text',
                        text: '本地数据中未找到该基金'
                    }]
                };
            }
            const handleData = (newData: number | undefined, oldData: number) => newData === undefined ? oldData : Math.round(newData * 100) / 100;
            const investedAmount = handleData(new_invested_amount, invested_amount);
            const totalProfit = handleData(new_total_profit, total_profit);
            const result = this.holdFundDb.updateFund({
                code,
                invested_amount: investedAmount,
                total_profit: totalProfit,
            });
            return {
                content: [{
                    type: 'text',
                    text: `基金数据更新${result ? '成功' : '失败'}`
                }]
            };
        });
    }

    // 删除基金数据
    private initDeleteFund() {
        this._server.registerTool('delete-fund-item', {
            title: 'delete-fund-item',
            description: `删除本地数据库中的持有(hold)或者自选(selfSelected)基金数据；
                          查找一下对应基金数据库数据，若存在目标基金，则用code字段作为标识进行删除
                        `,
            inputSchema: {
                type: z.enum(['selfSelected', 'hold']),
                code: z.string()
            },
        }, ({ type, code }) => {
            if(type !== 'selfSelected' && type !== 'hold') {
                return {
                    content: [{
                        type: 'text',
                        text: '查询本地基金数据失败'
                    }]
                };
            }
            const data = type === 'selfSelected' 
                ? this.selfSelectedFundDb.deleteFund(code)
                : this.holdFundDb.deleteFund(code);
            return {
                content: [{
                    type: 'text',
                    text: `删除基金数据${data ? '成功' : '失败'}`
                }]
            };
        });
    }
}