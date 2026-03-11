import { ipcMain } from 'electron';

export async function handleFundSearch(text: string) {
    const api = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?callback=jQuery183045372119396196975_1772179877427&m=1&key=${text}&_=1772179922461`;
    try {
        const res = await fetch(api);
        const jquery = await res.text();
        const startIndex = jquery.indexOf('(');
        const json = jquery.slice(startIndex + 1, -1);
        const data: Record<'label'| 'value', string>[] = [];
        JSON.parse(json).Datas?.forEach((i: any) => {
            if(i.CATEGORYDESC !== '基金') return;
            data.push({
                label: i.NAME,
                value: i.CODE
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

