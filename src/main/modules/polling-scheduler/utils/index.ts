export function handleMetalApiData(target: string) {
    const data = `{${target.replace(/^var .* = {/, '')}`;
    return JSON.parse(data);
}

export function digitLength(num: number) {
    return Math.abs(num).toString().split('.')[0].length;
}