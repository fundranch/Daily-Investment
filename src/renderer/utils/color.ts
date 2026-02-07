export const COLORS = {
    win: '#ff4144',
    lose: '#1db270',
    tie: '#666666'
};

export function getColorByStatus(status: number) {
    let color = COLORS.tie;
    if(status < 0) {
        color = COLORS.lose;
    } else if(status > 0) {
        color = COLORS.win;
    }
    return color;
}