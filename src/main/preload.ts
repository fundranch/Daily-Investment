// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'hide-watcher-title'
    | 'close-watcher-window'
    | 'composite-data-update'
    | 'metal-data-update'
    | 'chart-data-update'
    | 'select-chart-type'
    | 'refresh-polling'
    | 'self-selected-fund-update'
    | 'hold-fund-update'
    | 'browser-context-menu'
    | 'update-setting-data'
    | 'update-hold-fund' // 更新持有基金
    | 'open-home'

export type AIChannels = 
    | 'chat-message-change'
    | 'chat-thinking-status'

export type InvokeChannels = 'set-watcher-data'
    | 'set-notifies-data'
    | 'get-setting-data'
    | 'set-setting-data'
    | 'fund-search'
    | 'change-self-selected-fund'
    | 'change-hold-fund'
    | 'get-self-selected-fund'
    | 'get-hold-fund'
export type InvokeAIChannels = 'get-ai-model-config'
    | 'set-ai-model-config'
    | 'get-ai-messages'
    | 'add-user-message' 

const electronHandler = {
    ipcRenderer: {
        sendMessage(channel: Channels | AIChannels, ...args: unknown[]) {
            ipcRenderer.send(channel, ...args);
        },
        on(channel: Channels | AIChannels, func: (...args: unknown[]) => void) {
            const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
                func(...args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        once(channel: Channels, func: (...args: unknown[]) => void) {
            ipcRenderer.once(channel, (_event, ...args) => func(...args));
        },
        async invoke<T = any>(invokeChannels: InvokeChannels | InvokeAIChannels, ...args: any[]): Promise<T | null> {
            try {
                const res = await ipcRenderer.invoke(invokeChannels, ...args);
                return res;
            } catch(e) {
                return null;
            }
        }
    },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
