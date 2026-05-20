'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Vendor, Hybrid, ProcessingUnit, Warehouse } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Filter, Download, PackagePlus, Trash2, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const ITEMS_PER_PAGE = 15

export default function DispatchListPage() {
  const [dispatches, setDispatches] = useState<any[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [hybrids, setHybrids] = useState<Hybrid[]>([])
  const [units, setUnits] = useState<ProcessingUnit[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  const [search, setSearch] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [filterHybrid, setFilterHybrid] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Load master data once
  useEffect(() => {
    async function load() {
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
    load()
  }, [])

  const fetchDispatches = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('dispatches')
      .select('*, vendors(name), hybrids(code), processing_units(name), warehouses(name)', { count: 'exact' })
      .order('dispatch_date', { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)

    if (filterVendor) query = query.eq('vendor_id', filterVendor)
    if (filterUnit)   query = query.eq('unit_id', filterUnit)
    if (filterHybrid) query = query.eq('hybrid_id', filterHybrid)
    if (dateFrom)     query = query.gte('dispatch_date', dateFrom)
    if (dateTo)       query = query.lte('dispatch_date', dateTo)
    if (search)       query = query.or(`truck_number.ilike.%${search}%,dc_number.ilike.%${search}%,rst_number.ilike.%${search}%`)

    const { data, count, error } = await query
    if (!error) {
      setDispatches(data ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [page, filterVendor, filterUnit, filterHybrid, dateFrom, dateTo, search])

  useEffect(() => {
    setPage(0)
  }, [filterVendor, filterUnit, filterHybrid, dateFrom, dateTo, search])

  useEffect(() => {
    fetchDispatches()
  }, [fetchDispatches])

  async function handleDelete(id: string) {
    await supabase.from('dispatches').delete().eq('id', id)
    setDeleteId(null)
    fetchDispatches()
  }

  async function exportCSV() {
    const { data } = await supabase
      .from('dispatches')
      .select('dispatch_date, vendors(name), hybrids(code), processing_units(name), warehouses(name), w_bridge_qty, sheller_qty, raw_tonnage, bags, dc_number, from_location, truck_number, rst_number')
      .order('dispatch_date', { ascending: false })

    if (!data) return
    const rows = data.map((d: any) => [
      d.dispatch_date,
      d.vendors?.name, d.hybrids?.code, d.processing_units?.name,
      d.w_bridge_qty, d.sheller_qty, d.raw_tonnage, d.bags,
      d.dc_number, d.from_location, d.warehouses?.name,
      d.truck_number, d.rst_number,
    ])
    const header = ['Date','Vendor','Hybrid','Unit','W-Bridge Qty','Sheller Qty','Raw-t','Bags','DC No','From','To','Truck No','RST No']
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dispatches_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="p-8 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Dispatches</h1>
          <p className="text-slate-400 text-sm mt-1">{total.toLocaleString()} total records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link
            href="/dispatch/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors shadow-lg shadow-green-900/30"
          >
            <PackagePlus className="w-4 h-4" /> New Dispatch
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
          </div>

          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search truck / DC / RST…"
              className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {[
            { value: filterVendor, setValue: setFilterVendor, label: 'All Vendors', options: vendors, keyFn: (v: Vendor) => v.id, labelFn: (v: Vendor) => v.name },
            { value: filterUnit, setValue: setFilterUnit, label: 'All Units', options: units, keyFn: (u: ProcessingUnit) => u.id, labelFn: (u: ProcessingUnit) => u.name },
            { value: filterHybrid, setValue: setFilterHybrid, label: 'All Hybrids', options: hybrids, keyFn: (h: Hybrid) => h.id, labelFn: (h: Hybrid) => h.code },
          ].map(({ value, setValue, label, options, keyFn, labelFn }) => (
            <select
              key={label}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none transition-colors"
              value={value}
              onChange={e => setValue(e.target.value)}
            >
              <option value="">{label}</option>
              {options.map((o: any) => (
                <option key={keyFn(o)} value={keyFn(o)}>{labelFn(o)}</option>
              ))}
            </select>
          ))}

          <input type="date" className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none transition-colors" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
          <span className="text-slate-500 text-sm">–</span>
          <input type="date" className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none transition-colors" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />

          {(filterVendor || filterUnit || filterHybrid || dateFrom || dateTo || search) && (
            <button
              onClick={() => { setFilterVendor(''); setFilterUnit(''); setFilterHybrid(''); setDateFrom(''); setDateTo(''); setSearch('') }}
              className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60">
              <tr>
                {['#','Date','Vendor','Hybrid','Unit','W-Bridge Qty','Sheller Qty','Raw-t','Bags','DC No','To','Truck No','RST No','Actions'].map(h => (
                  <th key={h} className="text-left text-slate-400 font-medium px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 14 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="shimmer h-4 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center text-slate-500 py-16">
                    No dispatches found. <Link href="/dispatch/new" className="text-green-400 hover:underline">Add one →</Link>
                  </td>
                </tr>
              ) : (
                dispatches.map((d, idx) => (
                  <tr key={d.id} className="table-row-hover">
                    <td className="px-4 py-3 text-slate-500 text-xs">{page * ITEMS_PER_PAGE + idx + 1}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {new Date(d.dispatch_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{d.vendors?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded font-mono">
                        {d.hybrids?.code ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                        {d.processing_units?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-right tabular-nums">
                      {d.w_bridge_qty ? Number(d.w_bridge_qty).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-right tabular-nums">
                      {d.sheller_qty ? Number(d.sheller_qty).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-blue-400 text-right tabular-nums font-medium">
                      {d.raw_tonnage ? Number(d.raw_tonnage).toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{d.bags ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{d.dc_number ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{d.warehouses?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{d.truck_number ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{d.rst_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteId(d.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-800 gap-3">
            <span className="text-slate-500 text-xs">
              Showing {page * ITEMS_PER_PAGE + 1}–{Math.min((page + 1) * ITEMS_PER_PAGE, total)} of {total}
            </span>
            
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              {(() => {
                const pageNumbers = []
                if (totalPages <= 7) {
                  for (let i = 0; i < totalPages; i++) pageNumbers.push(i)
                } else {
                  pageNumbers.push(0) // Always show first page
                  
                  if (page > 2) {
                    pageNumbers.push('ellipsis-start')
                  }
                  
                  const start = Math.max(1, page - 1)
                  const end = Math.min(totalPages - 2, page + 1)
                  
                  for (let i = start; i <= end; i++) {
                    pageNumbers.push(i)
                  }
                  
                  if (page < totalPages - 3) {
                    pageNumbers.push('ellipsis-end')
                  }
                  
                  pageNumbers.push(totalPages - 1) // Always show last page
                }

                return pageNumbers.map((p, idx) => {
                  if (p === 'ellipsis-start' || p === 'ellipsis-end') {
                    return (
                      <span key={`ellipse-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-600 text-xs select-none">
                        ...
                      </span>
                    )
                  }
                  
                  const pageIndex = p as number
                  return (
                    <button
                      key={pageIndex}
                      onClick={() => setPage(pageIndex)}
                      className={`w-8 h-8 rounded text-xs font-medium border transition-colors ${
                        page === pageIndex
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {pageIndex + 1}
                    </button>
                  )
                })
              })()}

              {/* Next Page */}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page === totalPages - 1}
                className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Delete Dispatch?</h3>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
