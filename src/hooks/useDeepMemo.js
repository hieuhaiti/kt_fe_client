import { useMemo, useRef } from 'react';
import isEqual from 'react-fast-compare';

function useDeepMemo(callback, dependencies) {
  const dependencyRef = useRef(dependencies);

  if (!isEqual(dependencyRef.current, dependencies)) {
    dependencyRef.current = dependencies;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(callback, dependencyRef.current);
}

export default useDeepMemo;
