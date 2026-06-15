import { useCallback, useState, type SetStateAction } from 'react'

/** 从本地存储读取状态。 */
export function readStoredState<T>(key: string, fallback: T): T {
  const cached = localStorage.getItem(key)
  return cached ? (JSON.parse(cached) as T) : fallback
}

/** 创建带本地存储的状态。 */
export function useStoredState<T>(key: string, fallback: T, normalize: (value: T) => T = (value) => value) {
  const [value, setValue] = useState<T>(() => normalize(readStoredState(key, fallback)))

  /** 更新状态并同步本地存储。 */
  const updateValue = useCallback((nextValue: SetStateAction<T>) => {
    setValue((currentValue) => {
      const resolvedValue = typeof nextValue === 'function'
        ? (nextValue as (value: T) => T)(currentValue)
        : nextValue
      localStorage.setItem(key, JSON.stringify(resolvedValue))
      return resolvedValue
    })
  }, [key])

  return [value, updateValue] as const
}
