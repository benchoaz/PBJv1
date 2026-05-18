import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const PRIORITY_COLORS = {
  high: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

const STATUS_COLORS = {
  open: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'in progress': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/tickets')
      .then(res => res.json())
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch tickets:', err))
  }, [])

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter)

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Support Tickets</h1>
          <p className="text-slate-400 mt-1">Manage issues and requests for all projects.</p>
        </div>
        <div className="flex gap-2 p-1 glass-panel rounded-xl">
          {['all', 'open', 'in progress', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize font-medium transition-all duration-300 ${
                filter === status
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      
      {filteredTickets.length === 0 ? (
        <div className="glass-panel p-8 text-center animate-slide-up">
          <p className="text-slate-400 text-lg">No tickets found for this filter.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden animate-slide-up">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Project
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    <Link to={`/tickets/${ticket.id}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      #{ticket.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-200">
                    <Link to={`/tickets/${ticket.id}`} className="hover:text-indigo-300 transition-colors font-medium">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs rounded-full capitalize border ${
                      PRIORITY_COLORS[ticket.priority] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs rounded-full capitalize border ${
                      STATUS_COLORS[ticket.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {ticket.project_name || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}