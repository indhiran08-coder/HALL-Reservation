import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, Building2, Mail, AtSign } from 'lucide-react';

const COLLEGE_DOMAIN = 'velalarengg.ac.in';

function isCollegeEmail(email) {
  return email.toLowerCase().trim().endsWith(`@${COLLEGE_DOMAIN}`);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    department: '',
    collegeEmail: '',   // @velalarengg.ac.in — stored in profile for records
    personalEmail: '',  // any Gmail/Yahoo — used for OTP & Supabase auth
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
    if (!form.fullName.trim())
      newErrors.fullName = 'Full name is required';
    if (!form.department.trim())
      newErrors.department = 'Department is required';

    // College email — must be @velalarengg.ac.in
    if (!form.collegeEmail) {
      newErrors.collegeEmail = 'College email is required';
    } else if (!isValidEmail(form.collegeEmail)) {
      newErrors.collegeEmail = 'Please enter a valid email address';
    } else if (!isCollegeEmail(form.collegeEmail)) {
      newErrors.collegeEmail = `Must be a @${COLLEGE_DOMAIN} address`;
    }

    // Personal email — any valid email, must not be college domain
    if (!form.personalEmail) {
      newErrors.personalEmail = 'Personal email is required';
    } else if (!isValidEmail(form.personalEmail)) {
      newErrors.personalEmail = 'Please enter a valid email address';
    } else if (isCollegeEmail(form.personalEmail)) {
      newErrors.personalEmail = `Use a personal email (Gmail, Yahoo, etc.) — not your college address`;
    } else if (form.personalEmail.trim().toLowerCase() === form.collegeEmail.trim().toLowerCase()) {
      newErrors.personalEmail = 'Personal email must be different from your college email';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    const personalEmail = form.personalEmail.trim().toLowerCase();
    const collegeEmail  = form.collegeEmail.trim().toLowerCase();

    setLoading(true);
    try {
      // OTP is sent to personal email (reliable delivery)
      const { error } = await sendEmailOtp(personalEmail, true);
      if (error) {
        toast.error(error.message || 'Failed to send OTP. Please try again.');
        return;
      }
      toast.success('OTP sent to your personal email!');
      navigate('/verify-otp', {
        state: {
          email: personalEmail,        // Supabase auth identity — used for OTP
          isRegister: true,
          userData: {
            fullName:     form.fullName.trim(),
            department:   form.department.trim(),
            collegeEmail,              // stored in profiles.email for records
          },
        },
      });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Live validation state for college email
  const ceTyped   = form.collegeEmail.length > 0;
  const ceValid   = ceTyped && isCollegeEmail(form.collegeEmail) && isValidEmail(form.collegeEmail);
  const ceWrong   = ceTyped && !ceValid;

  // Live validation state for personal email
  const peTyped   = form.personalEmail.length > 0;
  const peValid   = peTyped && isValidEmail(form.personalEmail) && !isCollegeEmail(form.personalEmail);
  const peWrong   = peTyped && !peValid;

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
            <p className="text-slate-400 mt-1">Register with your college details — no password needed!</p>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-3 p-4 bg-primary-900/30 border border-primary-800/50 rounded-xl mb-6">
            <Mail className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-200 space-y-1">
              <p><strong>College email</strong> is recorded for identity verification.</p>
              <p><strong>Personal email</strong> (Gmail, Yahoo, etc.) is used to receive your OTP — since college servers may block delivery.</p>
            </div>
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

            {/* College Email — records only */}
            <div>
              <label className="form-label">
                College Email
                <span className="text-slate-500 font-normal text-xs ml-2">(for records)</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="collegeEmail"
                  type="email"
                  value={form.collegeEmail}
                  onChange={handleChange}
                  placeholder={`yourname@${COLLEGE_DOMAIN}`}
                  autoComplete="off"
                  className={`form-input pl-10 pr-10
                    ${ceWrong ? 'border-red-500 focus:ring-red-500' : ''}
                    ${ceValid ? 'border-green-500 focus:ring-green-500' : ''}`}
                />
                {ceValid && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg">✓</span>}
                {ceWrong && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-lg">✗</span>}
              </div>
              {errors.collegeEmail
                ? <p className="form-error">⚠ {errors.collegeEmail}</p>
                : <p className="text-xs text-slate-500 mt-1.5">Must be a <span className="text-primary-400">@{COLLEGE_DOMAIN}</span> address</p>
              }
            </div>

            {/* Personal Email — OTP delivery */}
            <div>
              <label className="form-label">
                Personal Email
                <span className="text-slate-500 font-normal text-xs ml-2">(OTP will be sent here)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="personalEmail"
                  type="email"
                  value={form.personalEmail}
                  onChange={handleChange}
                  placeholder="yourname@gmail.com"
                  autoComplete="email"
                  className={`form-input pl-10 pr-10
                    ${peWrong ? 'border-red-500 focus:ring-red-500' : ''}
                    ${peValid ? 'border-green-500 focus:ring-green-500' : ''}`}
                />
                {peValid && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg">✓</span>}
                {peWrong && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-lg">✗</span>}
              </div>
              {errors.personalEmail
                ? <p className="form-error">⚠ {errors.personalEmail}</p>
                : <p className="text-xs text-slate-500 mt-1.5">Use Gmail, Yahoo, or any personal email for reliable OTP delivery</p>
              }
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
