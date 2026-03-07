import { inject, injectable, postConstruct } from 'inversify';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inmemory.js';
import { ipcMain } from 'electron';
import { MCPServer } from './mcpServer';
import { MCPClient } from './mcpClient';
import { Disposable, DisposableManager } from '../disposable-manager';
import { AIModel } from './model';
import { ChatSession } from './chat-session';

@injectable()
export class McpMain implements Disposable {
    @inject(MCPServer) private mcpServerService: MCPServer;

    @inject(MCPClient) private mcpClientService: MCPClient;

    @inject(AIModel) private ai: AIModel;

    @inject(ChatSession) private chatSession: ChatSession;

    @inject(DisposableManager) protected disposableManager: DisposableManager;

    private transport: Record<'client'| 'server', InMemoryTransport>;

    @postConstruct()
    protected init() {
        this.disposableManager.register(this);
        this.connect();
        ipcMain.handle('get-ai-messages', async () => {
            return [...this.chatSession.messages];
        });
        ipcMain.handle('add-user-message', async (_, content) => {
            await this.ai.handleUserMessage(content);
            return [...this.chatSession.messages];
        });
    }

    private async connect() {
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
        await this.mcpServerService.connect(serverTransport);
        await this.mcpClientService.connect(clientTransport);
        this.transport = {
            client: clientTransport,
            server: serverTransport
        };
        this.ai.start();
    }

    public dispose(): void {
        this.transport.client.close();
        this.transport.server.close();
    }
}