import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MemexSidebar from './MemexSidebar';
import { MODULES } from '../constants/modules';
import { rememberModulePath } from '../utils/lastModule';

const MemexShell = () => {
  const location = useLocation();

  useEffect(() => {
    rememberModulePath(location.pathname);

    const module = MODULES.find(
      (m) =>
        location.pathname === m.path || location.pathname.startsWith(`${m.path}/`),
    );
    document.title = module ? `${module.label} · memex` : 'memex';
  }, [location.pathname]);

  return (
    <div className="memex-shell">
      <MemexSidebar />
      <div className="memex-shell-main">
        <Outlet />
      </div>
    </div>
  );
};

export default MemexShell;
