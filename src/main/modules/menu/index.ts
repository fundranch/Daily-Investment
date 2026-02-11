import {
    Menu,
    BrowserWindow,
    MenuItemConstructorOptions,
    ipcMain,
    app,
} from 'electron';
import { inject, injectable } from 'inversify';
import { SYMBOLS } from '../../symbols';
import { SelfSelectedFundDbService } from '../db/self-selected-fund-db';
import { PollingScheduler } from '../polling-scheduler/scheduler';
import { HoldFundDbService } from '../db/hold-fund-db';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

@injectable()
export class MenuBuilder {
    @inject(SYMBOLS.MainBrowserFactory) mainBrowserFactory: () => BrowserWindow;

    @inject(SelfSelectedFundDbService) private selfSelectedFundDbService: SelfSelectedFundDbService;

    @inject(HoldFundDbService) private holdFundDbService: HoldFundDbService;

    @inject(PollingScheduler) private pollingScheduler:PollingScheduler;

    protected get mainWindow() {
        return this.mainBrowserFactory();
    }

    public buildMenu(): Menu {
        this.setupContextMenu();

        const template =
      process.platform === 'darwin'
          ? this.buildDarwinTemplate()
          : this.buildDefaultTemplate();

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        return menu;
    }

    private setupContextMenu(): void {
        ipcMain.on('browser-context-menu', (event, type: string, ext: Record<string, any>) => {
            if(event.sender !== this.mainWindow.webContents) return;
            if(type === 'self-selected-fund') {
                this.setSelfSelectedFundMenu(ext);
            }
            if(type === 'hold-fund') {
                this.setHoldFundMenu(ext);
            }
        });
    }

    // 自选基金右键菜单
    private setSelfSelectedFundMenu(options: Record<string, any>) {
        Menu.buildFromTemplate([
            {
                label: '删除自选',
                click: () => {
                    const res = this.selfSelectedFundDbService.deleteFund(options.code);
                    if(!res) return;
                    this.pollingScheduler.restart();
                }
            },
            {
                label: '置顶',
                click: () => {
                    const res = this.selfSelectedFundDbService.fundToTop(options.code);
                    if(!res) return;
                    this.pollingScheduler.restart();
                }
            }
        ]).popup({ window: this.mainWindow });
    }

    // 持有基金右键菜单
    private setHoldFundMenu(options: Record<string, any>) {
        Menu.buildFromTemplate([
            {
                label: '更新持有',
                click: () => {
                    // TODO
                }
            },
            {
                label: '删除持有',
                click: () => {
                    const res = this.holdFundDbService.deleteFund(options.code);
                    if(!res) return;
                    this.pollingScheduler.restart();
                }
            },
            {
                label: '置顶',
                click: () => {
                    const res = this.holdFundDbService.fundToTop(options.code);
                    if(!res) return;
                    this.pollingScheduler.restart();
                }
            }
        ]).popup({ window: this.mainWindow });
    }

    buildDarwinTemplate(): MenuItemConstructorOptions[] {
        const subMenuMain: DarwinMenuItemConstructorOptions = {
            label: '小金管家',
            submenu: [
                {
                    label: '关于',
                    click: () => {
                    }
                },
                { type: 'separator' },
                {
                    label: '隐藏',
                    accelerator: 'Command+H',
                    selector: 'hide:',
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit();
                    },
                }
            ]
        };
        const subMenuView: DarwinMenuItemConstructorOptions = {
            label: '视图',
            submenu: [
                {
                    label: '数据刷新',
                    accelerator: 'Command+F',
                    click: () => {
                        this.pollingScheduler.restart();
                    }
                },
                { type: 'separator' },
                {
                    label: '视图刷新',
                    accelerator: 'Command+R',
                    click: () => {
                        this.mainWindow.webContents.reload();
                    }
                },
                {
                    label: '全屏',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                },
                {
                    label: '检查',
                    visible: process.env.NODE_ENV === 'development',
                    accelerator: 'Command+Shift+I',
                    click: () => {
                        this.mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        };
        return [subMenuMain, subMenuView];
    }

    buildDefaultTemplate() {
        const templateDefault: MenuItemConstructorOptions = {
            label: '小金管家',
            submenu: [
                {
                    label: '关于',
                    click: () => {
                    }
                },
                { type: 'separator' },
                {
                    label: '隐藏',
                    accelerator: 'Command+H',
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit();
                    },
                }
            ]
        };

        const subMenuView: DarwinMenuItemConstructorOptions = {
            label: '视图',
            submenu: [
                {
                    label: '数据刷新',
                    accelerator: 'Command+F',
                    click: () => {
                        this.pollingScheduler.restart();
                    }
                },
                { type: 'separator' },
                {
                    label: '视图刷新',
                    accelerator: 'Command+R',
                    click: () => {
                        this.mainWindow.webContents.reload();
                    }
                },
                {
                    label: '全屏',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                },
                {
                    label: '检查',
                    visible: process.env.NODE_ENV === 'development',
                    accelerator: 'Command+Shift+I',
                    click: () => {
                        this.mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        };

        return [templateDefault, subMenuView];
    }
}
