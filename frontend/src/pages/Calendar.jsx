import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, hallAPI } from '../services/api';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
         eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths,
         addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Building2 } from 'lucide-react';

const VIEWS = ['Day', 'Week', 'Month'];

export default function Calendar() {
  const [view, setView] = useState('Week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadHalls();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [currentDate, view]);

  const loadHalls = async () => {
    try {
      const res = await hallAPI.getAll();
      setHalls(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      let start, end;
      const today = currentDate;
      if (view === 'Day') {
        start = end = format(today, 'yyyy-MM-dd');
      } else if (view === 'Week') {
        start = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        end = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        start = format(startOfMonth(today), 'yyyy-MM-dd');
        end = format(endOfMonth(today), 'yyyy-MM-dd');
      }
      const res = await bookingAPI.getCalendar(start, end);
      setBookings(res.data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const navigate_ = (dir) => {
    if (view === 'Day') {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir));
    } else if (view === 'Week') {
      setCurrentDate(d => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    } else {
      setCurrentDate(d => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
    }
  };

  const getBookingsForDay = (date) =>
    bookings.filter(b => b.bookingDate === format(date, 'yyyy-MM-dd'));

  const getHallColor = (hallId) => {
    const colors = [
      'bg-blue-600', 'bg-purple-600', 'bg-emerald-600',
      'bg-orange-600', 'bg-pink-600'
    ];
    return colors[(hallId - 1) % colors.length];
  };

  const headerLabel = () => {
    if (view === 'Day') return format(currentDate, 'EEEE, MMMM dd, yyyy');
    if (view === 'Week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(s, 'MMM dd')} – ${format(e, 'MMM dd, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  // ─── Month View ─────────────────────────────────────────────────────────────
  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            return (
              <div key={day.toString()}
                onClick={() => { setSelectedDay(day); setView('Day'); setCurrentDate(day); }}
                className={`min-h-[100px] p-2 rounded-xl border cursor-pointer transition-all duration-200
                  ${isCurrentMonth ? 'bg-slate-800/60 border-slate-700/50 hover:border-slate-500' 
                                   : 'bg-slate-900/20 border-slate-800/20'}
                  ${isToday ? 'border-primary-500/50 bg-primary-900/20' : ''}`}>
                <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium
                  ${isToday ? 'bg-primary-600 text-white' : isCurrentMonth ? 'text-slate-200' : 'text-slate-600'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayBookings.slice(0, 2).map(b => (
                    <div key={b.id} className={`${getHallColor(b.hallId)} rounded text-white text-xs px-1 py-0.5 truncate`}>
                      {b.eventName}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-slate-400 pl-1">+{dayBookings.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Week View ───────────────────────────────────────────────────────────────
  const WeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: addWeeks(weekStart, 1) }).slice(0, 7);
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Column headers */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
            <div />
            {days.map(day => (
              <div key={day.toString()}
                className={`text-center py-2 rounded-lg text-sm
                  ${isSameDay(day, new Date()) ? 'bg-primary-600 text-white font-semibold' 
                                               : 'text-slate-400'}`}>
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className="text-lg font-bold">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
          {/* Time slots */}
          <div className="space-y-0">
            {hours.map(hour => (
              <div key={hour} className="grid gap-1" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
                <div className="text-right pr-3 text-xs text-slate-500 pt-1">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
                {days.map(day => {
                  const dayBookings = getBookingsForDay(day).filter(b => {
                    const startHour = parseInt(b.startTime?.split(':')[0]);
                    return startHour === hour;
                  });
                  return (
                    <div key={day.toString()}
                      className="border-t border-slate-800/50 min-h-[48px] relative rounded-sm
                                 hover:bg-slate-800/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/book?date=${format(day, 'yyyy-MM-dd')}`)}>
                      {dayBookings.map(b => (
                        <div key={b.id}
                          className={`${getHallColor(b.hallId)} absolute inset-x-0.5 top-0.5 
                                      rounded-md p-1 text-white text-xs overflow-hidden z-10`}
                          title={`${b.eventName} — ${b.hallName}`}>
                          <div className="font-medium truncate">{b.eventName}</div>
                          <div className="opacity-80 text-xs">{b.hallName}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Day View ────────────────────────────────────────────────────────────────
  const DayView = () => {
    const dayBookings = getBookingsForDay(currentDate);
    const hours = Array.from({ length: 13 }, (_, i) => i + 8);

    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const slotBookings = dayBookings.filter(b => {
            const startHour = parseInt(b.startTime?.split(':')[0]);
            return startHour === hour;
          });
          return (
            <div key={hour} className="flex gap-4 min-h-[56px]">
              <div className="w-16 text-right text-xs text-slate-500 pt-2 flex-shrink-0">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              <div className="flex-1 border-t border-slate-800/50 pt-1 space-y-1
                              hover:bg-slate-800/10 rounded-r-lg transition-colors cursor-pointer"
                   onClick={() => navigate(`/book?date=${format(currentDate, 'yyyy-MM-dd')}`)}>
                {slotBookings.map(b => (
                  <div key={b.id}
                    className={`${getHallColor(b.hallId)} rounded-lg p-2 text-white flex items-start gap-3`}>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{b.eventName}</div>
                      <div className="text-xs opacity-80">{b.hallName} · {b.department}</div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary-400" />
            Calendar
          </h1>
          <p className="page-subtitle">Browse all hall bookings</p>
        </div>
        <button onClick={() => navigate('/book')} className="btn-primary">
          <Building2 className="w-5 h-5" /> Book a Hall
        </button>
      </div>

      <div className="card">
        {/* ─── View Switcher + Navigation ─── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate_(-1)}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 
                         flex items-center justify-center transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>
            <button onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 
                         text-slate-300 border border-slate-700 transition-colors">
              Today
            </button>
            <button onClick={() => navigate_(1)}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 
                         flex items-center justify-center transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
            <span className="text-white font-semibold text-lg">{headerLabel()}</span>
          </div>

          {/* View Tabs */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 gap-1">
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${view === v ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Hall Legend ─── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {halls.map(h => (
            <div key={h.id} className="flex items-center gap-2 text-sm text-slate-300">
              <span className={`w-3 h-3 rounded-full ${getHallColor(h.id)}`} />
              {h.hallName}
            </div>
          ))}
        </div>

        {/* ─── Calendar Body ─── */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : (
          <>
            {view === 'Month' && <MonthView />}
            {view === 'Week' && <WeekView />}
            {view === 'Day' && <DayView />}
          </>
        )}
      </div>
    </div>
  );
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}
