import { inject, injectable, postConstruct } from 'inversify';
import OpenAI from 'openai';
import { BrowserWindow, ipcMain } from 'electron';
import { MCPServer } from './mcpServer';
import { MCPClient } from './mcpClient';
import { ChatSession } from './chat-session';
import { SYMBOLS } from '../../symbols';
import { AIStorageModule } from '../storage/ai-storage';
import { EventBus } from '../events';

@injectable()
export class AIModel {
    @inject(MCPServer) private mcpServerService: MCPServer;
    
    @inject(MCPClient) private mcpClientService: MCPClient;

    @inject(ChatSession) private chatSession: ChatSession;

    @inject(SYMBOLS.EventBus) eventBus: EventBus;

    @inject(SYMBOLS.MainBrowserFactory) private mainBrowserFactory: () => BrowserWindow;

    @inject(AIStorageModule) private aIStorageModule: AIStorageModule;

    private get model() {
        return this.aIStorageModule.data?.model;
    }

    private openai: OpenAI;

    private tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];

    protected get mainWindow() {
        return this.mainBrowserFactory();
    }

    private setThinking(status: boolean) {
        this.mainWindow.webContents.send('chat-thinking-status', status);
    }

    private updateMessages() {
        this.mainWindow.webContents.send('chat-message-change', [...this.chatSession.messages]);
    }

    @postConstruct()
    protected init() {

        this.createAI();

        this.eventBus.on('ai-config-update', () => {
            this.restart();
        });
    }

    public async createAI() {
        let config = this.aIStorageModule.data;
        if(!this.aIStorageModule.data) {
            config = await this.aIStorageModule.getAppData();
        }
        if(!config?.apiKey || !config?.baseURI || !config?.model) return;
        this.openai = new OpenAI({
            baseURL: config.baseURI,
            apiKey: config.apiKey,
            timeout: 1000 * 60,
            maxRetries: 4
        });
    }

    public async start() {
        await this.initTools();
    }

    public restart() {
        this.createAI();
    }

    private async initTools() {
        const toolsResult = await this.mcpClientService.client.listTools();
        this.tools = toolsResult.tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            }
        }));
    }

    // 对话
    public handleUserMessage = async (content: string) => {
        if(!this.model) return;
        try {
            this.setThinking(true);
            this.chatSession.addUserMessage(content);
            this.updateMessages();
            await this.runAgentLoop();
            this.updateMessages();
        } catch(e) {
            console.error('AI error', e);
        } finally {
            this.setThinking(false);
        }
    };

    // 处理出现循环工具调用的情况
    private async runAgentLoop() {
        const MAX_LOOP = 6;
        let count = 0;
        while(count <= MAX_LOOP) {
            count++;
            const message = await this.ask();
            if(!message.tool_calls) {
                this.chatSession.addAssistantMessage(message.content || '');
                break;
            };
            for(const toolItme of message.tool_calls) {
                const toolName = (toolItme as any).function.name;
                const toolResult = await this.toolCall(
                    toolName,
                    (toolItme as any).function.arguments,
                );
                this.chatSession.addToolMessage(toolItme.id, toolName, JSON.stringify(toolResult.content));
            }
        }
    }

    // ai聊天
    private async ask() {
        const res = await this.openai.chat.completions.create({
            model: this.model!,
            messages: this.chatSession.messages,
            tools: this.tools,
        });
        return res.choices[0].message;
    }

    // 工具调用
    private async toolCall(name: string, args: string) {
        let toolArgs = {};
        try {
            toolArgs = JSON.parse(args);
        } catch(e) {
            console.error('tool args parse error', args);
        }
        const res = await this.mcpClientService.client.callTool({
            name,
            arguments: toolArgs
        });
        return res;
    }
}