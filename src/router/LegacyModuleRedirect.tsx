import { Navigate, useLocation } from 'react-router-dom';
import { HOME_PATH, ItemType, TYPE_PARAM } from '../constants/modules';

interface LegacyModuleRedirectProps {
  /** Type filter to preselect on Home (omit to land on the unfiltered stream). */
  type?: ItemType;
}

/**
 * The old per-primitive module routes (/links, /notes, /tasks) now land on
 * Home with that type preselected. Existing query params (e.g. a
 * `?note=<id>` deep link) are carried along.
 */
const LegacyModuleRedirect = ({ type }: LegacyModuleRedirectProps) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (type) {
    params.set(TYPE_PARAM, type);
  }
  const search = params.toString();
  return <Navigate to={`${HOME_PATH}${search ? `?${search}` : ''}`} replace />;
};

export default LegacyModuleRedirect;
