'use client'

import { Edit, Trash2, Car, Calendar, CheckCircle } from 'lucide-react'

interface TaskCardProps {
  task: any
  onEdit: (task: any) => void
  onDelete: (taskId: number) => void
  onComplete: (taskId: number) => void
}

export default function TaskCard({ task, onEdit, onDelete, onComplete }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'in_progress':
        return 'En Progreso'
      case 'completed':
        return 'Completada'
      default:
        return status
    }
  }

  const canComplete = task.status !== 'completed'

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}
        >
          {getStatusLabel(task.status)}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {task.brand && task.model && (
          <div className="flex items-center text-sm text-gray-600">
            <Car className="w-4 h-4 mr-2 text-gray-400" />
            <span>{task.brand} {task.model}</span>
            {task.license_plate && (
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {task.license_plate}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          Creada: {new Date(task.created_at).toLocaleDateString('es-ES')}
        </div>

        {task.completed_at && (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completada: {new Date(task.completed_at).toLocaleDateString('es-ES')}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="btn btn-secondary flex items-center text-sm"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="btn btn-danger flex items-center text-sm"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Eliminar
          </button>
        </div>

        {canComplete && (
          <button
            onClick={() => onComplete(task.id)}
            className="btn btn-primary flex items-center text-sm"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Completar
          </button>
        )}
      </div>
    </div>
  )
}