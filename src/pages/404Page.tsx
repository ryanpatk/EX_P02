import { Link } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import DarkModeToggle from '../components/DarkModeToggle';

const NotFoundPage = () => {
  return (
    <div className="app-surface page-shell">
      <div className="page-center">
        <div className="page-card">
          <header className="page-card-header">
            <div className="page-card-header-row">
              <AppLogo />
              <DarkModeToggle />
            </div>
            <h1 className="page-card-title">Page not found</h1>
            <p className="page-muted">We couldn&apos;t find that route.</p>
          </header>
          <Link to="/" className="btn-primary w-full">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
