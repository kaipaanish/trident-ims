import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
  console.warn(
    '⚠️  Supabase URL not set. Open .env.local and add your NEXT_PUBLIC_SUPABASE_URL'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// ── Types ────────────────────────────────────────────────────

export interface Vendor {
  id: string
  name: string
  created_at: string
}

export interface Hybrid {
  id: string
  code: string
  category: 'TD' | 'C' | 'V' | 'Other'
  created_at: string
}

export interface ProcessingUnit {
  id: string
  name: string
  location: string
  created_at: string
}

export interface Warehouse {
  id: string
  name: string
  type: string
  created_at: string
}

export interface Dispatch {
  id: string
  serial_no: number | null
  dispatch_date: string
  vendor_id: string | null
  hybrid_id: string | null
  w_bridge_qty: number | null
  sheller_qty: number | null
  bags: string | null
  raw_tonnage: number | null
  dc_number: string | null
  from_location: string
  to_warehouse_id: string | null
  truck_number: string | null
  rst_number: string | null
  unit_id: string | null
  notes: string | null
  created_at: string
  // Joined
  vendors?: Vendor
  hybrids?: Hybrid
  processing_units?: ProcessingUnit
  warehouses?: Warehouse
}
