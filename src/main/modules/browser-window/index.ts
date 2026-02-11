import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { isDebug } from '../env';
import { installExtensions } from '../extensions';
import { resolveHtmlPath } from '../../util';
import { MenuBuilder } from '../menu';
import '../polling-scheduler';
import { container } from '../../container';
import { SYMBOLS } from '../../symbols';

let mainWindow: BrowserWindow | null = null;

container.bind<() => BrowserWindow | null>(SYMBOLS.MainBrowserFactory).toFactory(() => {
    return () => mainWindow;
});

export async function createWindow() {
    if(isDebug) {
        await installExtensions();
    }
    
    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');
    
    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths);
    };
    
    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        minWidth: 950,
        minHeight: 700,
        backgroundColor: '#fff',
        title: '',
        icon: getAssetPath('icon.png'),
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });
    
    mainWindow.loadURL(resolveHtmlPath('index.html'));
    
    mainWindow.on('ready-to-show', () => {
        if(!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if(process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
        }
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    const menuBuilder = container.get(MenuBuilder);
    menuBuilder.buildMenu();
    
    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });

    return mainWindow;
    
    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    //   new AppUpdater();
}