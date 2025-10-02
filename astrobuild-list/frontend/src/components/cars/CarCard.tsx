'use client'

import { Edit, Trash2, User, Calendar, Phone } from 'lucide-react'

interface CarCardProps {
  car: any
  onEdit: (car: any) => void
  onDelete: (carId: number) => void
}

export default function CarCard({ car, onEdit, onDelete }: CarCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200'
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
        return 'Completado'
      case 'delivered':
        return 'Entregado'
      default:
        return status
    }
  }

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {car.brand} {car.model}
          </h3>
          <p className="text-sm text-gray-600">{car.year}</p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(car.status)}`}
        >
          {getStatusLabel(car.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-16 h-10 bg-primary-100 rounded border border-primary-200 flex items-center justify-center mr-3">
            <span className="text-xs font-mono text-primary-700">
              {car.license_plate}
            </span>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          {car.customer_name}
        </div>

        {car.customer_phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            {car.customer_phone}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          {new Date(car.created_at).toLocaleDateString('es-ES')}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(car)}
          className="btn btn-secondary flex items-center text-sm"
        >
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </button>
        <button
          onClick={() => onDelete(car.id)}
          className="btn btn-danger flex items-center text-sm"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar
        </button>
      </div>
    </div>
  )
}