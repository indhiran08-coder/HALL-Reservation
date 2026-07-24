import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, Building2, Mail } from 'lucide-react';

const COLLEGE_DOMAIN = 'velalarengg.ac.in';

/** Returns true only for @velalarengg.ac.in addresses */
function isCollegeEmail(email) {
  return email.toLowerCase().trim().endsWith(`@${COLLEGE_DOMAIN}`);
}

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    department: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { sendEmailOtp } = useAuth();
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
      newErrors.email = 'Please enter a valid email address';
    } else if (!isCollegeEmail(form.email)) {
      newErrors.email = `Only @${COLLEGE_DOMAIN} email addresses are accepted`;
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const cleanEmail = form.email.trim().toLowerCase();
    setLoading(true);
    try {
      // shouldCreateUser: true — creates a new Supabase auth user for first-time registration
      const { error } = await sendEmailOtp(cleanEmail, true);
      if (error) {
        toast.error(error.message || 'Failed to send OTP. Please try again.');
        return;
      }
      toast.success('OTP sent to your college email!');
      navigate('/verify-otp', {
        state: {
          email: cleanEmail,
          isRegister: true,
          userData: {
            fullName: form.fullName.trim(),
            department: form.department.trim(),
          },
        },
      });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const emailTyped = form.email.length > 0;
  const emailValid  = emailTyped && isCollegeEmail(form.email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const emailWrong  = emailTyped && !emailValid;

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
            <p className="text-slate-400 mt-1">Register with your college email — no password needed!</p>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-3 p-4 bg-primary-900/30 border border-primary-800/50 rounded-xl mb-6">
            <Mail className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary-200">
              A 6-digit OTP will be sent to your <strong>@{COLLEGE_DOMAIN}</strong> email to verify your identity.
              Gmail and other addresses are not accepted.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="form-label">Full Name</label>
              <input
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g. Dr. Arun Kumar"
                className="form-input"
              />
              {errors.fullName && <p className="form-error">⚠ {errors.fullName}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="form-label">Department</label>
              <input
                name="department"
                type="text"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science and Engineering"
                className="form-input"
              />
              {errors.department && <p className="form-error">⚠ {errors.department}</p>}
            </div>

            {/* College Email */}
            <div>
              <label className="form-label">
                College Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={`yourname@${COLLEGE_DOMAIN}`}
                  autoComplete="email"
                  className={`form-input pl-10 pr-10
                    ${emailWrong ? 'border-red-500 focus:ring-red-500' : ''}
                    ${emailValid ? 'border-green-500 focus:ring-green-500' : ''}`}
                />
                {emailValid && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg">✓</span>
                )}
                {emailWrong && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-lg">✗</span>
                )}
              </div>
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
              {!errors.email && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Only <span className="text-primary-400 font-medium">@{COLLEGE_DOMAIN}</span> addresses are accepted
                </p>
              )}
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
