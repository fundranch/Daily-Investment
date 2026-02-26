export async function getFundList() {
    const data: Record<'code' | 'value' | 'label' | 'name', string>[] = [];
    try {
        const result = await Promise.allSettled([
            window.electron.ipcRenderer.invoke('get-hold-fund'),
            window.electron.ipcRenderer.invoke('get-self-selected-fund'),
        ]);
        result.forEach(i => {
            if(i.status === 'rejected' || !i.value) return;
            i.value.forEach((c: (typeof data)[number]) => {
                if(data.find(f => f.code === c.code)) return;
                data.push({ ...c, label: c.name, value: c.code });
            });
        });
    } catch(e) {
        console.error(e);
    }
    return data;
}

export const METAL_OPTIONS = [
    { label: '现货黄金', value: 'au' },
    { label: '民生黄金', value: 'aums' },
    { label: '沪金主力', value: 'aum' },
    { label: '现货白银', value: 'ag' }
];

export const NOTIFICATION_TYPE = [
    { label: '定时', value: 'timer' },
    { label: '震幅', value: 'amplitude' }
];

export const TIMER_OPTIONS = [
    { label: '1分钟', value: 1000 * 60 },
    { label: '3分钟', value: 1000 * 60 * 3 },
    { label: '5分钟', value: 1000 * 60 * 5 },
    { label: '10分钟', value: 1000 * 60 * 10 },
];
