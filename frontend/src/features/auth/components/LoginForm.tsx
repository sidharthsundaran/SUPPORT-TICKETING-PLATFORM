import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLoginMutation } from '../authApi';
import { loginSchema } from '../schemas/auth.schema';
import { ApiError } from '../../../types/api';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const [login, { isLoading, isSuccess }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const parseResult = loginSchema.safeParse({ email, password });

    if (!parseResult.success) {
      const errors: { email?: string; password?: string } = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0] === 'email') errors.email = issue.message;
        if (issue.path[0] === 'password') errors.password = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      const result = await login(parseResult.data).unwrap();
      if (onSuccess) {
        onSuccess();
      } else if (result?.data?.user) {
        const u = result.data.user;
        if (u.isPlatformAdmin) {
          navigate('/admin/dashboard');
        } else if (u.userType === 'internal') {
          navigate('/internal/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const errorPayload = err as ApiError;
      setErrorMessage(
        errorPayload?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSuccess && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Authenticated successfully! Redirecting...</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border ${
              fieldErrors.email ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
            } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all text-sm font-normal`}
          />
        </div>
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border ${
              fieldErrors.password ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
            } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all text-sm font-normal`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm active:scale-[0.99]"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {onSwitchToRegister && (
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline underline-offset-4 transition"
            >
              Create Account
            </button>
          </p>
        </div>
      )}
    </form>
  );
};

export default LoginForm;




