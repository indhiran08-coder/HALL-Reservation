import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Phone, RefreshCw, CheckCircle2, Building2 } from 'lucide-react';

/** Mask phone: +919876543210 → +91 98765 43210 */
function maskPhone(e164) {
  if (!e164) return '';
  // Strip leading +91 / +1 etc. and show last 10 as XX XXXXX XXXXX
  const cc = e164.startsWith('+91') ? '+91' : e164.slice(0, 3);
  const local = e164.slice(cc.length); // 10 digits
  if (local.length === 10) {
    return `${cc} ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return e164;
}

export default function OtpVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyPhoneOtp, sendPhoneOtp } = useAuth();

  // Expect: { phone, isRegister, userData? }
  const phone = location.state?.phone || '';
  const isRegister = location.state?.isRegister ?? false;
  const userData = location.state?.userData || {};

  useEffect(() => {
    if (!phone) navigate('/login');
    else inputRefs.current[0]?.focus();
  }, [phone, navigate]);

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
      const { error } = await verifyPhoneOtp(phone, otpString, isRegister, userData);
      if (error) {
        toast.error(error.message || 'Invalid code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }
      toast.success('✅ Verified! Welcome to VCET Hall Reservation.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await sendPhoneOtp(phone);
      if (error) { toast.error(error.message || 'Failed to resend'); return; }
      toast.success('New OTP sent to your phone via SMS!');
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
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-primary-900/50 border border-primary-700/50
                            flex items-center justify-center">
              <Phone className="w-10 h-10 text-primary-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Check Your SMS</h2>
          <p className="text-slate-400 mb-2">We've sent a 6-digit code to:</p>
          <p className="text-primary-400 font-semibold mb-6">{maskPhone(phone)}</p>

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
                            ${digit ? 'border-primary-500 bg-primary-900/20' : 'border-slate-700'}
                            focus:border-primary-400`}
              />
            ))}
          </div>

          <p className="text-slate-400 text-sm mb-6">
            {countdown > 0 ? (
              <>Code expires in <span className="text-primary-400 font-semibold">{formatCountdown(countdown)}</span></>
            ) : (
              <span className="text-red-400">Code has expired. Please request a new one.</span>
            )}
          </p>

          <button onClick={handleVerify} disabled={loading || otp.join('').length !== 6}
            className="btn-primary w-full mb-4">
            {loading ? (
              <><span className="spinner" /> Verifying...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> Verify Code</>
            )}
          </button>

          <button onClick={handleResend}
            disabled={resending || countdown > 0}
            className="btn-secondary w-full disabled:opacity-40">
            {resending ? (
              <><span className="spinner" /> Sending...</>
            ) : (
              <><RefreshCw className="w-4 h-4" />
                {countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : 'Resend Code'}</>
            )}
          </button>

          <p className="text-slate-500 text-xs mt-4">
            Didn't receive an SMS? Make sure your phone number is correct and try resending.
          </p>
        </div>
      </div>
    </div>
  );
}
