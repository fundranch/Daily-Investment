import { injectable } from 'inversify';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inmemory.js';

@injectable()
export class MCPClient {

    public get client() {
        return this._client;
    }
    
    private _client: Client;

    private _transport:InMemoryTransport;

    constructor() {
        this.init();
    }

    private init() {
        this._client = new Client({
            name: 'fund-assistant-client',
            version: '101.0'
        });
    }

    // 传输层连接
    public async connect(transport: InMemoryTransport) {
        if(!this._client) {
            this.init();
        }
        await this._client.connect(transport);
        this._transport = transport;
    }
}