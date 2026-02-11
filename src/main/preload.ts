// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'composite-data-update' | 'metal-data-update' | 'chart-data-update' | 'select-chart-type' | 'refresh-polling' | 'self-selected-fund-update' | 'hold-fund-update' | 'browser-context-menu';

export type InvokeChannels = 'get-setting-data' | 'set-setting-data' | 'fund-search' | 'change-self-selected-fund' | 'change-hold-fund'

const electronHandler = {
    ipcRenderer: {
        sendMessage(channel: Channels, ...args: unknown[]) {
            ipcRenderer.send(channel, ...args);
        },
        on(channel: Channels, func: (...args: unknown[]) => void) {
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
        async invoke<T = any>(invokeChannels: InvokeChannels, ...args: any[]): Promise<T | null> {
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
