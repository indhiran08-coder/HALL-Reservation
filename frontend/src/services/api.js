import { supabase } from '../lib/supabase';

// ─── Halls ────────────────────────────────────────────────────────────────────

export const hallAPI = {
  /** All active halls (staff view) */
  getAll: async () => {
    const { data, error } = await supabase
      .from('halls')
      .select('*')
      .eq('is_active', true)
      .order('hall_name');
    if (error) throw error;
    // Normalize to camelCase to match existing UI
    return {
      data: {
        data: data.map(h => ({
          id: h.id,
          hallName: h.hall_name,
          location: h.location,
          description: h.description,
          isActive: h.is_active,
          currentlyBooked: false,
        })),
      },
    };
  },

  /** All halls including inactive (admin view) */
  getAllAdmin: async () => {
    const { data, error } = await supabase
      .from('halls')
      .select('*')
      .order('hall_name');
    if (error) throw error;
    return {
      data: {
        data: data.map(h => ({
          id: h.id,
          hallName: h.hall_name,
          location: h.location,
          description: h.description,
          isActive: h.is_active,
        })),
      },
    };
  },

  /** Check which halls are available in a time slot */
  getAvailable: async (date, startTime, endTime) => {
    // Get halls that DON'T have a conflicting approved booking
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('hall_id')
      .eq('booking_date', date)
      .eq('status', 'APPROVED')
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    const bookedIds = (conflicts || []).map(b => b.hall_id);

    const { data, error } = await supabase
      .from('halls')
      .select('*')
      .eq('is_active', true)
      .order('hall_name');
    if (error) throw error;

    const available = data
      .filter(h => !bookedIds.includes(h.id))
      .map(h => ({
        id: h.id,
        hallName: h.hall_name,
        location: h.location,
        description: h.description,
      }));

    return { data: { data: available } };
  },

  /** Create hall (admin) */
  create: async (hallData) => {
    const { data, error } = await supabase
      .from('halls')
      .insert({
        hall_name: hallData.hallName,
        location: hallData.location,
        description: hallData.description || '',
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return { data: { success: true, data } };
  },

  /** Update hall (admin) */
  update: async (id, hallData) => {
    const { data, error } = await supabase
      .from('halls')
      .update({
        hall_name: hallData.hallName,
        location: hallData.location,
        description: hallData.description || '',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: { success: true, data } };
  },

  /** Deactivate / delete hall (admin) */
  delete: async (id) => {
    const { error } = await supabase
      .from('halls')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  },
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookingAPI = {
  /** Create booking with conflict detection */
  create: async (bookingData) => {
    // 1. Check for conflicts
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('hall_id', bookingData.hallId)
      .eq('booking_date', bookingData.bookingDate)
      .eq('status', 'APPROVED')
      .lt('start_time', bookingData.endTime)
      .gt('end_time', bookingData.startTime);

    if (conflicts && conflicts.length > 0) {
      const err = new Error('This hall is already booked for the selected time slot.');
      err.response = { data: { message: err.message } };
      throw err;
    }

    // 2. Get current user profile
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, department')
      .eq('id', user.id)
      .single();

    // 3. Get hall info
    const { data: hall } = await supabase
      .from('halls')
      .select('hall_name, location')
      .eq('id', bookingData.hallId)
      .single();

    // 4. Insert booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        hall_id: bookingData.hallId,
        user_id: user.id,
        event_name: bookingData.eventName,
        purpose: bookingData.purpose || '',
        booking_date: bookingData.bookingDate,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        status: 'APPROVED',
        booked_by_name: profile?.full_name || '',
        hall_name: hall?.hall_name || '',
        hall_location: hall?.location || '',
        department: profile?.department || '',
      })
      .select()
      .single();

    if (error) throw error;
    return { data: { success: true, data: normalizeBooking(data) } };
  },

  /** Get logged-in user's bookings */
  getMyBookings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('bookings')
      .select('*, halls(hall_name, location)')
      .eq('user_id', user.id)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return { data: { data: (data || []).map(normalizeBooking) } };
  },

  /** Get all bookings for today */
  getToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', today)
      .eq('status', 'APPROVED')
      .order('start_time');
    if (error) throw error;
    return { data: { data: (data || []).map(normalizeBooking) } };
  },

  /** Get bookings for a specific date */
  getByDate: async (date) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', date)
      .eq('status', 'APPROVED')
      .order('start_time');
    if (error) throw error;
    return { data: { data: (data || []).map(normalizeBooking) } };
  },

  /** Get bookings for calendar (date range) */
  getCalendar: async (startDate, endDate) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .eq('status', 'APPROVED')
      .order('booking_date')
      .order('start_time');
    if (error) throw error;
    return { data: { data: (data || []).map(normalizeBooking) } };
  },

  /** Get all bookings (admin) */
  getAll: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('start_time');
    if (error) throw error;
    return { data: { data: (data || []).map(normalizeBooking) } };
  },

  /** Cancel a booking */
  cancel: async (id) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  },

  /** Update a booking */
  update: async (id, bookingData) => {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        event_name: bookingData.eventName,
        purpose: bookingData.purpose,
        booking_date: bookingData.bookingDate,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: { success: true, data: normalizeBooking(data) } };
  },
};

// ─── Auth API (compatibility shim) ───────────────────────────────────────────
export const authAPI = {
  login: () => Promise.reject(new Error('Use Supabase OTP auth')),
  register: () => Promise.reject(new Error('Use Supabase OTP auth')),
  verifyOtp: () => Promise.reject(new Error('Use Supabase OTP auth')),
};

// ─── Normalizer ───────────────────────────────────────────────────────────────
function normalizeBooking(b) {
  return {
    id: b.id,
    hallId: b.hall_id,
    hallName: b.hall_name || b.halls?.hall_name || '',
    hallLocation: b.hall_location || b.halls?.location || '',
    eventName: b.event_name,
    purpose: b.purpose,
    bookingDate: b.booking_date,
    startTime: b.start_time,
    endTime: b.end_time,
    status: b.status,
    bookedByName: b.booked_by_name,
    department: b.department,
    createdAt: b.created_at,
  };
}

export default { hallAPI, bookingAPI, authAPI };
