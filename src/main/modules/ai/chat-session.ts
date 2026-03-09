import { inject, injectable } from 'inversify';
import OpenAI from 'openai';
// @ts-ignore
import { v4 } from 'uuid';
import { BrowserWindow } from 'electron';
import { SYMBOLS } from '../../symbols';

type Messages = {_id: string} & OpenAI.Chat.Completions.ChatCompletionMessageParam

// 模型对话层
@injectable()
export class ChatSession {
    @inject(SYMBOLS.MainBrowserFactory) private mainBrowserFactory: () => BrowserWindow;

    private chatMessages: Messages[] = [];

    public get messages() {
        return [...this.chatMessages];
    }

    private get MAX_MESSAGES() {
        return 30;
    };

    protected get mainWindow() {
        return this.mainBrowserFactory();
    }

    private SYSTEM_PROMPT = `
        你是一个基金投资助手。
        你的职责：
        1. 帮助用户查询基金数据
        2. 分析收益
        3. 在需要数据时调用工具
        4. 在用户允许的情况下可以删除或者更新数据库数据，在删除或者更新指定数据库的数据时需要先查找数据库并且确定数据库中是否存在目标数据
        6. 回答任何问题的时候都不能随意编造
        7. 你的名字是小金
        8. 所有涉及数据修改的操作必须先向用户复述修改内容并等待确认

        当需要查询本地基金时必须调用工具。
        不要编造基金数据。
        回答要简洁清晰。
    `;

    private SYSTEM_SIGNAL: Messages = {
        _id: v4(),
        role: 'system',
        content: this.SYSTEM_PROMPT
    };

    constructor() {
        this.chatMessages.push(this.SYSTEM_SIGNAL);
    }

    // 更新信息
    private updateMessages() {
        this.mainWindow.webContents.send('chat-message-change', this.messages);
    }

    public addUserMessage(content: string) {
        if(!content) return;
        this.chatMessages.push({
            _id: v4(),
            role: 'user',
            content
        });
        this.trim();
        this.updateMessages();
    }

    // 流式输出支持
    public startSteamAssistant() {
        this.chatMessages.push({
            _id: v4(),
            role: 'assistant',
            content: ''
        });
    }

    public updateSteamAssistant(content: string) {
        if(!this.chatMessages.length) return;
        this.chatMessages[this.chatMessages.length - 1].content = content;
        this.updateMessages();
    }

    public removeSteamAssistant() {
        this.chatMessages.pop();
        this.updateMessages();
    }

    public addAssistantMessage(content: string) {
        if(!content) return;
        this.chatMessages.push({
            _id: v4(),
            role: 'assistant',
            content
        });
        this.trim();
    }

    public addAssistantCallTool(data: any[]) {
        this.chatMessages.push({
            _id: v4(),
            role: 'assistant',
            tool_calls: data
        });
        this.trim();
    }

    public addToolMessage(callId: string, toolName: string, content: string) {
        if(!content) return;
        this.chatMessages.push({
            _id: v4(),
            role: 'tool',
            tool_call_id: callId,
            content
        });
        this.trim();
    }

    public clear() {
        this.chatMessages = [this.SYSTEM_SIGNAL];
    }

    // 删除多余对话
    private trim() {
        if(this.chatMessages.length <= this.MAX_MESSAGES + 1) return;
        const system = this.chatMessages.find(i => i.role === 'system');
        const handleMessages = this.chatMessages.slice(-this.MAX_MESSAGES);
        this.chatMessages = system
            ? [system, ...this.chatMessages.slice(-this.MAX_MESSAGES)]
            : handleMessages;
    }
}