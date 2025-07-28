import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";

const SignInPage = () => {
  const { session } = useSession();
  if (session) return <Navigate to="/dashboard" />;

  const [status, setStatus] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Logging in...");
    const { error } = await supabase.auth.signInWithPassword({
      email: formValues.email,
      password: formValues.password,
    });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("");
    }
  };

  const handleGitHubSignIn = async () => {
    setStatus("Redirecting to GitHub...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 bg-white p-8 border border-medium-grey">
        <div className="text-center space-y-4">
          <Link to="/" className="btn-secondary text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-black font-mono">Sign In</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            value={formValues.email}
            onChange={handleInputChange}
            type="email"
            placeholder="Email"
            className="input-field w-full"
            required
          />
          <input
            name="password"
            value={formValues.password}
            onChange={handleInputChange}
            type="password"
            placeholder="Password"
            className="input-field w-full"
            required
          />
          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={!!status}
          >
            {status.includes("Logging") ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <div className="space-y-3">
          <div className="text-center">
            <span className="text-sm text-gray-500 font-mono">or</span>
          </div>
          
          <button
            onClick={handleGitHubSignIn}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
            disabled={!!status}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            <span>{status.includes("GitHub") ? "Redirecting..." : "Continue with GitHub"}</span>
          </button>
        </div>

        <div className="text-center">
          <Link to="/auth/sign-up" className="text-sm text-gray-600 hover:text-black transition-colors">
            Don't have an account? <span className="font-bold">Sign Up</span>
          </Link>
        </div>

        {status && !status.includes("Logging") && !status.includes("GitHub") && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-mono">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInPage;
