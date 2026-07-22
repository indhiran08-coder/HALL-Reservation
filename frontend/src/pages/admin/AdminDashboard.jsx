import { useState, useEffect } from 'react';
import { hallAPI, bookingAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  LayoutDashboard, Building2, CalendarDays, Users,
  TrendingUp, BookOpen, BarChart3
} from 'lucide-react';

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function AdminDashboard() {
  const [halls, setHalls] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [hallRes, bookRes] = await Promise.all([
        hallAPI.getAllAdmin(),
        bookingAPI.getAll(),
      ]);
      setHalls(hallRes.data.data || []);
      setAllBookings(bookRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const confirmed = allBookings.filter(b => b.status === 'CONFIRMED');
  const todayBookings = confirmed.filter(b => b.bookingDate === today);
  const upcoming = confirmed.filter(b => b.bookingDate > today);
  const cancelled = allBookings.filter(b => b.status === 'CANCELLED');

  // Department stats
  const deptStats = allBookings.reduce((acc, b) => {
    if (b.status === 'CONFIRMED') {
      const dept = b.department?.split(' ').slice(0, 3).join(' ') || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
    }
    return acc;
  }, {});
  const sortedDepts = Object.entries(deptStats).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedDepts[0]?.[1] || 1;

  const stats = [
    { label: 'Total Halls', value: halls.filter(h => h.active).length, icon: Building2, color: 'text-primary-400', bg: 'bg-primary-900/30', border: 'border-primary-800/40' },
    { label: "Today's Bookings", value: todayBookings.length, icon: CalendarDays, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/30' },
    { label: 'Upcoming Events', value: upcoming.length, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/30' },
    { label: 'Total Confirmed', value: confirmed.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/30' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary-400" /> Admin Dashboard
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">VCET — Hall Management Overview</p>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`card border ${s.border}`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Hall Status ─── */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-400" /> Hall Overview
          </h2>
          <div className="space-y-3">
            {halls.map(hall => {
              const hallBookings = confirmed.filter(b => b.hallId === hall.id);
              return (
                <div key={hall.id}
                  className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <div>
                    <p className="font-medium text-white text-sm">{hall.hallName}</p>
                    <p className="text-slate-500 text-xs">{hall.location} · {hall.capacity || '—'} seats</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-400 font-semibold text-sm">{hallBookings.length}</p>
                    <p className="text-slate-500 text-xs">bookings</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Department Stats ─── */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" /> Bookings by Department
          </h2>
          {sortedDepts.length === 0 ? (
            <p className="text-slate-500 text-sm">No booking data yet.</p>
          ) : (
            <div className="space-y-3">
              {sortedDepts.slice(0, 6).map(([dept, count]) => (
                <div key={dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-sm truncate max-w-[200px]">{dept}</span>
                    <span className="text-primary-400 font-semibold text-sm">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-600 to-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent All Bookings ─── */}
      <div className="card">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-400" /> All Recent Bookings
        </h2>
        {allBookings.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No bookings yet.</p>
        ) : (
          <div className="space-y-2.5">
            {allBookings.slice(0, 15).map(b => (
              <div key={b.id}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                {/* Top row: event name + status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{b.eventName}</p>
                    <p className="text-primary-400 text-xs">{b.hallName}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {b.status === 'CONFIRMED' && <span className="badge-green">Confirmed</span>}
                    {b.status === 'CANCELLED' && <span className="badge-red">Cancelled</span>}
                  </div>
                </div>
                {/* Bottom row: meta info */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    {b.bookedByName}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-slate-500" />
                    {format(new Date(b.bookingDate), 'MMM dd')} &bull; {formatTime(b.startTime)}–{formatTime(b.endTime)}
                  </span>
                  <span className="text-slate-500 truncate max-w-[160px]">
                    {b.department?.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
