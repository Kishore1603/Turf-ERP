// ─── Turfs ──────────────────────────────────────────────────
export interface Turf {
  id: string
  name: string
  description?: string
  location?: string
  amenities?: string[]
  image_url?: string
  sport_types?: string[]
  is_active: boolean
  open_time: string  // HH:mm
  close_time: string // HH:mm
  created_at: string
  updated_at: string
}

// ─── Customers ──────────────────────────────────────────────
export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  total_bookings: number
  created_at: string
}

// ─── Pricing Rules ──────────────────────────────────────────
export interface PricingRule {
  id: string
  turf_id: string
  name: string
  start_time: string   // HH:mm
  end_time: string     // HH:mm
  days_of_week: number[] // 0=Sun, 1=Mon ... 6=Sat
  price_per_hour: number
  is_peak: boolean
  is_active: boolean
  created_at: string
  turf?: Turf
}

// ─── Bookings ───────────────────────────────────────────────
export type PaymentMethod = 'online' | 'venue' | 'pending'
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed'

export interface Booking {
  id: string
  booking_ref: string
  turf_id: string
  customer_id: string
  booking_date: string  // YYYY-MM-DD
  start_time: string    // HH:mm
  end_time: string      // HH:mm
  duration_minutes: number
  total_amount: number
  gst_amount: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  booking_status: BookingStatus
  sport_type?: string
  notes?: string
  is_walk_in: boolean
  cancelled_at?: string
  cancellation_reason?: string
  refund_amount?: number
  created_at: string
  updated_at: string
  turf?: Turf
  customer?: Customer
}

// ─── Payments ───────────────────────────────────────────────
export type PaymentProvider = 'razorpay' | 'cash' | 'upi' | 'card'
export type PaymentCaptureStatus = 'pending' | 'captured' | 'failed' | 'refunded'

export interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  payment_method: PaymentProvider
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
  status: PaymentCaptureStatus
  failure_reason?: string
  created_at: string
  booking?: Booking
}

// ─── Invoices ───────────────────────────────────────────────
export interface Invoice {
  id: string
  booking_id: string
  invoice_number: string
  subtotal: number
  gst_rate: number
  gst_amount: number
  total_amount: number
  business_name?: string
  business_gstin?: string
  customer_gstin?: string
  pdf_url?: string
  generated_at: string
  booking?: Booking
}

// ─── Dashboard ──────────────────────────────────────────────
export interface DashboardStats {
  total_revenue: number
  total_bookings: number
  active_turfs: number
  utilization_rate: number
  revenue_change_pct: number
  bookings_change_pct: number
  pending_payments: number
  todays_revenue: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  bookings: number
}

export interface UtilizationDataPoint {
  turf_name: string
  utilization_pct: number
  booked_slots: number
  total_slots: number
}

// ─── API Responses ──────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ─── Forms ──────────────────────────────────────────────────
export interface CreateBookingForm {
  turf_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  booking_date: string
  start_time: string
  end_time: string
  payment_method: PaymentMethod
  sport_type?: string
  notes?: string
  is_walk_in: boolean
}

export interface CreatePricingRuleForm {
  turf_id: string
  name: string
  start_time: string
  end_time: string
  days_of_week: number[]
  price_per_hour: number
  is_peak: boolean
}

export interface CreateTurfForm {
  name: string
  description?: string
  location?: string
  amenities?: string[]
  sport_types?: string[]
  open_time: string
  close_time: string
  image_url?: string
}

// ─── Razorpay ───────────────────────────────────────────────
export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// ─── Filters ────────────────────────────────────────────────
export interface BookingFilters {
  turf_id?: string
  booking_date?: string
  date_from?: string
  date_to?: string
  booking_status?: BookingStatus
  payment_status?: PaymentStatus
  search?: string
}

export interface ReportFilters {
  period: 'today' | 'week' | 'month' | 'custom'
  date_from?: string
  date_to?: string
  turf_id?: string
}
