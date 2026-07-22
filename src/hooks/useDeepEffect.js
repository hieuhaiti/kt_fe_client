import { useEffect, useRef } from 'react';
import isEqual from 'react-fast-compare';

const useDeepEffect = (callback, dependencies) => {
  const dependencyRef = useRef(dependencies);

  if (!isEqual(dependencyRef.current, dependencies)) {
    dependencyRef.current = dependencies;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, dependencyRef.current);
};

export default useDeepEffect;
