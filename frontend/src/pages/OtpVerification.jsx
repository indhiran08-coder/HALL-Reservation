import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, CheckCircle2, Building2, Shield } from 'lucide-react';

/** Partially mask email: admin@example.com → ad***@example.com */
function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export default function OtpVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmailOtp, sendEmailOtp } = useAuth();

  // Route state:
  //   Staff login:    { email, isRegister: false }
  //   Staff register: { email, isRegister: true, userData: { fullName, department } }
  //   Admin login:    { email, isAdmin: true, isRegister: false }
  const email      = location.state?.email      || '';
  const isAdmin    = location.state?.isAdmin    ?? false;
  const isRegister = location.state?.isRegister ?? false;
  const userData   = location.state?.userData   || {};

  useEffect(() => {
    if (!email) navigate('/login');
    else inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
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
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const { error } = await verifyEmailOtp(email, otpString, isRegister, userData);
      if (error) {
        toast.error(error.message || 'Invalid code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }
      toast.success('✅ Verified! Welcome to VCET Hall Reservation.');
      navigate('/dashboard');
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      // Registration resend needs shouldCreateUser: true; login uses false
      const { error } = await sendEmailOtp(email, isRegister);
      if (error) { toast.error(error.message || 'Failed to resend'); return; }
      toast.success('New OTP sent to your email!');
      setCountdown(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Amber colour scheme for admin, blue for staff
  const amber = isAdmin;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary-400" />
            <span className="text-xl font-bold text-white">VCET Hall Reservation</span>
          </div>
        </div>

        <div className="card text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border
              ${amber
                ? 'bg-amber-900/40 border-amber-700/50'
                : 'bg-primary-900/50 border-primary-700/50'}`}>
              {amber
                ? <Shield className="w-10 h-10 text-amber-400" />
                : <Mail className="w-10 h-10 text-primary-400" />
              }
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-slate-400 mb-1">We've sent a 6-digit code to:</p>
          <p className={`font-semibold mb-6 ${amber ? 'text-amber-400' : 'text-primary-400'}`}>
            {maskEmail(email)}
          </p>

          {/* OTP Input */}
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
                            ${digit
                              ? (amber ? 'border-amber-500 bg-amber-900/20' : 'border-primary-500 bg-primary-900/20')
                              : 'border-slate-700'}
                            ${amber ? 'focus:border-amber-400' : 'focus:border-primary-400'}`}
              />
            ))}
          </div>

          <p className="text-slate-400 text-sm mb-6">
            {countdown > 0 ? (
              <>Code expires in{' '}
                <span className={`font-semibold ${amber ? 'text-amber-400' : 'text-primary-400'}`}>
                  {formatCountdown(countdown)}
                </span>
              </>
            ) : (
              <span className="text-red-400">Code has expired. Please request a new one.</span>
            )}
          </p>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                        font-semibold text-white transition-all duration-200 mb-4
                        disabled:opacity-60 disabled:cursor-not-allowed
                        ${amber
                          ? 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30'
                          : 'btn-primary'}`}
          >
            {loading ? (
              <><span className="spinner" /> Verifying...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Verify Code</>
            )}
          </button>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="btn-secondary w-full disabled:opacity-40"
          >
            {resending ? (
              <><span className="spinner" /> Sending...</>
            ) : (
              <><RefreshCw className="w-4 h-4" />
                {countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : 'Resend Code'}</>
            )}
          </button>

          <p className="text-slate-500 text-xs mt-4">
            Check your spam/junk folder if you don't see the email.
          </p>
        </div>
      </div>
    </div>
  );
}
