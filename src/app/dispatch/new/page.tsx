'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Vendor, Hybrid, ProcessingUnit, Warehouse } from '@/lib/supabase'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors'

export default function NewDispatchPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [hybrids, setHybrids] = useState<Hybrid[]>([])
  const [units, setUnits] = useState<ProcessingUnit[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const [form, setForm] = useState({
    dispatch_date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    hybrid_id: '',
    unit_id: '',
    w_bridge_qty: '',
    sheller_qty: '',
    bags: '',
    dc_number: '',
    from_location: 'Growhere',
    to_warehouse_id: '',
    truck_number: '',
    rst_number: '',
    notes: '',
  })

  useEffect(() => {
    async function loadMasters() {
      const [v, h, u, w] = await Promise.all([
        supabase.from('vendors').select('*').order('name'),
        supabase.from('hybrids').select('*').order('code'),
        supabase.from('processing_units').select('*').order('name'),
        supabase.from('warehouses').select('*').order('name'),
      ])
      setVendors(v.data ?? [])
      setHybrids(h.data ?? [])
      setUnits(u.data ?? [])
      setWarehouses(w.data ?? [])
    }
    loadMasters()
  }, [])

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.dispatch_date || !form.vendor_id || !form.hybrid_id || !form.unit_id) {
      setErrorMsg('Please fill in all required fields.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    const payload: Record<string, any> = {
      dispatch_date:   form.dispatch_date,
      vendor_id:       form.vendor_id || null,
      hybrid_id:       form.hybrid_id || null,
      unit_id:         form.unit_id || null,
      to_warehouse_id: form.to_warehouse_id || null,
      w_bridge_qty:    form.w_bridge_qty ? Number(form.w_bridge_qty) : null,
      sheller_qty:     form.sheller_qty ? Number(form.sheller_qty) : null,
      bags:            form.bags || null,
      dc_number:       form.dc_number || null,
      from_location:   form.from_location || 'Growhere',
      truck_number:    form.truck_number || null,
      rst_number:      form.rst_number || null,
      notes:           form.notes || null,
    }

    const { error } = await supabase.from('dispatches').insert([payload])

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('success')
      setTimeout(() => router.push('/dispatch'), 1500)
    }
  }

  const groupedHybrids = ['TD', 'C', 'V', 'Other'].map(cat => ({
    cat,
    items: hybrids.filter(h => h.category === cat),
  }))

  return (
    <div className="p-8 max-w-4xl mx-auto fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Dispatch Entry</h1>
        <p className="text-slate-400 text-sm mt-1">Record a new seed dispatch transaction</p>
      </div>

      {/* Alerts */}
      {status === 'success' && (
        <div className="flex items-center gap-3 bg-green-900/30 border border-green-700 text-green-400 rounded-lg px-4 py-3 mb-6 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Dispatch saved! Redirecting…
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Core Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5 pb-3 border-b border-slate-800">
            Core Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Dispatch Date" required>
              <input
                id="dispatch_date"
                type="date"
                className={inputClass}
                value={form.dispatch_date}
                onChange={e => set('dispatch_date', e.target.value)}
                required
              />
            </Field>

            <Field label="Vendor" required>
              <select
                id="vendor_id"
                className={inputClass}
                value={form.vendor_id}
                onChange={e => set('vendor_id', e.target.value)}
                required
              >
                <option value="">Select vendor…</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Processing Unit" required>
              <select
                id="unit_id"
                className={inputClass}
                value={form.unit_id}
                onChange={e => set('unit_id', e.target.value)}
                required
              >
                <option value="">Select unit…</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Hybrid" required>
              <select
                id="hybrid_id"
                className={inputClass}
                value={form.hybrid_id}
                onChange={e => set('hybrid_id', e.target.value)}
                required
              >
                <option value="">Select hybrid…</option>
                {groupedHybrids.map(({ cat, items }) =>
                  items.length ? (
                    <optgroup key={cat} label={`── ${cat} Series`}>
                      {items.map(h => (
                        <option key={h.id} value={h.id}>{h.code}</option>
                      ))}
                    </optgroup>
                  ) : null
                )}
              </select>
            </Field>

            <Field label="From Location">
              <input
                id="from_location"
                type="text"
                className={inputClass}
                value={form.from_location}
                onChange={e => set('from_location', e.target.value)}
                placeholder="Growhere"
              />
            </Field>

            <Field label="To Warehouse / Destination">
              <select
                id="to_warehouse_id"
                className={inputClass}
                value={form.to_warehouse_id}
                onChange={e => set('to_warehouse_id', e.target.value)}
              >
                <option value="">Select destination…</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Section: Quantity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5 pb-3 border-b border-slate-800">
            Quantity Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="W-Bridge Qty (grams)">
              <input
                id="w_bridge_qty"
                type="number"
                className={inputClass}
                value={form.w_bridge_qty}
                onChange={e => set('w_bridge_qty', e.target.value)}
                placeholder="e.g. 23280"
                min={0}
              />
            </Field>

            <Field label="Sheller Qty (grams)">
              <input
                id="sheller_qty"
                type="number"
                className={inputClass}
                value={form.sheller_qty}
                onChange={e => set('sheller_qty', e.target.value)}
                placeholder="e.g. 22516"
                min={0}
              />
            </Field>

            <Field label="Bags">
              <input
                id="bags"
                type="text"
                className={inputClass}
                value={form.bags}
                onChange={e => set('bags', e.target.value)}
                placeholder="e.g. 451 or 9 JB"
              />
            </Field>
          </div>

          {/* Auto-computed tonnage preview */}
          {form.w_bridge_qty && (
            <div className="mt-4 flex items-center gap-2 bg-slate-800/60 rounded-lg px-4 py-2.5 border border-slate-700">
              <span className="text-slate-400 text-sm">Computed Raw Tonnage:</span>
              <span className="text-green-400 font-semibold text-sm">
                {(Number(form.w_bridge_qty) / 1000).toFixed(3)} t
              </span>
            </div>
          )}
        </div>

        {/* Section: Transport & Documents */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5 pb-3 border-b border-slate-800">
            Transport & Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="DC Number">
              <input
                id="dc_number"
                type="text"
                className={inputClass}
                value={form.dc_number}
                onChange={e => set('dc_number', e.target.value)}
                placeholder="e.g. 1326 or GH-95"
              />
            </Field>

            <Field label="Truck Number">
              <input
                id="truck_number"
                type="text"
                className={inputClass}
                value={form.truck_number}
                onChange={e => set('truck_number', e.target.value)}
                placeholder="e.g. AP24TA4311"
              />
            </Field>

            <Field label="RST Number">
              <input
                id="rst_number"
                type="text"
                className={inputClass}
                value={form.rst_number}
                onChange={e => set('rst_number', e.target.value)}
                placeholder="e.g. 3191"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Notes">
              <textarea
                id="notes"
                rows={2}
                className={`${inputClass} resize-none`}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any additional remarks…"
              />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.push('/dispatch')}
            className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            id="submit-dispatch"
            type="submit"
            disabled={status === 'loading'}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-lg shadow-green-900/30"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              'Save Dispatch'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
