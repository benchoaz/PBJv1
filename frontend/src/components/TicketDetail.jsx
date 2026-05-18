import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  'in progress': 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:5000/api/tickets/${id}`)
      .then(res => res.json())
      .then(data => setTicket(data))
      .catch(err => console.error('Failed to fetch ticket:', err))
  }, [id])

  if (!ticket) {
    return <div className="text-gray-500">Loading...</div>
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        &larr; Back
      </button>
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">#{ticket.id}</span>
              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-800'
              }`}>
                {ticket.status}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                PRIORITY_COLORS[ticket.priority] || 'bg-gray-100 text-gray-800'
              }`}>
                {ticket.priority}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{ticket.title}</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-500">Project</label>
            <p className="text-gray-900">{ticket.project_name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Source URL</label>
            {ticket.source_url ? (
              <a
                href={ticket.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 break-all"
              >
                {ticket.source_url}
              </a>
            ) : (
              <p className="text-gray-500">N/A</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">Created At</label>
            <p className="text-gray-900">
              {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Updated At</label>
            <p className="text-gray-900">
              {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 block mb-2">Description</label>
          <div className="bg-gray-50 rounded-md p-4 border border-gray-100">
            <p className="text-gray-700 whitespace-pre-wrap">
              {ticket.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {ticket.metadata && Object.keys(ticket.metadata).length > 0 && (
          <div className="mt-6">
            <label className="text-sm text-gray-500 block mb-2">Metadata</label>
            <pre className="bg-gray-900 text-gray-100 rounded-md p-4 text-sm overflow-x-auto">
              {JSON.stringify(ticket.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}