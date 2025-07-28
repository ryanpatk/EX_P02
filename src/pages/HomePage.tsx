import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabase";
import { useSession } from "../context/SessionContext";

const HomePage = () => {
  const { session } = useSession();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 bg-white p-8 border border-medium-grey">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-black font-mono">EX_P02</h1>
          <p className="text-sm text-gray-600 font-mono">
            Personal Knowledge Management
          </p>
        </div>

        <div className="space-y-4">
          {session ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-mono text-center">
                Welcome back, {session.user.email}
              </p>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="btn-secondary w-full"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link 
                to="/auth/sign-in"
                className="btn-primary block text-center w-full"
              >
                Sign In
              </Link>
              <Link 
                to="/auth/sign-up"
                className="btn-secondary block text-center w-full"
              >
                Sign Up
              </Link>
              
              <div className="text-center">
                <span className="text-sm text-gray-500 font-mono">or</span>
              </div>
              
              <button
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: 'github',
                    options: {
                      redirectTo: `${window.location.origin}/dashboard`
                    }
                  });
                }}
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-medium-grey pt-4">
          <p className="text-xs text-gray-500 font-mono text-center">
            A technical brutalist approach to note-taking and link management
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
