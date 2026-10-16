import { useMemo, useState } from 'react'

import {

  Area,

  AreaChart,

  CartesianGrid,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from 'recharts'

import { upcomingRenewals } from '../store/Data.js'

import RevenueTrendCard from './RevenueTrendCard.jsx'
const paymentIcons = {
  upi: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8M8 12h5M8 15h8" />
    </>
  ),
  cash: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 9h.01M18 15h.01" />
    </>
  ),
  bank: (
    <>
      <path d="m3 9 9-5 9 5H3Z" />
      <path d="M5 10v7M9 10v7M15 10v7M19 10v7M3 20h18M4 17h16" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 9h18M16 14h.01" />
    </>
  ),
  rupay: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h6a2 2 0 0 1 0 4H7m4 0 4 2" />
    </>
  ),

  visa: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m9 15 2-6m2 6 2-6m-1 4h3" />
    </>
  ),

  mastercard: (
    <>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </>
  ),

  amex: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15l2-6 2 6m-3-2h3m3-4v6h4m-4-3h3" />
    </>
  ),

  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
}
const paymentMethodStyles = {
  upi: {
    color: '#8B5CF6',
    background: 'rgba(139, 92, 246, 0.12)',
  },
  rupay: {
    color: '#F97316',
    background: 'rgba(249, 115, 22, 0.12)',
  },
  visa: {
    color: '#3B82F6',
    background: 'rgba(59, 130, 246, 0.12)',
  },
  mastercard: {
    color: '#F04438',
    background: 'rgba(240, 68, 56, 0.12)',
  },
  amex: {
    color: '#06B6D4',
    background: 'rgba(6, 182, 212, 0.12)',
  },
  card: {
    color: '#94A3B8',
    background: 'rgba(148, 163, 184, 0.12)',
  },
}

const paymentLogoPaths = {
  upi: '/paymentlogs/UPI-Color.png',
  rupay: '/paymentlogs/rupay.png',
  visa: '/paymentlogs/visa-logo-png-2013.png',

  mastercard: '/paymentlogs/mastercard-26149.png',

  amex: '/paymentlogs/american-express-logo-transparent.png',
};

function PayIcon({ name }) {
  const logo = paymentLogoPaths[name];

  if (!logo) {
    return (
      <span
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
        aria-label="Other payment method"
      >
        PAY
      </span>
    );
  }

  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-white p-1">
      <img
        src={logo}
        alt={`${name} logo`}
        className="max-h-full max-w-full object-contain"
        loading="lazy"
      />
    </span>
  );
}


// function PayIcon({ name }) {
//   const icon = paymentIcons[name] || paymentIcons.card

//   return (
//     <svg
//       aria-hidden="true"
//       className="size-4 shrink-0"
//       fill="none"
//       stroke="currentColor"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth="1.8"
//       viewBox="0 0 24 24"
//     >
//       {icon}
//     </svg>
//   )
// }

function getPaymentIcon(method = '') {
  const value = String(method).toLowerCase().trim()

  if (value.includes('upi')) return 'upi'
  if (value.includes('rupay')) return 'rupay'
  if (value.includes('visa')) return 'visa'
  if (value.includes('mastercard')) return 'mastercard'
  if (value.includes('amex')) return 'amex'

  return 'card'
}


const pageSize = 15

const dateRanges = [

  { label: 'Last 30 days', days: 30 },

  { label: 'Last 14 days', days: 14 },

  { label: 'Last 7 days', days: 7 },

  { label: 'Last 90 days', days: 90 },

  { label: 'All time', days: 0 },

]

const statusFilters = ['All statuses', 'Paid', 'Failed', 'Refunded']



function getRefundedAmount(payment) {

  if (Number.isFinite(payment.refundedAmount)) return payment.refundedAmount

  return payment.status === 'refunded' ? payment.amount : 0

}



function formatCurrency(value) {

  return new Intl.NumberFormat('en-IN', {

    style: 'currency',

    currency: 'INR',

    maximumFractionDigits: 2,

  }).format(value)

}



function formatDate(value) {

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {

    day: 'numeric',

    month: 'short',

    year: 'numeric',

  })

}



function Icon({ name, className = 'size-4' }) {

  const paths = {

    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,

    failed: <><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></>,

    refund: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,

    trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,

    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,

    renew: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,

  }



  return (

    <svg

      aria-hidden="true"

      className={className}

      fill="none"

      stroke="currentColor"

      strokeLinecap="round"

      strokeLinejoin="round"

      strokeWidth="1.8"

      viewBox="0 0 24 24"

    >

      {paths[name]}

    </svg>

  )

}


function PaymentMethod({ method, isDark }) {
  const value = String(method ?? '').toLowerCase().replace(/[\s_-]+/g, '')
  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'

  let label = method || 'Unknown'
  let icon = 'card'

  if (value.includes('upi')) {
    icon = 'upi'
  } else if (value.includes('cash')) {
    icon = 'cash'
  } else if (value.includes('bank') || value.includes('netbanking')) {
    icon = 'bank'
  } else if (value.includes('wallet') || value.includes('paypal')) {
    icon = 'wallet'
  } else if (
    value.includes('card') ||
    value.includes('visa') ||
    value.includes('mastercard') ||
    value.includes('credit') ||
    value.includes('debit')
  ) {
    icon = 'card'
  }

  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap text-xs ${muted}`}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-500/10">
        <Icon name={icon} className="size-4" />
      </span>
      <span>{label}</span>
    </span>
  )
}



function PaymentStatus({ status, isDark }) {

  const styles = {

    paid: isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700',

    failed: isDark ? 'bg-rose-400/10 text-rose-300' : 'bg-rose-50 text-rose-700',

    refunded: isDark ? 'bg-slate-400/10 text-slate-300' : 'bg-slate-100 text-slate-600',

    partially_refunded: isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700',

  }



  return (

    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status] ?? styles.paid}`}>

      {status === 'partially_refunded' ? 'Partially refunded' : status.charAt(0).toUpperCase() + status.slice(1)}

    </span>

  )

}



function RevenueTooltip({ active, payload, label, isDark, trendLabel }) {

  if (!active || !payload?.length) return null

  return (

    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${isDark ? 'border-[#34445e] bg-[#18243a] text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}>

      <p className="mb-1 font-medium">{formatDate(label)}</p>

      <p className="font-semibold text-[#e36b45]">{trendLabel}: {formatCurrency(payload[0].value)}</p>

    </div>

  )

}



function RevenueTrend({ payments, isDark, trendStatus }) {

  const axisColor = isDark ? '#91a9c9' : '#718096'

  const gridColor = isDark ? '#29364d' : '#dce5f0'

  const trendLabel = trendStatus === 'failed'

    ? 'Failed amount'

    : trendStatus === 'refunded'

      ? 'Refunded amount'

      : 'Collected revenue'

  const chartData = useMemo(() => {

    const dailyTotals = new Map()

    for (const payment of payments) {

      const refundedAmount = getRefundedAmount(payment)

      const amount = trendStatus === 'paid'

        ? ['paid', 'partially_refunded'].includes(payment.status)

          ? payment.amount - refundedAmount

          : 0

        : trendStatus === 'refunded'

          ? refundedAmount

          : payment.status === trendStatus

            ? payment.amount

            : 0

      if (amount > 0) dailyTotals.set(payment.date, (dailyTotals.get(payment.date) ?? 0) + amount)

    }

    return [...dailyTotals.entries()]

      .sort(([first], [second]) => first.localeCompare(second))

      .map(([date, revenue]) => ({ date, revenue }))

  }, [payments, trendStatus])



  return (

    <div

      aria-label={`${trendLabel} trend`}

      className="mt-4 h-[230px] w-full"

      role="img"

    >

      {chartData.length === 0 ? (

        <div className={`flex h-full items-center justify-center rounded-lg text-sm ${isDark ? 'bg-[#121e33] text-[#91a9c9]' : 'bg-slate-50 text-slate-500'}`}>

          No {trendStatus} transactions in this date range.

        </div>

      ) : (

        <ResponsiveContainer height="100%" minWidth={0} width="100%">

          <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>

            <CartesianGrid stroke={gridColor} strokeDasharray="3 4" vertical={false} />

            <XAxis

              axisLine={false}

              dataKey="date"

              interval="preserveStartEnd"

              minTickGap={20}

              tick={{ fill: axisColor, fontSize: 10 }}

              tickFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit' })}

              tickLine={false}

              tickMargin={9}

            />

            <YAxis

              axisLine={false}

              tick={{ fill: axisColor, fontSize: 10 }}

              tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}

              tickLine={false}

              width={52}

            />

            <Tooltip content={<RevenueTooltip isDark={isDark} trendLabel={trendLabel} />} cursor={{ stroke: isDark ? '#53657d' : '#cbd5e1', strokeDasharray: '4 4' }} />

            <Area

              activeDot={{ fill: '#e36b45', r: 4, stroke: isDark ? '#10192d' : '#ffffff', strokeWidth: 2 }}

              animationDuration={400}

              dataKey="revenue"

              fill="#e36b45"

              fillOpacity={0.08}

              stroke="#e36b45"

              strokeWidth={2}

              type="monotone"

            />

          </AreaChart>

        </ResponsiveContainer>

      )}

    </div>

  )

}



function RefundDialog({ payment, isDark, onCancel, onConfirm }) {

  const [refundType, setRefundType] = useState('full')

  const [partialAmount, setPartialAmount] = useState('')

  const [reason, setReason] = useState('')

  const [error, setError] = useState('')

  const remainingAmount = Math.max(0, payment.amount - getRefundedAmount(payment))

  const refundAmount = refundType === 'full' ? remainingAmount : Number(partialAmount)

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${isDark

    ? 'border-[#34445e] bg-[#0c1326] text-slate-100 placeholder:text-[#7187a4] focus:border-[#53657d] focus:ring-[#53657d]/30'

    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-slate-300 focus:ring-slate-200'

    }`



  function submitRefund(event) {

    event.preventDefault()

    if (!reason.trim()) {

      setError('Please enter a reason for the refund.')

      return

    }

    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > remainingAmount) {

      setError(`Enter an amount greater than ₹0 and no more than ${formatCurrency(remainingAmount)}.`)

      return

    }

    onConfirm({ amount: refundAmount, reason: reason.trim() })

  }



  return (

    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">

      <button aria-label="Close refund dialog" className="absolute inset-0 bg-slate-950/45" onClick={onCancel} type="button" />

      <section

        aria-labelledby="refund-title"

        aria-modal="true"

        className={`relative w-full max-w-[640px] rounded-xl border p-6 shadow-2xl md:p-8 ${isDark ? 'border-[#263249] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'

          }`}

        role="dialog"

      >

        <h2 id="refund-title" className="text-[22px] leading-7 font-bold">

          Refund {formatCurrency(refundAmount || 0)}?

        </h2>

        <p className={`mt-2 text-base ${isDark ? 'text-[#91a9c9]' : 'text-slate-500'}`}>

          {payment.userName} · {payment.id}. This cannot be undone.

        </p>



        <form className="mt-5" onSubmit={submitRefund}>

          <div className="flex gap-2">

            {[

              ['full', 'Full refund'],

              ['partial', 'Partial'],

            ].map(([type, label]) => (

              <button

                aria-pressed={refundType === type}

                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition ${refundType === type

                  ? 'border-[#10192d] bg-[#10192d] text-white'

                  : isDark

                    ? 'border-[#34445e] bg-[#10192d] text-slate-200 hover:bg-[#18243a]'

                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'

                  }`}

                key={type}

                onClick={() => {

                  setRefundType(type)

                  setError('')

                }}

                type="button"

              >

                {label}

              </button>

            ))}

          </div>



          {refundType === 'partial' && (

            <label className="mt-4 block text-sm font-semibold" htmlFor="partial-refund-amount">

              Refund amount

              <input

                aria-describedby="refund-amount-help"

                className={`${inputClass} mt-1.5`}

                id="partial-refund-amount"

                max={remainingAmount}

                min="0.01"

                onChange={(event) => {

                  setPartialAmount(event.target.value)

                  setError('')

                }}

                placeholder={`Up to ${formatCurrency(remainingAmount)}`}

                required

                step="0.01"

                type="number"

                value={partialAmount}

              />

              <span className={`mt-1 block text-xs font-normal ${isDark ? 'text-[#91a9c9]' : 'text-slate-500'}`} id="refund-amount-help">

                Remaining refundable amount: {formatCurrency(remainingAmount)}

              </span>

            </label>

          )}



          <label className="mt-5 block text-sm font-semibold" htmlFor="refund-reason">

            Reason

            <textarea

              className={`${inputClass} mt-1.5 min-h-[76px] resize-y`}

              id="refund-reason"

              onChange={(event) => {

                setReason(event.target.value)

                setError('')

              }}

              placeholder="e.g. Duplicate charge"

              required

              value={reason}

            />

          </label>



          {error && <p className="mt-2 text-sm text-rose-500" role="alert">{error}</p>}

          <p className={`mt-2 text-xs ${isDark ? 'text-[#7187a4]' : 'text-slate-500'}`}>

            Demo action only; this does not contact a payment provider.

          </p>



          <div className="mt-5 flex justify-end gap-2">

            <button

              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold shadow-sm transition ${isDark ? 'border-[#34445e] hover:bg-[#18243a]' : 'border-slate-200 hover:bg-slate-50'

                }`}

              onClick={onCancel}

              type="button"

            >

              Cancel

            </button>

            <button

              className="rounded-xl bg-[#10192d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#26344e] disabled:cursor-not-allowed disabled:opacity-50"

              disabled={!reason.trim() || !Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > remainingAmount}

              type="submit"

            >

              Refund {formatCurrency(refundAmount || 0)}

            </button>

          </div>

        </form>

      </section>

    </div>

  )

}



function Payments({ payments, onPaymentsChange, onRefund, onNotifyRenewal, isDark }) {

  const [activeTab, setActiveTab] = useState('all')

  const [dateRange, setDateRange] = useState('Last 30 days')

  const [statusFilter, setStatusFilter] = useState('All statuses')

  const [page, setPage] = useState(1)

  const [paymentToRefund, setPaymentToRefund] = useState(null)

  const [notice, setNotice] = useState('')
  const [renewalToNotify, setRenewalToNotify] = useState(null)
  const [renewalChannel, setRenewalChannel] = useState('email')
  const [renewalNotice, setRenewalNotice] = useState('')
  const [sendingRenewalNotice, setSendingRenewalNotice] = useState(false)



  const dateThreshold = useMemo(() => {

    const days = dateRanges.find((range) => range.label === dateRange)?.days ?? 30

    if (!days) return ''

    const latestPaymentDate = payments.reduce(

      (latest, payment) => payment.date > latest ? payment.date : latest,

      '',

    )

    if (!latestPaymentDate) return ''

    const thresholdTimestamp = Date.parse(`${latestPaymentDate}T00:00:00Z`) - (days - 1) * 86400000

    return new Date(thresholdTimestamp).toISOString().slice(0, 10)

  }, [dateRange, payments])



  const filteredPayments = useMemo(

    () =>

      payments

        .filter((payment) => !dateThreshold || payment.date >= dateThreshold)

        .filter((payment) => activeTab !== 'failed' || payment.status === 'failed')

        .filter((payment) =>

          statusFilter === 'All statuses' ||

          (statusFilter === 'Refunded'

            ? getRefundedAmount(payment) > 0

            : payment.status === statusFilter.toLowerCase()),

        )

        .sort((first, second) => second.date.localeCompare(first.date) || second.id.localeCompare(first.id)),

    [payments, dateThreshold, activeTab, statusFilter],

  )

  const trendStatus = activeTab === 'failed'

    ? 'failed'

    : statusFilter === 'All statuses'

      ? 'paid'

      : statusFilter.toLowerCase()

  const trendAmount = filteredPayments.reduce(

    (sum, payment) => {

      if (trendStatus === 'paid' && ['paid', 'partially_refunded'].includes(payment.status)) {

        return sum + payment.amount - getRefundedAmount(payment)

      }

      if (trendStatus === 'refunded') return sum + getRefundedAmount(payment)

      return sum + (payment.status === trendStatus ? payment.amount : 0)

    },

    0,

  )

  const failedCount = filteredPayments.filter((payment) => payment.status === 'failed').length

  const refundTotal = filteredPayments.reduce((sum, payment) => sum + getRefundedAmount(payment), 0)

  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / pageSize))

  const currentPage = Math.min(page, pageCount)

  const pagePayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const surface = isDark ? 'border-[#263249] bg-[#10192d]' : 'border-slate-200 bg-white'

  const muted = isDark ? 'text-[#91a9c9]' : 'text-slate-500'

  const filterClass = `h-10 rounded-lg border px-3 text-sm outline-none ${isDark ? 'border-[#34445e] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`

  const trendLabel = trendStatus === 'failed'

    ? 'Failed amount'

    : trendStatus === 'refunded'

      ? 'Refunded amount'

      : 'Collected'

  const trendDescription = trendStatus === 'failed'

    ? 'Failed payment amounts over the selected period.'

    : trendStatus === 'refunded'

      ? 'Refunded payment amounts over the selected period.'

      : 'Successful payments over the selected period.'



  function downloadPaymentReport() {
    const reportPayments = filteredPayments
    const successfulPayments = reportPayments.filter((payment) => ['paid', 'partially_refunded', 'refunded'].includes(payment.status))
    const grossSuccessful = successfulPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const totalRefunded = reportPayments.reduce((sum, payment) => sum + getRefundedAmount(payment), 0)
    const netCollected = grossSuccessful - totalRefunded
    const failedPayments = reportPayments.filter((payment) => payment.status === 'failed')
    const pendingPayments = reportPayments.filter((payment) => payment.status === 'pending')

    // Build a structured, multi-page landscape PDF without adding a new dependency.
    const pageWidth = 842
    const pageHeight = 595
    const margin = 32
    const safeText = (value) => String(value ?? '')
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
    const money = (value) => `INR ${Number(value || 0).toFixed(2)}`
    const truncate = (value, max = 20) => {
      const text = String(value ?? '').replace(/[\r\n]+/g, ' ').trim()
      return text.length > max ? `${text.slice(0, max - 1)}...` : text
    }
    const wrapText = (value, maxChars = 110) => {
      const words = String(value ?? '').replace(/[\r\n]+/g, ' ').split(/\s+/).filter(Boolean)
      const lines = []
      let line = ''
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word
        if (next.length > maxChars && line) {
          lines.push(line)
          line = word
        } else line = next
      })
      if (line) lines.push(line)
      return lines.length ? lines : ['']
    }
    const pages = []
    let commands = []
    let y = pageHeight - margin
    const text = (value, x, baseline, size = 8, font = 'F1', color = '0.16 0.20 0.28') => {
      commands.push(`${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${baseline} Tm (${safeText(value)}) Tj ET`)
    }
    const line = (x1, y1, x2, y2, color = '0.82 0.85 0.89', width = 0.6) => {
      commands.push(`${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`)
    }
    const fillRect = (x, top, width, height, color) => {
      commands.push(`${color} rg ${x} ${top - height} ${width} ${height} re f`)
    }
    const finishPage = () => {
      text(`Aifa Gen Labs | Payment report | Page ${pages.length + 1}`, margin, 18, 7, 'F1', '0.42 0.46 0.53')
      pages.push(commands.join('\n'))
      commands = []
      y = pageHeight - margin
    }
    const startPage = (continued = false) => {
      fillRect(0, pageHeight, pageWidth, 7, '0.15 0.35 0.63')
      text('AIFA GEN LABS', margin, y - 2, 9, 'F2', '0.15 0.35 0.63')
      y -= 24
      text(continued ? 'PAYMENT TRANSACTION DETAILS (CONTINUED)' : 'PAYMENT REPORT', margin, y, 19, 'F2', '0.10 0.14 0.22')
      y -= 18
      if (!continued) {
        text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, y, 8)
        text(`Period: ${dateRange}    Status: ${statusFilter}    View: ${activeTab === 'failed' ? 'Failed payments' : 'All payments'}`, margin + 300, y, 8)
        y -= 22
        fillRect(margin, y + 8, 190, 43, '0.94 0.96 0.98')
        fillRect(margin + 198, y + 8, 190, 43, '0.94 0.96 0.98')
        fillRect(margin + 396, y + 8, 190, 43, '0.94 0.96 0.98')
        fillRect(margin + 594, y + 8, 184, 43, '0.94 0.96 0.98')
        text('GROSS SUCCESSFUL', margin + 10, y - 7, 7, 'F2', '0.36 0.40 0.47')
        text(money(grossSuccessful), margin + 10, y - 25, 12, 'F2')
        text('REFUNDS ISSUED', margin + 208, y - 7, 7, 'F2', '0.36 0.40 0.47')
        text(money(totalRefunded), margin + 208, y - 25, 12, 'F2')
        text('NET COLLECTIONS', margin + 406, y - 7, 7, 'F2', '0.36 0.40 0.47')
        text(money(netCollected), margin + 406, y - 25, 12, 'F2')
        text('TRANSACTIONS', margin + 604, y - 7, 7, 'F2', '0.36 0.40 0.47')
        text(String(reportPayments.length), margin + 604, y - 25, 12, 'F2')
        y -= 35
        text(`Successful: ${successfulPayments.length}    Failed: ${failedPayments.length}    Pending: ${pendingPayments.length}`, margin, y, 8)
        y -= 22
      } else y -= 10
    }
    const columns = [
      { label: 'Payment ID', width: 67, get: (p) => p.id },
      { label: 'User', width: 92, get: (p) => p.userName },
      { label: 'Email', width: 128, get: (p) => p.email },
      { label: 'Amount', width: 67, get: (p) => Number(p.amount || 0).toFixed(2) },
      { label: 'Status', width: 76, get: (p) => p.status },
      { label: 'Method', width: 68, get: (p) => p.method },
      { label: 'Date', width: 65, get: (p) => p.date },
      { label: 'Refunded', width: 70, get: (p) => Number(getRefundedAmount(p)).toFixed(2) },
      { label: 'Net', width: 65, get: (p) => (Number(p.amount || 0) - getRefundedAmount(p)).toFixed(2) },
    ]
    const drawTableHeader = () => {
      fillRect(margin, y + 8, pageWidth - margin * 2, 21, '0.15 0.35 0.63')
      let x = margin + 5
      columns.forEach((column) => {
        text(column.label, x, y - 5, 7, 'F2', '1 1 1')
        x += column.width
      })
      y -= 21
    }
    startPage(false)
    text('TRANSACTION DETAILS', margin, y, 9, 'F2', '0.10 0.14 0.22')
    y -= 16
    drawTableHeader()

    reportPayments.forEach((payment, index) => {
      const detailParts = []
      const packageName = payment.packageName ?? payment.package ?? payment.plan
      if (packageName) detailParts.push(`Package: ${packageName}`)
      if (payment.notes ?? payment.description) detailParts.push(`Notes: ${payment.notes ?? payment.description}`)
      const refundHistory = (payment.refundHistory ?? []).map((refund) => `${refund.date || ''} - ${money(refund.amount)} - ${refund.reason || 'No reason recorded'}`)
      if (refundHistory.length) detailParts.push(`Refund history: ${refundHistory.join('; ')}`)
      const detailLines = detailParts.flatMap((part) => wrapText(part, 150))
      const rowHeight = 19 + detailLines.length * 10
      if (y - rowHeight < 34) {
        finishPage()
        startPage(true)
        drawTableHeader()
      }
      if (index % 2 === 0) fillRect(margin, y + 7, pageWidth - margin * 2, rowHeight, '0.97 0.98 0.99')
      let x = margin + 5
      columns.forEach((column, columnIndex) => {
        const maxChars = Math.max(7, Math.floor((column.width - 8) / 4.2))
        const value = truncate(column.get(payment), maxChars)
        text(value, x, y - 5, 7, 'F1', columnIndex === 4 && payment.status === 'failed' ? '0.70 0.18 0.18' : '0.16 0.20 0.28')
        x += column.width
      })
      y -= 16
      detailLines.forEach((detailLine) => {
        text(detailLine, margin + 10, y, 6.5, 'F1', '0.42 0.46 0.53')
        y -= 10
      })
      y -= 3
      line(margin, y + 5, pageWidth - margin, y + 5)
    })
    if (reportPayments.length === 0) text('No transactions match the selected filters.', margin, y - 5, 9)
    finishPage()

    const encoder = new TextEncoder()
    const objects = []
    const addObject = (body) => { objects.push(body); return objects.length }
    const catalogId = addObject('')
    const pagesId = addObject('')
    const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
    const pageIds = []
    pages.forEach((pageContent) => {
      const stream = `${pageContent}\n`
      const streamLength = encoder.encode(stream).length
      const contentId = addObject(`<< /Length ${streamLength} >>\nstream\n${stream}endstream`)
      const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`)
      pageIds.push(pageId)
    })
    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

    let pdf = '%PDF-1.4\n'
    const offsets = [0]
    objects.forEach((object, index) => {
      offsets.push(encoder.encode(pdf).length)
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    })
    const xrefOffset = encoder.encode(pdf).length
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n` })
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

    const blob = new Blob([encoder.encode(pdf)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safePeriod = dateRange.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    link.href = url
    link.download = `aifa-payment-report-${safePeriod}-${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setNotice(`Payment PDF report downloaded with ${reportPayments.length} transaction(s).`)
  }

  function confirmRefund(target, refund) {

    if (!target || !refund || !['paid', 'partially_refunded'].includes(target.status)) {

      setPaymentToRefund(null)

      return

    }

    const remainingAmount = target.amount - getRefundedAmount(target)

    const refundAmount = Number(refund.amount)

    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > remainingAmount) {

      setNotice(`Refund amount for payment ${target.id} is no longer valid. Please try again.`)

      setPaymentToRefund(null)

      return

    }

    const createdAt = new Date().toISOString()

    onPaymentsChange((current) =>

      current.map((payment) => {

        if (payment.id !== target.id) return payment

        const refundedAmount = getRefundedAmount(payment) + refundAmount

        return {

          ...payment,

          refundedAmount,

          refundHistory: [

            ...(payment.refundHistory ?? []),

            { amount: refundAmount, reason: refund.reason, date: createdAt },

          ],

          status: refundedAmount >= payment.amount ? 'refunded' : 'partially_refunded',

        }

      }),

    )

    onRefund(target, { amount: refundAmount, reason: refund.reason, createdAt })

    setNotice(`${formatCurrency(refundAmount)} refunded for payment ${target.id}. Reason: ${refund.reason}`)

    setPaymentToRefund(null)

  }



  const metrics = [

    { label: `${trendLabel} · ${dateRange.toLowerCase()}`, value: formatCurrency(trendAmount), icon: 'trend' },

    { label: 'Payments', value: filteredPayments.length.toLocaleString('en-IN'), icon: 'card' },

    { label: 'Failed payments', value: failedCount.toLocaleString('en-IN'), icon: 'failed' },

    { label: 'Refunds', value: formatCurrency(refundTotal), icon: 'refund' },

  ]



  return (

    <div className="payments-dashboard mx-auto max-w-[1600px]">

      <header className="mb-5">

        <h1 className={`text-[26px] leading-8 font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>Payments</h1>

        <p className={`mt-1 text-sm ${muted}`}>All payments, failed payments, and revenue trends.</p>

      </header>



      <section aria-label="Payment summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        {metrics.map((metric) => (

          <article className={`payment-metric-card rounded-xl border p-4 ${surface}`} key={metric.label}>

            <div className="flex items-center justify-between gap-2">

              <h2 className={`text-[11px] font-semibold tracking-wide uppercase ${muted}`}>{metric.label}</h2>

              <span className={`payment-metric-icon ${muted}`}><Icon name={metric.icon} /></span>

            </div>

            <p className={`mt-2 text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-[#172033]'}`}>{metric.value}</p>

          </article>

        ))}

      </section>



      <RevenueTrendCard

        dateRange={dateRange}

        dateRanges={dateRanges}

        isDark={isDark}

        onDateRangeChange={(value) => { setDateRange(value); setPage(1) }}

        payments={payments}

        trendStatus={trendStatus}

      />



      <section aria-label="Payments list" className={`payment-panel mt-4 overflow-hidden rounded-xl border ${surface}`}>

        <div className={`flex flex-wrap items-center justify-between gap-3 border-b p-3 md:px-4 ${isDark ? 'border-[#263249]' : 'border-slate-200'}`}>

          <div className={`flex items-center gap-1 rounded-lg p-1 ${isDark ? 'bg-[#0c1326]' : 'bg-slate-100'}`}>

            {[

              ['all', 'All payments'],

              ['failed', 'Failed payments'],

            ].map(([tab, label]) => (

              <button

                aria-pressed={activeTab === tab}

                className={`rounded-md px-3 py-2 text-xs font-semibold transition ${activeTab === tab

                  ? isDark ? 'bg-[#26344e] text-white shadow-sm' : 'bg-white text-[#172033] shadow-sm'

                  : muted

                  }`}

                key={tab}

                onClick={() => { setActiveTab(tab); setPage(1) }}

                type="button"

              >

                {label}

              </button>

            ))}

          </div>

          <div className="flex flex-wrap items-center gap-2">

            <label className="sr-only" htmlFor="payment-date-range">Filter payments by date</label>

            <select className={filterClass} id="payment-date-range" onChange={(event) => { setDateRange(event.target.value); setPage(1) }} value={dateRange}>

              {dateRanges.map((range) => <option key={range.label}>{range.label}</option>)}

            </select>

            <label className="sr-only" htmlFor="payment-status-filter">Filter payments by status</label>

            <select className={filterClass} id="payment-status-filter" onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }} value={statusFilter}>

              {statusFilters.map((status) => <option key={status}>{status}</option>)}

            </select>

            <span className={`px-2 text-xs ${muted}`}>{filteredPayments.length} payments</span>
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${isDark ? 'border-[#34445e] text-slate-100 hover:bg-[#202d43]' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}
              onClick={downloadPaymentReport}
              type="button"
            >
              <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4" />
              </svg>
              Download PDF report
            </button>

          </div>

        </div>



        {notice && (

          <div className={`flex items-center justify-between px-4 py-2.5 text-xs ${isDark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-800'}`} role="status">

            {notice}

            <button aria-label="Dismiss notification" className="ml-3 font-semibold" onClick={() => setNotice('')} type="button">Dismiss</button>

          </div>

        )}



        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px] border-collapse text-left">

            <thead className={isDark ? 'bg-[#121e33]' : 'bg-slate-50'}>

              <tr className={`border-b text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'border-[#263249] text-[#91a9c9]' : 'border-slate-200 text-slate-500'}`}>

                {['Payment ID', 'User', 'Amount', 'Status', 'Method', 'Date', 'Actions'].map((label) => (

                  <th className="px-4 py-3" key={label}>{label}</th>

                ))}

              </tr>

            </thead>

            <tbody className={`divide-y ${isDark ? 'divide-[#263249]' : 'divide-slate-100'}`}>

              {pagePayments.map((payment) => (

                <tr className={isDark ? 'hover:bg-[#121e33]' : 'hover:bg-slate-50/70'} key={payment.id}>

                  <td className={`whitespace-nowrap px-4 py-3 font-mono text-xs ${muted}`}>{payment.id}</td>

                  <td className="px-4 py-3">

                    <p className="text-sm font-medium">{payment.userName}</p>

                    <p className={`mt-0.5 text-xs ${muted}`}>{payment.email}</p>

                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold tabular-nums">{formatCurrency(payment.amount)}</td>

                  <td className="px-4 py-3"><PaymentStatus isDark={isDark} status={payment.status} /></td>

                  <td className={`whitespace-nowrap px-4 py-3 text-xs ${muted}`}>
                    {(() => {
                      const iconName = getPaymentIcon(payment.method)
                      const style = paymentMethodStyles[iconName] || paymentMethodStyles.card

                      return (
                        <div className="flex items-center gap-2">
                          <span
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ color: style.color, backgroundColor: style.background }}
                          >
                            <PayIcon name={iconName} />
                          </span>

                          <span>{payment.method}</span>
                        </div>
                      )
                    })()}
                  </td>

                  <td className={`whitespace-nowrap px-4 py-3 text-xs ${muted}`}>{formatDate(payment.date)}</td>

                  <td className="px-4 py-3">

                    {['paid', 'partially_refunded'].includes(payment.status) ? (

                      <button

                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition ${isDark ? 'text-[#91a9c9] hover:bg-[#202d43] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

                          }`}

                        onClick={() => setPaymentToRefund(payment)}

                        type="button"

                      >

                        <Icon name="refund" className="size-3.5" />

                        Refund

                      </button>

                    ) : <span className={`text-xs ${muted}`}>—</span>}

                  </td>

                </tr>

              ))}

              {!pagePayments.length && (

                <tr><td className={`px-4 py-12 text-center text-sm ${muted}`} colSpan="7">No payments match the selected filters.</td></tr>

              )}

            </tbody>

          </table>

        </div>

        <footer className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${isDark ? 'border-[#263249]' : 'border-slate-200'}`}>

          <p className={`text-xs ${muted}`}>Showing {filteredPayments.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} payments</p>

          <div className="flex items-center gap-2">

            <button className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-40 ${isDark ? 'border-[#34445e]' : 'border-slate-200'}`} disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>

            <span className={`min-w-16 text-center text-xs ${muted}`}>Page {currentPage} of {pageCount}</span>

            <button className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-40 ${isDark ? 'border-[#34445e]' : 'border-slate-200'}`} disabled={currentPage >= pageCount} onClick={() => setPage((current) => current + 1)} type="button">Next</button>

          </div>

        </footer>

      </section>

      <section aria-labelledby="renewals-title" className={`payment-panel relative mt-4 overflow-hidden rounded-xl border ${surface}`}>
        <div aria-hidden="true" className="h-1 w-full bg-[#a94f32]" />
        <div className="p-4 md:p-5">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`flex size-10 items-center justify-center rounded-xl ${isDark ? 'bg-[#173c3a] text-[#71d1c1]' : 'bg-[#e4f6f2] text-[#138a7d]'}`}>
                <Icon name="renew" className="size-5" />
              </span>
              <div>
                <h2 id="renewals-title" className="text-sm font-semibold">Upcoming renewals</h2>
                <p className={`mt-1 text-xs ${muted}`}>Review each upcoming renewal and send the customer a reminder.</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isDark ? 'bg-[#202d43] text-[#b8c9df]' : 'bg-slate-100 text-slate-600'}`}>
              {upcomingRenewals.length} scheduled
            </span>
          </header>

          {renewalNotice && (
            <div className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-xs ${isDark ? 'border-[#28574f] bg-[#173c3a]/50 text-[#a5e6d9]' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`} role="status">
              <span>{renewalNotice}</span>
              <button aria-label="Dismiss renewal notice" className="font-semibold" onClick={() => setRenewalNotice('')} type="button">Dismiss</button>
            </div>
          )}

          <div className="space-y-2.5">
            {upcomingRenewals.map((renewal, index) => (
              <article
                className={`payment-renewal-card rounded-xl border p-3.5 transition-colors ${isDark ? 'border-[#263249] bg-[#121e33] hover:border-[#3b4b65]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                key={renewal.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-lg ${isDark ? 'bg-[#202d43] text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{formatDate(renewal.renewalDate).split(' ')[1]}</span>
                    <span className="text-lg leading-5 font-bold tabular-nums">{new Date(`${renewal.renewalDate}T00:00:00`).getDate()}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-semibold">{renewal.name}</p>
                      {index === 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-[#173c3a] text-[#71d1c1]' : 'bg-[#e4f6f2] text-[#138a7d]'}`}>
                          Next renewal
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 break-all text-xs ${muted}`}>{renewal.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${renewal.plan === 'Standard'
                      ? isDark ? 'bg-violet-400/10 text-violet-300' : 'bg-violet-50 text-violet-700'
                      : renewal.plan === 'Basic'
                        ? isDark ? 'bg-sky-400/10 text-sky-300' : 'bg-sky-50 text-sky-700'
                        : isDark ? 'bg-indigo-400/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                      {renewal.plan}
                    </span>
                    <div className="min-w-[104px] text-right">
                      <p className={`text-sm font-bold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{formatCurrency(renewal.amount)}</p>
                      <p className={`mt-0.5 text-[10px] ${muted}`}>Renewal amount</p>
                    </div>
                    <button
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#a94f32] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f4029] focus:outline-none focus:ring-2 focus:ring-[#e36b45]/40"
                      onClick={() => {
                        setRenewalToNotify(renewal)
                        setRenewalChannel('email')
                      }}
                      type="button"
                    >
                      <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                        <path d="m22 6-10 7L2 6" />
                      </svg>
                      Notify
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!upcomingRenewals.length && (
              <div className={`rounded-xl border border-dashed px-4 py-10 text-center ${isDark ? 'border-[#34445e] text-[#91a9c9]' : 'border-slate-200 text-slate-500'}`}>
                <p className="text-sm font-semibold">No upcoming renewals</p>
                <p className="mt-1 text-xs">Renewals will appear here when they are scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {renewalToNotify && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button aria-label="Close notification dialog" className="absolute inset-0 bg-slate-950/60" onClick={() => setRenewalToNotify(null)} type="button" />
          <section
            aria-labelledby="renewal-notify-title"
            aria-modal="true"
            className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl md:p-6 ${isDark ? 'border-[#34445e] bg-[#10192d] text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold" id="renewal-notify-title">Send renewal reminder</h2>
                <p className={`mt-1 text-xs ${muted}`}>Choose how to notify {renewalToNotify.name}.</p>
              </div>
              <button aria-label="Close dialog" className={`rounded-lg p-1.5 ${isDark ? 'text-[#91a9c9] hover:bg-[#202d43]' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setRenewalToNotify(null)} type="button">
                <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24"><path d="m18 6-12 12M6 6l12 12" /></svg>
              </button>
            </div>

            <div className={`mt-4 rounded-xl border p-3 ${isDark ? 'border-[#263249] bg-[#121e33]' : 'border-slate-200 bg-slate-50'}`}>
              <p className="text-sm font-semibold">{renewalToNotify.name}</p>
              <p className={`mt-1 break-all text-xs ${muted}`}>{renewalToNotify.email}</p>
              <div className={`mt-3 flex items-center justify-between border-t pt-3 text-xs ${isDark ? 'border-[#263249]' : 'border-slate-200'}`}>
                <span className={muted}>{renewalToNotify.plan} plan · {formatDate(renewalToNotify.renewalDate)}</span>
                <span className="font-bold tabular-nums">{formatCurrency(renewalToNotify.amount)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${renewalChannel === 'email' ? 'border-[#e36b45] bg-[#e36b45]/5' : isDark ? 'border-[#34445e]' : 'border-slate-200'}`}>
                <input checked={renewalChannel === 'email'} className="mt-0.5 accent-[#a94f32]" name="renewal-channel" onChange={() => setRenewalChannel('email')} type="radio" />
                <span>
                  <span className="block text-sm font-semibold">Email reminder</span>
                  <span className={`mt-0.5 block text-xs ${muted}`}>Prepare an email addressed to this customer.</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${renewalChannel === 'in-app' ? 'border-[#e36b45] bg-[#e36b45]/5' : isDark ? 'border-[#34445e]' : 'border-slate-200'}`}>
                <input checked={renewalChannel === 'in-app'} className="mt-0.5 accent-[#a94f32]" name="renewal-channel" onChange={() => setRenewalChannel('in-app')} type="radio" />
                <span>
                  <span className="block text-sm font-semibold">In-app notification</span>
                  <span className={`mt-0.5 block text-xs ${muted}`}>Send a notification through the connected application service.</span>
                </span>
              </label>
            </div>

            <p className={`mt-3 text-[11px] leading-5 ${muted}`}>
              {onNotifyRenewal
                ? 'The selected channel will be handled by your notification callback.'
                : renewalChannel === 'email'
                  ? 'This opens your default email app. Automatic delivery requires an email service/backend.'
                  : 'In-app delivery requires an onNotifyRenewal handler connected to your backend.'}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button className={`rounded-lg border px-4 py-2.5 text-xs font-semibold ${isDark ? 'border-[#34445e] hover:bg-[#202d43]' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => setRenewalToNotify(null)} type="button">Cancel</button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-[#a94f32] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#8f4029] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={sendingRenewalNotice}
                onClick={async () => {
                  if (!renewalToNotify) return
                  if (onNotifyRenewal) {
                    try {
                      setSendingRenewalNotice(true)
                      await onNotifyRenewal(renewalToNotify, renewalChannel)
                      setRenewalNotice(`${renewalChannel === 'email' ? 'Email reminder' : 'In-app notification'} requested for ${renewalToNotify.name}.`)
                      setRenewalToNotify(null)
                    } catch (error) {
                      setRenewalNotice(`Could not send a reminder to ${renewalToNotify.name}. Please try again.`)
                    } finally {
                      setSendingRenewalNotice(false)
                    }
                    return
                  }
                  if (renewalChannel === 'email') {
                    const subject = encodeURIComponent(`Upcoming subscription renewal — ${renewalToNotify.plan}`)
                    const body = encodeURIComponent(
                      `Hi ${renewalToNotify.name},\n\nThis is a reminder that your ${renewalToNotify.plan} subscription is scheduled to renew on ${formatDate(renewalToNotify.renewalDate)} for ${formatCurrency(renewalToNotify.amount)}.\n\nPlease contact us if you have any questions.\n\nRegards,\nAifa Gen Labs`
                    )
                    window.location.href = `mailto:${renewalToNotify.email}?subject=${subject}&body=${body}`
                    setRenewalNotice(`Email draft prepared for ${renewalToNotify.name}. Send it from your email app to complete delivery.`)
                    setRenewalToNotify(null)
                  } else {
                    setRenewalNotice('In-app notification was not sent because no notification backend is connected. Pass the onNotifyRenewal prop to enable delivery.')
                    setRenewalToNotify(null)
                  }
                }}
                type="button"
              >
                {sendingRenewalNotice ? 'Sending…' : renewalChannel === 'email' ? 'Prepare email' : 'Send notification'}
              </button>
            </div>
          </section>
        </div>
      )}

      {
        paymentToRefund && (

          <RefundDialog

            isDark={isDark}

            onCancel={() => setPaymentToRefund(null)}

            onConfirm={(refund) => confirmRefund(paymentToRefund, refund)}

            payment={paymentToRefund}

          />

        )
      }

    </div >

  )

}



export default Payments
