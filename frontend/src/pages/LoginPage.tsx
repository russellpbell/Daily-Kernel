import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api";
import { useAuth } from "../App";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { logIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pin.length !== 4) return;

    setLoading(true);
    setError(null);

    try {
      const fn = isRegister ? register : login;
      const result = await fn(name.trim(), pin);
      logIn(result.token, result.name);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Daily Kernel
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Your daily news briefing, distilled.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoComplete="username"
              className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              4-Digit PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(val);
              }}
              placeholder="----"
              autoComplete="current-password"
              className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2 px-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || pin.length !== 4}
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRegister ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors min-h-[44px] px-4"
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
