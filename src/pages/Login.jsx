import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import Alert from "../components/Alert";
import { isAuthenticated, saveAuth, saveUserMeta, decodeTokenPayload } from "../lib/auth";
import autovynLogo from "../assets/autovyn-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/claims", { replace: true });
    }
  }, [navigate]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.userName || !form.password) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.login({
        userName: form.userName,
        password: form.password,
      });
      const payload = data?.Data ?? data?.data ?? data ?? {};
      saveAuth({
        token: payload.token,
        expiration: payload.expiration,
        userId: payload.UserID ?? payload.userId,
        isAdmin: payload.isAdmin,
      });
      const tokenPayload = decodeTokenPayload(payload.token);
      saveUserMeta({
        userName: tokenPayload?.UserName || tokenPayload?.userName,
        departmentId: tokenPayload?.DepartmentID || tokenPayload?.departmentId,
        departmentName: tokenPayload?.DepartmentName || tokenPayload?.departmentName,
      });
      navigate("/claims", { replace: true });
    } catch (err) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
        <div className="grid w-full gap-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft lg:grid-cols-[1.1fr_1fr]">
          <div className="hidden flex-col justify-between rounded-2xl bg-brand-600/10 p-6 text-slate-900 lg:flex">
            <div>
              <div className="mb-6 flex items-center">
                <img
                  src={autovynLogo}
                  alt="Autovyn"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Reimbursely Console
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                Track claims, approvals, and payouts with a single workflow.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Created By akshay.jangid@autovyn.in
              </p>
            </div>
            <div className="rounded-2xl border border-white/40 bg-white/60 p-4 text-xs text-slate-600">
              Secure access for managers, finance, HR, and approvers.
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Sign In
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Use your credentials to continue.
              </p>
            </div>

            <Alert tone="error" message={error} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Username
                </label>
                <input
                  type="text"
                  value={form.userName}
                  onChange={updateField("userName")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={updateField("password")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 hover:bg-gradient-to-br hover:from-gray-900 hover:via-slate-900 hover:to-blue-900"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
