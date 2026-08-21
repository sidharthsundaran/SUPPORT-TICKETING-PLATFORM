import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useAppDispatch } from '../../../app/store';
import { setCredentials } from '../../auth/authSlice';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, token } = useAuth();
  const dispatch = useAppDispatch();

  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSendCode = async () => {
    setIsSendingCode(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${baseUrl}/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send verification code');

      setSuccessMessage(`Verification code sent to ${user.email}!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${baseUrl}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');

      // Update Redux state with verified user flag
      if (user && token) {
        dispatch(
          setCredentials({
            user: { ...user, isEmailVerified: true },
            token,
          })
        );
      }

      setSuccessMessage('Email verified successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired code.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full relative z-10 animate-scaleUp">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Verify Your Email</h2>
              <p className="text-xs text-slate-500">Required before creating support tickets (BR-ACC-002)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                {isSendingCode ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <span>Send Code</span>
                )}
              </button>
            </div>

            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[8px] text-xl font-bold py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
            <p className="mt-1.5 text-[11px] text-slate-400 text-center">
              We send a 6-digit code to <strong className="text-slate-600">{user.email}</strong>.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || code.length < 6}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition text-xs flex items-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              {isVerifying ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Verify & Continue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
