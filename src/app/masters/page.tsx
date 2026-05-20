'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Loader2, CheckCircle2, X } from 'lucide-react'

type TableKey = 'vendors' | 'hybrids' | 'processing_units' | 'warehouses'

interface TableConfig {
  label: string
  fields: { key: string; label: string; type?: string; options?: string[] }[]
  displayField: string
  sub?: (row: any) => string
}

const TABLES: Record<TableKey, TableConfig> = {
  vendors: {
    label: 'Vendors',
    displayField: 'name',
    fields: [{ key: 'name', label: 'Vendor Name' }],
  },
  hybrids: {
    label: 'Hybrids',
    displayField: 'code',
    sub: (row) => row.category,
    fields: [
      { key: 'code', label: 'Hybrid Code (e.g. TD-101)' },
      { key: 'category', label: 'Category', type: 'select', options: ['TD', 'C', 'V', 'Other'] },
    ],
  },
  processing_units: {
    label: 'Processing Units',
    displayField: 'name',
    sub: (row) => row.location,
    fields: [
      { key: 'name', label: 'Unit Name (e.g. Unit 1)' },
      { key: 'location', label: 'Location' },
    ],
  },
  warehouses: {
    label: 'Warehouses / Destinations',
    displayField: 'name',
    sub: (row) => row.type,
    fields: [
      { key: 'name', label: 'Warehouse / Destination Name' },
      { key: 'type', label: 'Type', type: 'select', options: ['internal', 'external', 'vendor'] },
    ],
  },
}

const TAB_COLORS: Record<TableKey, string> = {
  vendors: 'text-blue-400 border-blue-500 bg-blue-950/30',
  hybrids: 'text-green-400 border-green-500 bg-green-950/30',
  processing_units: 'text-violet-400 border-violet-500 bg-violet-950/30',
  warehouses: 'text-amber-400 border-amber-500 bg-amber-950/30',
}

const BADGE_COLORS: Record<TableKey, string> = {
  vendors: 'bg-blue-900/40 text-blue-300',
  hybrids: 'bg-green-900/40 text-green-300',
  processing_units: 'bg-violet-900/40 text-violet-300',
  warehouses: 'bg-amber-900/40 text-amber-300',
}

export default function MastersPage() {
  const [active, setActive] = useState<TableKey>('vendors')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const config = TABLES[active]

  async function fetchRows() {
    setLoading(true)
    const { data } = await supabase.from(active).select('*').order('created_at', { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    setForm({})
    fetchRows()
  }, [active])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload: Record<string, string> = {}
    config.fields.forEach(f => { if (form[f.key]) payload[f.key] = form[f.key] })

    const { error } = await supabase.from(active).insert([payload])
    setSaving(false)
    if (!error) {
      setForm({})
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      fetchRows()
    }
  }

  async function handleDelete(id: string) {
    await supabase.from(active).delete().eq('id', id)
    setDeleteId(null)
    fetchRows()
  }

  return (
    <div className="p-8 fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Master Data</h1>
        <p className="text-slate-400 text-sm mt-1">Manage reference data used across the system</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(TABLES) as TableKey[]).map(key => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
              active === key
                ? TAB_COLORS[key]
                : 'text-slate-400 border-transparent hover:border-slate-700 hover:bg-slate-800'
            }`}
          >
            {TABLES[key].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-5">Add New {config.label.replace(/s$/, '')}</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            {config.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm text-slate-400 mb-1.5">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3.5 py-2.5 text-sm focus:border-green-500 focus:outline-none transition-colors"
                    value={form[field.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    required
                  >
                    <option value="">Select…</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:border-green-500 focus:outline-none transition-colors"
                    value={form[field.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={`Enter ${field.label.toLowerCase()}…`}
                    required
                  />
                )}
              </div>
            ))}

            {saved && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Added successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Saving…' : `Add ${config.label.replace(/s$/, '')}`}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold text-sm">
              {config.label}
              <span className="ml-2 text-slate-500 font-normal text-xs">({rows.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shimmer h-12 rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No {config.label.toLowerCase()} added yet.</p>
          ) : (
            <div className="space-y-2">
              {rows.map(row => (
                <div
                  key={row.id}
                  className="flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${BADGE_COLORS[active]}`}>
                      {row[config.displayField]}
                    </span>
                    {config.sub && (
                      <span className="text-slate-500 text-xs">{config.sub(row)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteId(row.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Delete this entry?</h3>
            <p className="text-slate-400 text-sm mb-6">This will remove it from master data permanently.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
