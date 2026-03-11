import { inject, injectable } from 'inversify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inmemory.js';
import { HoldFundDbService } from '../db/hold-fund-db';
import { SelfSelectedFundDbService } from '../db/self-selected-fund-db';
import { handleFundSearch } from '../api/fund';


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
        this.initSearchFund();
        this.initAddFund();
        this.initBatchFundHandler();
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
            description: `更新本地数据库中的某一个持有基金数据；
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
            description: `删除本地数据库中的某一个持有(hold)或者自选(selfSelected)基金数据；
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

    // 查找基金数据
    private initSearchFund() {
        this._server.registerTool('search-origin-fund', {
            title: 'search-origin-fund',
            description: '查找远端的基金数据，一般用于查找某个基金是否存在，模糊搜索返回匹配的基金列表',
            inputSchema: {
                desc: z.string()
            },
        }, async ({ desc }) => {
            const res = await handleFundSearch(desc);
            return {
                content: [{
                    type: 'text',
                    text: `查询到 ${res.length} 条基金数据`
                },
                {
                    type: 'text',
                    text: `查询到符合条件的基金为，${JSON.stringify(res)}`
                }]
            };
        });
    }

    // 新增基金数据
    private initAddFund() {
        this._server.registerTool('add-fund-item', {
            title: 'add-fund-item',
            description: `向本地数据库中新增一个持有基金或自选基金数据；
                          若是新增的持有基金，可以配置持有金额（invested_amount）或者持有总收益（total_profit）中的一个或多个字段，也可以不配置，不配置则默认为0
                         `,
            inputSchema: {
                code: z.string(),
                name: z.string(),
                type: z.enum(['selfSelected', 'hold']),
                invested_amount: z.number().min(0).default(0).optional(),
                total_profit: z.number().default(0).optional(),
            },
        }, async ({ code, name, type, invested_amount, total_profit }) => {
            const db = type === 'selfSelected' ? this.selfSelectedFundDb : this.holdFundDb;
            if(db.getAllFunds().some(i => i.code === code)) {
                return {
                    content: [{
                        type: 'text',
                        text: '当前基金已经创建，不需要重复添加'
                    }]
                };
            }
            const passData = type === 'selfSelected'
                ? { name, code }
                : { name, code, invested_amount, total_profit }; 
            const result = await db.addFund(passData);
            return {
                content: [{
                    type: 'text',
                    text: `新增基金${result ? '成功' : '失败'}`
                }]
            };
        });
    }

    // 批量操作基金数据
    private initBatchFundHandler() {
        const operationSchema = z.object({
            type: z.enum(['add', 'update', 'delete']),
            code: z.string(),
            name: z.string(),
            invested_amount: z.number().min(0).default(0).optional(),
            total_profit: z.number().default(0).optional(),
        });
        this._server.registerTool('batch-fund-handler', {
            title: 'batch-fund-handler',
            description: `此工具用于批量处理本地的基金数据；
                          调用时需要对持有基金（hold）和自选基金（selfSelected）分类
                            1.分类完后参数有两个，第一个是持有基金的操作(hold)，第二个是自选基金的操作(selfSelected)，两个参数类型都是数组
                            2.上述的数组中的每一项都是一个对象 { type: 'add' | 'delete' | 'update', code: string, name: string, invested_amount?: number, total_profit?: number }
                                --对象键值对描述
                                -- type: 操作的类型，分为新增、删除、更新
                                -- code: 基金代码
                                -- name: 基金名称
                                -- invested_amount和total_profit可以不传递，这两个参数可能在新增和更新中被需要，所以是可选项，默认是0；
                            3.若对同一个类型，即hold或selfSelected中的某一个基金做了多次操作只需要记录最后一次即可；
                          默认结构示例：
                            {
                                "hold": [
                                    { "type": "add", "code": "000001", "name": "example", "invested_amount": 1000, "total_profit": 0 },
                                    { "type": "update", "code": "000002", "name": "example" },
                                    { "type": "delete", "code": "000003", "name": "example" }
                                ],
                                "selfSelected": [
                                    { "type": "add", "code": "000001", "name": "example" }
                                ]
                            }
                         `,
            inputSchema: {
                hold: z.array(operationSchema),
                selfSelected: z.array(operationSchema)
            },
        }, async ({ hold, selfSelected }) => {
            const content: any[] = [];
            const holdResult = await this.holdFundDb.batchHandlerFund(hold);
            if(!holdResult) {
                content.push({
                    text: '处理持有基金失败',
                    type: 'text'
                });
            } else {
                const [holdAdd, holdUpdate, holdDelete] = holdResult;
                content.push(
                    { type: 'text', text: `新增持有基金个数${holdAdd.length}；${holdAdd.join(',')}` },
                    { type: 'text', text: `更新持有基金个数${holdUpdate.length}；${holdUpdate.join(',')}` },
                    { type: 'text', text: `删除持有基金个数${holdDelete.length}；${holdDelete.join(',')}` }
                );
            }
            const selfSelectedResult = await this.selfSelectedFundDb.batchHandlerFund(hold);
            if(!selfSelectedResult) {
                content.push({
                    text: '处理自选基金失败',
                    type: 'text'
                });
            } else {
                const [selfSelectedAdd, selfSelectedDelete] = selfSelectedResult;
                content.push(
                    { type: 'text', text: `新增自选基金个数${selfSelectedAdd.length}；${selfSelectedAdd.join(',')}` },
                    { type: 'text', text: `删除自选基金个数${selfSelectedDelete.length}；${selfSelectedDelete.join(',')}` }
                );
            }
            return {
                content
            };
        });
    }
}