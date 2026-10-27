import { useEffect, type ReactNode } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import MemexSidebar from './MemexSidebar';
import { useProfiles } from '../hooks/useProfiles';

/** The signed-in frame: sidebar + the current page (an Outlet, or the Journal at `/`). */
const MemexShell = ({ children }: { children?: ReactNode }) => {
  const { spaceId } = useParams<{ spaceId?: string }>();
  const { data: profiles } = useProfiles();

  useEffect(() => {
    const space = spaceId ? profiles?.find((p) => p.id === spaceId) : undefined;
    document.title = space ? `${space.name} · memex` : 'memex';
  }, [profiles, spaceId]);

  return (
    <div className="memex-shell">
      <MemexSidebar />
      <div className="memex-shell-main">
        {children ?? <Outlet />}
      </div>
    </div>
  );
};

export default MemexShell;
