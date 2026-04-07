import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const ProtectedPage = () => {
  const { session } = useSession();
  return (
    <div className="page-shell">
      <div className="page-center">
        <div className="page-card">
          <div className="page-card-actions">
            <Link className="btn-secondary text-sm" to="/">
              ◄ Home
            </Link>
          </div>
          <div className="page-card-header">
            <h1 className="text-2xl font-bold text-black">This is a Protected Page</h1>
            <p className="page-muted">Current User: {session?.user.email || "None"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedPage;
