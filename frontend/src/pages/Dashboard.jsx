import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, hallAPI } from '../services/api';
import { format } from 'date-fns';
import {
  Building2, CalendarDays, Clock, Users, TrendingUp,
  ChevronRight, CheckCircle, XCircle, Zap
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [todayEvents, setTodayEvents] = useState([]);
  const [halls, setHalls] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds for live availability
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, hallsRes, myRes] = await Promise.all([
        bookingAPI.getToday(),
        hallAPI.getAll(),
        bookingAPI.getMyBookings(),
      ]);
      setTodayEvents(todayRes.data.data || []);
      setHalls(hallsRes.data.data || []);
      setMyBookings(myRes.data.data || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmed = myBookings.filter(b => b.status === 'CONFIRMED');
  const upcoming = confirmed.filter(b => new Date(b.bookingDate) >= new Date(format(new Date(), 'yyyy-MM-dd')));
  const available = halls.filter(h => !h.currentlyBooked);
  const booked = halls.filter(h => h.currentlyBooked);

  const stats = [
    {
      label: 'My Upcoming',
      value: upcoming.length,
      icon: CalendarDays,
      color: 'text-primary-400',
      bg: 'bg-primary-900/30',
      border: 'border-primary-800/50',
    },
    {
      label: 'Halls Available',
      value: available.length,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-800/40',
    },
    {
      label: 'Currently Booked',
      value: booked.length,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-800/40',
    },
    {
      label: "Today's Events",
      value: todayEvents.length,
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-800/40',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* ─── Welcome Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
            Good {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 truncate">
            {format(new Date(), 'EEE, MMM dd')} &bull; {user?.department}
          </p>
        </div>
        <Link to="/book" className="btn-primary text-sm py-2 px-4 flex-shrink-0">
          <CalendarDays className="w-4 h-4" />
          <span className="hidden sm:inline">Book a Hall</span>
          <span className="sm:hidden">Book</span>
        </Link>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className={`card border ${stat.border}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Live Hall Availability ─── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-400" />
              Live Hall Availability
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>

          <div className="space-y-3">
            {halls.map(hall => (
              <div key={hall.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div>
                  <p className="font-medium text-white text-sm">{hall.hallName}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{hall.location}</p>
                </div>
                {hall.currentlyBooked ? (
                  <span className="badge-red">
                    <span className="status-dot-booked" /> Booked
                  </span>
                ) : (
                  <span className="badge-green">
                    <span className="status-dot-available" /> Available
                  </span>
                )}
              </div>
            ))}
          </div>

          <Link to="/calendar" className="flex items-center gap-2 text-primary-400 hover:text-primary-300 
                                          text-sm font-medium mt-4 transition-colors">
            View Full Calendar <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ─── Today's Upcoming Events ─── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Today's Upcoming Events
            </h2>
            <span className="text-xs text-slate-400">{format(new Date(), 'MMM dd')}</span>
          </div>

          {todayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarDays className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-slate-500">No upcoming events today</p>
              <Link to="/book" className="text-primary-400 text-sm mt-2 hover:text-primary-300">
                Book a hall →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents.slice(0, 5).map(event => (
                <div key={event.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="w-1 h-full min-h-[40px] rounded-full bg-primary-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{event.eventName}</p>
                    <p className="text-primary-400 text-xs font-medium">{event.hallName}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {formatTime(event.startTime)} – {formatTime(event.endTime)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{event.department?.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── My Recent Bookings ─── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            My Recent Bookings
          </h2>
          <Link to="/my-bookings" className="text-sm text-primary-400 hover:text-primary-300
                                             flex items-center gap-1 transition-colors">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {myBookings.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500">No bookings yet.</p>
            <Link to="/book" className="text-primary-400 text-sm mt-1 hover:text-primary-300 inline-block">
              Make your first booking →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myBookings.slice(0, 5).map(b => (
              <div key={b.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                {/* Color bar */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0
                  ${b.status === 'CANCELLED' ? 'bg-red-500' :
                    new Date(b.bookingDate) < new Date(format(new Date(), 'yyyy-MM-dd')) ? 'bg-slate-600' :
                    'bg-primary-500'}`} />
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{b.eventName}</p>
                  <p className="text-primary-400 text-xs font-medium">{b.hallName}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {format(new Date(b.bookingDate), 'MMM dd')} &bull; {formatTime(b.startTime)}–{formatTime(b.endTime)}
                  </p>
                </div>
                {/* Status badge */}
                <div className="flex-shrink-0">
                  {b.status === 'CONFIRMED' && new Date(b.bookingDate) >= new Date(format(new Date(), 'yyyy-MM-dd')) && <span className="badge-green">Confirmed</span>}
                  {b.status === 'CONFIRMED' && new Date(b.bookingDate) < new Date(format(new Date(), 'yyyy-MM-dd')) && <span className="badge-blue">Done</span>}
                  {b.status === 'CANCELLED' && <span className="badge-red">Cancelled</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}
