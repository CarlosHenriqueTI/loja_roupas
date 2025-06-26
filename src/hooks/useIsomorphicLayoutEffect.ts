import { useEffect, useLayoutEffect } from 'react';

// Hook para evitar warnings de useLayoutEffect no SSR
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;