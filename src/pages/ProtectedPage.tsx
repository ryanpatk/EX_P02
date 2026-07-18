import { Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import AppLogo from '../components/AppLogo';
import DarkModeToggle from '../components/DarkModeToggle';

const ProtectedPage = () => {
  const { session } = useSession();
  return (
    <div className="app-surface page-shell">
      <div className="page-center">
        <div className="page-card">
          <header className="page-card-header">
            <div className="page-card-header-row">
              <AppLogo />
              <DarkModeToggle />
            </div>
            <h1 className="page-card-title">Protected page</h1>
            <p className="page-muted">
              Signed in as {session?.user.email || 'unknown user'}
            </p>
          </header>
          <Link className="btn-secondary w-full" to="/">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProtectedPage;
