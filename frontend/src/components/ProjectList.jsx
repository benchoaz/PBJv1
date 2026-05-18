import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function ProjectList() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array
        setProjects(Array.isArray(data) ? data : (data?.data || []))
      })
      .catch(err => console.error('Failed to fetch projects:', err))
  }, [])

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Projects Overview</h1>
          <p className="text-slate-400 mt-1">Manage and track construction projects in Java.</p>
        </div>
      </div>
      {projects.length === 0 ? (
        <div className="glass-panel p-8 text-center animate-slide-up">
          <p className="text-slate-400 text-lg">No projects found. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="glass-panel p-6 group hover:border-indigo-500/30 transition-all duration-300"
            >
              <h2 className="text-xl font-semibold text-indigo-300 mb-2 group-hover:text-indigo-400 transition-colors">
                {project.name}
              </h2>
              <p className="text-slate-300 mb-4 line-clamp-2 text-sm leading-relaxed">
                {project.description || 'No description available.'}
              </p>
              
              {/* Added detail fields based on schema */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-slate-400">
                <div>Ministry: <span className="text-slate-200">{project.ministry}</span></div>
                <div>Location: <span className="text-slate-200">{project.province}</span></div>
                <div>Budget: <span className="text-slate-200">Rp {(project.budget || 0).toLocaleString()}</span></div>
                <div>Progress: <span className="text-slate-200">{project.progress}%</span></div>
              </div>

              <div className="flex items-center justify-between text-sm pt-4 border-t border-white/10">
                <span className="text-slate-400">{project.ticket_count || 0} tickets</span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs tracking-wider uppercase font-medium">
                  {project.status || 'Active'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}