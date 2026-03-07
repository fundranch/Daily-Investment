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
}