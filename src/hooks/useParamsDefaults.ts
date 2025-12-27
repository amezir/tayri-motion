import { useRef } from "react";

type Params = Record<string, any>;

export default function useParamsDefaults(
  paramsRef: React.RefObject<Params>
) {
  const defaultsRef = useRef<Params>(
    paramsRef?.current ? JSON.parse(JSON.stringify(paramsRef.current)) : {}
  );

  const getDefaults = (keys: string[]) => {
    const base = defaultsRef.current || {};
    return keys.reduce((acc: Partial<Params>, k: string) => {
      acc[k] = base[k];
      return acc;
    }, {});
  };

  const isModified = (keys: string[]) => {
    const base = defaultsRef.current || {};
    const p = paramsRef?.current || {};
    return keys.some((k) => p?.[k] !== base?.[k]);
  };

  return { getDefaults, isModified, defaults: defaultsRef.current } as const;
}
