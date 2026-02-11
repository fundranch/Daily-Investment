import { ipcMain } from 'electron';
import * as cheerio from 'cheerio';
import { FAKE_HEADERS } from '../polling-scheduler/apis/config';

async function handleFundSearch(text: string) {
    const api = `https://www.dayfund.cn/search.html?wd=${text}`;
    try {
        const res = await fetch(api, {
            headers: FAKE_HEADERS
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const table = $('.idata table');
        const data: {label: string, value: string}[] = [];
        table.find('tr').each((_, tr) => {
            if(tr.attributes.some(i => i.name === 'class' && i.value === 'rowh')) return;
            const label = $(tr).find('td').eq(1).text().trim();
            const value = $(tr).find('td').eq(0).text().trim();
            data.push({
                label,
                value
            });
        });
        return data;
    } catch(e) {
        return [];
    }
    
}

ipcMain.handle('fund-search', async (event, searchText: string) => {
    const data = await handleFundSearch(searchText);
    return data;
});

