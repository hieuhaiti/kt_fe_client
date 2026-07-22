import { memo } from 'react';
import { HashLoader } from 'react-spinners';

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 flex items-center justify-center transition-all duration-300 bg-background z-10000 backdrop-blur-sm">
      <HashLoader color="#14b8a5" />
    </div>
  );
}

export default memo(LoadingOverlay);
