import { supabase } from '@/lib/supabase'
import { Truck, Package, Layers, BarChart3, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { Dispatch } from '@/lib/supabase'

async function getDashboardData() {
  const [
    { count: totalDispatches },
    { data: dispatches },
    { data: unitStats },
    { data: recentDispatches },
  ] = await Promise.all([
    supabase.from('dispatches').select('*', { count: 'exact', head: true }),
    supabase.from('dispatches').select('raw_tonnage, w_bridge_qty'),
    supabase.from('dispatches').select('unit_id, processing_units(name), w_bridge_qty').limit(1000),
    supabase
      .from('dispatches')
      .select('*, vendors(name), hybrids(code), processing_units(name), warehouses(name)')
      .order('dispatch_date', { ascending: false })
      .limit(8),
  ])

  const totalTonnage =
    dispatches?.reduce((sum, d) => sum + (Number(d.raw_tonnage) || 0), 0) ?? 0

  // Group by unit
  const byUnit: Record<string, number> = {}
  unitStats?.forEach((d: any) => {
    const unit = d.processing_units?.name ?? 'Unknown'
    byUnit[unit] = (byUnit[unit] || 0) + (Number(d.w_bridge_qty) || 0)
  })

  return { totalDispatches, totalTonnage, byUnit, recentDispatches }
}

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string; icon: any; color: string
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const { totalDispatches, totalTonnage, byUnit, recentDispatches } =
    await getDashboardData()

  const units = Object.entries(byUnit).sort((a, b) => b[1] - a[1])

  return (
    <div className="p-8 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Trident Seed Dispatch — Season Overview 2026
          </p>
        </div>
        <Link
          href="/dispatch/new"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-green-900/30"
        >
          <Package className="w-4 h-4" />
          New Dispatch
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Dispatches"
          value={(totalDispatches ?? 0).toLocaleString()}
          sub="All units combined"
          icon={Truck}
          color="bg-blue-600"
        />
        <StatCard
          label="Total Tonnage"
          value={`${totalTonnage.toFixed(1)} t`}
          sub="W-Bridge ÷ 1000"
          icon={BarChart3}
          color="bg-green-600"
        />
        <StatCard
          label="Active Units"
          value={units.length.toString()}
          sub="Processing units"
          icon={Layers}
          color="bg-violet-600"
        />
        <StatCard
          label="Season"
          value="2026"
          sub="Jan – May 2026"
          icon={Calendar}
          color="bg-amber-600"
        />
      </div>

      {/* Unit Breakdown + Recent Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h2 className="text-white font-semibold text-sm">Volume by Unit</h2>
          </div>
          <div className="space-y-4">
            {units.length === 0 ? (
              <p className="text-slate-500 text-sm">No data yet</p>
            ) : (
              units.map(([unit, qty]) => {
                const total = units.reduce((s, [, q]) => s + q, 0)
                const pct = total > 0 ? (qty / total) * 100 : 0
                return (
                  <div key={unit}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300">{unit}</span>
                      <span className="text-slate-400">{(qty / 1000).toFixed(1)} t</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Dispatches */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-400" />
              <h2 className="text-white font-semibold text-sm">Recent Dispatches</h2>
            </div>
            <Link href="/dispatch" className="text-xs text-green-400 hover:text-green-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Date', 'Vendor', 'Hybrid', 'W-Qty', 'To', 'Unit'].map(h => (
                    <th key={h} className="text-left text-slate-500 font-medium pb-3 pr-4 text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentDispatches && recentDispatches.length > 0 ? (
                  recentDispatches.map((d: any) => (
                    <tr key={d.id} className="border-b border-slate-800/50 table-row-hover">
                      <td className="py-3 pr-4 text-slate-300 whitespace-nowrap">
                        {new Date(d.dispatch_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{d.vendors?.name ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">
                          {d.hybrids?.code ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {d.w_bridge_qty ? Number(d.w_bridge_qty).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-400 text-xs">{d.warehouses?.name ?? '—'}</td>
                      <td className="py-3">
                        <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">
                          {d.processing_units?.name ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 text-sm">
                      No dispatches yet. <Link href="/dispatch/new" className="text-green-400 hover:underline">Add one →</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
