import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:5000/api/projects/${id}`)
      .then(res => res.json())
      .then(data => setProject(data))
      .catch(err => console.error('Failed to fetch project:', err))
  }, [id])

  if (!project) {
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
          <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm">
            {project.status || 'Active'}
          </span>
        </div>
        <p className="text-gray-600 mb-6">{project.description}</p>
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-4">Tickets</h2>
          {project.tickets && project.tickets.length > 0 ? (
            <div className="grid gap-4">
              {project.tickets.map(ticket => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="bg-gray-50 rounded-md p-4 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-indigo-600">
                      {ticket.title}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                    {ticket.description}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tickets in this project.</p>
          )}
        </div>
      </div>
    </div>
  )
}