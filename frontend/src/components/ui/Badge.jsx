const variants = {
  filed:     { bg: 'rgba(198,161,91,0.12)', color: '#D8BB7A', dot: '#C6A15B', border: 'rgba(198,161,91,0.25)', label: 'Filed'     },
  review:    { bg: 'rgba(143,113,62,0.15)', color: '#D8BB7A', dot: '#C6A15B', border: 'rgba(143,113,62,0.3)',  label: 'In Review' },
  assigned:  { bg: 'rgba(112,165,254,0.12)', color: '#93C5FD', dot: '#70A5FE', border: 'rgba(112,165,254,0.25)', label: 'Assigned'  },
  hearing:   { bg: 'rgba(192,132,252,0.12)', color: '#D8B4FE', dot: '#C084FC', border: 'rgba(192,132,252,0.25)', label: 'Hearing'   },
  decision:  { bg: 'rgba(185,83,83,0.15)',  color: '#E08080', dot: '#B95353', border: 'rgba(185,83,83,0.3)',   label: 'Decision'  },
  closed:    { bg: 'rgba(63,163,124,0.12)', color: '#5AC49A', dot: '#3FA37C', border: 'rgba(63,163,124,0.25)', label: 'Closed'    },
  active:    { bg: 'rgba(112,165,254,0.12)', color: '#93C5FD', dot: '#70A5FE', border: 'rgba(112,165,254,0.25)', label: 'Active'    },
  pending:   { bg: 'rgba(198,154,58,0.15)', color: '#E0B55A', dot: '#C69A3A', border: 'rgba(198,154,58,0.3)',  label: 'Pending'   },
  high:      { bg: 'rgba(198,154,58,0.15)', color: '#E0B55A', dot: '#C69A3A', border: 'rgba(198,154,58,0.3)',  label: 'High'      },
  urgent:    { bg: 'rgba(185,83,83,0.15)',  color: '#E08080', dot: '#B95353', border: 'rgba(185,83,83,0.3)',   label: 'Urgent'    },
  medium:    { bg: 'rgba(198,161,91,0.12)', color: '#D8BB7A', dot: '#C6A15B', border: 'rgba(198,161,91,0.25)', label: 'Medium'    },
  low:       { bg: 'rgba(63,163,124,0.12)', color: '#5AC49A', dot: '#3FA37C', border: 'rgba(63,163,124,0.25)', label: 'Low'       },
  confirmed: { bg: 'rgba(63,163,124,0.12)', color: '#5AC49A', dot: '#3FA37C', border: 'rgba(63,163,124,0.25)', label: 'Confirmed' },
  cancelled: { bg: 'rgba(185,83,83,0.15)',  color: '#E08080', dot: '#B95353', border: 'rgba(185,83,83,0.3)',   label: 'Cancelled' },
}

export default function Badge({ variant }) {
  const v = variants[variant] ?? {
    bg: 'rgba(142,149,165,0.12)',
    color: '#8E95A5',
    dot: '#777B80',
    border: 'rgba(142,149,165,0.2)',
    label: variant,
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: v.bg,
        color: v.color,
        border: `1px solid ${v.border || 'transparent'}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: v.dot }}
      />
      {v.label}
    </span>
  )
}
