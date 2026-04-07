import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div className="page-shell">
      <div className="page-center">
        <div className="page-card text-center">
          <div className="page-card-header">
            <h1 className="text-2xl font-bold text-black">404 Page Not Found</h1>
            <p className="page-muted">We couldn&apos;t find that page.</p>
          </div>
          <Link to="/" className="btn-secondary w-full text-center">
            Go back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
