import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await api.post("/users/register", { email, username, password });
      }

      const response = await api.post("/users/login", { username, password });
      const { access_token } = response.data;

      // Get user info
      const userResponse = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      login(userResponse.data, access_token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-pf-950">
      <div className="w-full max-w-md rounded-lg border border-pf-border bg-pf-900 p-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-pf-400 text-white">
            <Zap size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-semibold text-pf-100">ProjectFlow</h1>
          <p className="text-sm text-pf-700">
            {isRegister ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-xs font-medium text-pf-muted-fg">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pf-input"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-pf-muted-fg">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pf-input"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-pf-muted-fg">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pf-input"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-md bg-[var(--pf-destructive)]/10 p-3 text-sm text-[var(--pf-destructive)]" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pf-btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading…
              </span>
            ) : isRegister ? "Register" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-pf-700">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-pf-400 hover:underline"
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}