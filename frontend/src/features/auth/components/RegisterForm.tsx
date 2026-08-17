import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRegisterMutation } from '../authApi';
import { registerSchema } from '../schemas/auth.schema';
import { ApiError } from '../../../types/api';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const [register, { isLoading, isSuccess }] = useRegisterMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const parseResult = registerSchema.safeParse({ name, email, password });

    if (!parseResult.success) {
      const errors: { name?: string; email?: string; password?: string } = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0] === 'name') errors.name = issue.message;
        if (issue.path[0] === 'email') errors.email = issue.message;
        if (issue.path[0] === 'password') errors.password = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await register({
        name: parseResult.data.name,
        email: parseResult.data.email,
        password: parseResult.data.password,
        userType: 'client',
      }).unwrap();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorPayload = err as ApiError;
      setErrorMessage(
        errorPayload?.data?.message || 'Registration failed. Please try again.'
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
          <span>Account created successfully! Redirecting...</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border ${
              fieldErrors.name ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
            } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all text-sm font-normal`}
          />
        </div>
        {fieldErrors.name && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
        )}
      </div>

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
            placeholder="Minimum 8 characters"
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
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {onSwitchToLogin && (
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline underline-offset-4 transition"
            >
              Sign In
            </button>
          </p>
        </div>
      )}
    </form>
  );
};

export default RegisterForm;





