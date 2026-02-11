import { useEffect, useRef } from 'react';

export function useMemoizedFn<T extends(...args: any[]) => any>(fn: T) {
    const fnRef = useRef(fn);
    // 不需要useEffect，直接同步更新
    fnRef.current = fn;
    
    const memoizedFn = useRef<T>(null);
    if(!memoizedFn.current) {
        memoizedFn.current = function (this: any, ...args: any[]) {
            return fnRef.current.apply(this, args);
        } as T;
    }

    return memoizedFn.current;
};

