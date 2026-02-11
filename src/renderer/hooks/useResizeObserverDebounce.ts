import React, { useEffect, useRef } from 'react';
import { debounce, DebouncedFunc } from 'lodash';

type ResizeCallback = (entry: ResizeObserverEntry[]) => void;

export function useResizeObserverDebounce<T extends HTMLElement>(
    targetRef: React.RefObject<T | null>,
    callback: ResizeCallback,
    timer: number = 100
) {
    const fnRef = useRef<DebouncedFunc<ResizeCallback>>(null);
    const observer = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        // 更新防抖函数
        fnRef.current = debounce(callback, timer);
    }, [callback, timer]);

    useEffect(() => {
        if(!targetRef?.current) return;
    
        if(observer.current) {
            observer.current.disconnect();
        }
    
        observer.current = new ResizeObserver((entries) => {
            fnRef.current?.(entries);
        });
    
        observer.current.observe(targetRef.current);
    
        return () => {
            observer.current?.disconnect();
            observer.current = null;
        };
    }, [targetRef?.current]); // 只需要依赖targetRef.current
  
    return observer.current;
}