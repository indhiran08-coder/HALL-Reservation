import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, Building2, Phone } from 'lucide-react';

// Validate Indian mobile numbers (10 digits, optional +91 or 0 prefix)
function parsePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return null; // invalid
}

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    department: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { sendPhoneOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.department.trim()) newErrors.department = 'Department is required';
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!parsePhone(form.phone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const e164Phone = parsePhone(form.phone);
    setLoading(true);
    try {
      const { error } = await sendPhoneOtp(e164Phone);
      if (error) {
        toast.error(error.message || 'Failed to send OTP. Please try again.');
        return;
      }
      toast.success('OTP sent to your phone!');
      navigate('/verify-otp', {
        state: {
          phone: e164Phone,
          isRegister: true,
          userData: {
            fullName: form.fullName.trim(),
            department: form.department.trim(),
            email: form.email.trim().toLowerCase(),
            phone: e164Phone,
          },
        },
      });
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const emailValid = form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const emailInvalid = form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">VCET Hall Reservation</span>
          </div>
          <p className="text-slate-400 text-sm">
            For authorized faculty of Velalar College of Engineering and Technology only
          </p>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-slate-400 mt-1">Register and verify via SMS — no password needed!</p>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-3 p-4 bg-primary-900/30 border border-primary-800/50 rounded-xl mb-6">
            <Phone className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary-200">
              Enter your mobile number. You'll receive a 6-digit OTP via SMS to verify your identity.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="form-label">Full Name</label>
              <input name="fullName" type="text" value={form.fullName} onChange={handleChange}
                placeholder="e.g. Dr. Arun Kumar" className="form-input" />
              {errors.fullName && <p className="form-error">⚠ {errors.fullName}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="form-label">Department</label>
              <input name="department" type="text" value={form.department} onChange={handleChange}
                placeholder="e.g. Computer Science and Engineering"
                className="form-input" />
              {errors.department && <p className="form-error">⚠ {errors.department}</p>}
            </div>

            {/* Email (for records only) */}
            <div>
              <label className="form-label">
                College Email <span className="text-slate-500 font-normal text-xs">(for records only)</span>
              </label>
              <div className="relative">
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="yourname@velalarengg.ac.in"
                  className={`form-input pr-10 ${emailInvalid ? 'border-red-500 focus:ring-red-500' : ''}
                               ${emailValid ? 'border-green-500 focus:ring-green-500' : ''}`} />
                {emailValid && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg">✓</span>
                )}
              </div>
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="form-label">Mobile Number</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-sm font-medium">+91</span>
                </div>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="98765 43210"
                  maxLength={15}
                  className="form-input pl-16"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <p className="form-error">⚠ {errors.phone}</p>}
              <p className="text-xs text-slate-500 mt-1.5">OTP will be sent to this number via SMS</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <><span className="spinner" /> Sending OTP...</>
              ) : (
                <><UserPlus className="w-5 h-5" /> Register &amp; Send OTP</>
              )}
            </button>
          </form>

          <div className="section-divider" />
          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
