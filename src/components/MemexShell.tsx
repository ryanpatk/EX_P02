import { useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import MemexSidebar from './MemexSidebar';
import { useProfiles } from '../hooks/useProfiles';
import { rememberModulePath } from '../utils/lastModule';

const MemexShell = () => {
  const location = useLocation();
  const { spaceId } = useParams<{ spaceId?: string }>();
  const { data: profiles } = useProfiles();

  useEffect(() => {
    rememberModulePath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const space = spaceId ? profiles?.find((p) => p.id === spaceId) : undefined;
    document.title = space ? `${space.name} · memex` : 'memex';
  }, [profiles, spaceId]);

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
