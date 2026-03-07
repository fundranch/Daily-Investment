import { Container } from 'inversify';
import { MCPClient } from './mcpClient';
import { MCPServer } from './mcpServer';
import { McpMain } from './main';
import { AIModel } from './model';
import { ChatSession } from './chat-session';

export function bindAIProcess(container: Container) {
    container.bind(MCPClient).toSelf().inSingletonScope();
    container.bind(MCPServer).toSelf().inSingletonScope();
    container.bind(McpMain).toSelf().inSingletonScope();
    container.bind(AIModel).toSelf().inSingletonScope();
    container.bind(ChatSession).toSelf().inSingletonScope();
}