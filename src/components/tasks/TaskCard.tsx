'use client'

import { Edit, Trash2, Car, Calendar, CheckCircle, Flag, User, Star } from 'lucide-react'

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

  const renderStars = (points: number) => {
    return Array.from({ length: points }, (_, i) => (
      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400 inline" />
    ))
  }

  return (
    <div className={`card p-6 hover:shadow-md transition-shadow ${task.is_priority ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {task.is_priority && (
              <Flag className="w-4 h-4 text-red-600 fill-red-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {task.title}
            </h3>
          </div>
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

        {task.assigned_mechanic && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span>Mecánico: <span className="font-medium text-gray-900">{task.assigned_mechanic}</span></span>
          </div>
        )}

        {task.points && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">Dificultad:</span>
            {renderStars(task.points)}
            <span className="ml-1 text-xs">({task.points} {task.points === 1 ? 'punto' : 'puntos'})</span>
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