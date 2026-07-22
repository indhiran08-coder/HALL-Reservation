import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, CheckCircle2, Building2 } from 'lucide-react';

export default function OtpVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 min timer
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto-advance
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifyOtp({ email, otp: otpString });
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      toast.error(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendOtp(email);
      toast.success('New OTP sent to your email!');
      setCountdown(120);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary-400" />
            <span className="text-xl font-bold text-white">VCET Hall Reservation</span>
          </div>
        </div>

        <div className="card text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-primary-900/50 border border-primary-700/50 
                            flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-slate-400 mb-2">
            We've sent a 6-digit OTP to:
          </p>
          <p className="text-primary-400 font-semibold mb-6">{email}</p>

          {/* OTP Input Boxes */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2
                            bg-slate-900 text-white transition-all duration-200
                            focus:outline-none focus:ring-0
                            ${digit ? 'border-primary-500 bg-primary-900/20' : 'border-slate-700'}
                            focus:border-primary-400`}
              />
            ))}
          </div>

          {/* Countdown */}
          <p className="text-slate-400 text-sm mb-6">
            {countdown > 0 ? (
              <>OTP expires in <span className="text-primary-400 font-semibold">{formatCountdown(countdown)}</span></>
            ) : (
              <span className="text-red-400">OTP has expired. Please request a new one.</span>
            )}
          </p>

          {/* Verify Button */}
          <button onClick={handleVerify} disabled={loading || otp.join('').length !== 6}
            className="btn-primary w-full mb-4">
            {loading ? (
              <><span className="spinner" /> Verifying...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Verify OTP</>
            )}
          </button>

          {/* Resend */}
          <button onClick={handleResend}
            disabled={resending || countdown > 0}
            className="btn-secondary w-full disabled:opacity-40">
            {resending ? (
              <><span className="spinner" /> Sending...</>
            ) : (
              <><RefreshCw className="w-4 h-4" />
                {countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : 'Resend OTP'}</>
            )}
          </button>

          <p className="text-slate-500 text-xs mt-4">
            Check your spam folder if you don't see the email.
          </p>
        </div>
      </div>
    </div>
  );
}
