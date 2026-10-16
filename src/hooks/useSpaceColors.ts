import { useMemo } from 'react';
import { useProfiles } from './useProfiles';
import { buildSpaceColors } from '../utils/spaceColor';

/** Space id → identity colour (see utils/spaceColor). */
export const useSpaceColors = () => {
  const { data: profiles } = useProfiles();
  return useMemo(() => buildSpaceColors(profiles), [profiles]);
};
