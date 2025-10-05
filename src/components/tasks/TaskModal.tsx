'use client'

import { useState, useEffect } from 'react'
import { X, Flag } from 'lucide-react'
import { api } from '@/lib/api'

interface TaskModalProps {
  task?: any
  cars: any[]
  onSave: (taskData: any) => Promise<void>
  onClose: () => void
}

export default function TaskModal({ task, cars, onSave, onClose }: TaskModalProps) {
  const [formData, setFormData] = useState({
    car_id: task?.car_id || '',
    title: task?.title || '',
    description: task?.description || '',
    assigned_mechanic: task?.assigned_mechanic || '',
    points: task?.points || 1,
    is_priority: task?.is_priority || false,
    status: task?.status || 'pending'
  })
  const [mechanics, setMechanics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadMechanics = async () => {
      try {
        const data = await api.getMechanics()
        setMechanics(data)
      } catch (err) {
        console.error('Error loading mechanics:', err)
      }
    }
    loadMechanics()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        car_id: parseInt(formData.car_id),
        points: parseInt(formData.points.toString()),
        assigned_mechanic: formData.assigned_mechanic || null,
        is_priority: formData.is_priority ? 1 : 0
      }
      await onSave(submitData)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const activeCars = cars.filter(car => car.status !== 'delivered')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Editar Tarea' : 'Agregar Tarea'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="car_id" className="block text-sm font-medium text-gray-700 mb-1">
              Carro *
            </label>
            <select
              id="car_id"
              name="car_id"
              required
              className="select"
              value={formData.car_id}
              onChange={handleChange}
            >
              <option value="">Seleccionar carro</option>
              {activeCars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model} - {car.license_plate} ({car.customer_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título de la Tarea *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="input"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Cambio de aceite, Reparación de frenos, etc."
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción detallada de la tarea..."
            />
          </div>

          <div>
            <label htmlFor="assigned_mechanic" className="block text-sm font-medium text-gray-700 mb-1">
              Mecánico Asignado
            </label>
            <select
              id="assigned_mechanic"
              name="assigned_mechanic"
              className="select"
              value={formData.assigned_mechanic}
              onChange={handleChange}
            >
              <option value="">Sin asignar</option>
              {mechanics.map(mechanic => (
                <option key={mechanic.name} value={mechanic.name}>
                  {mechanic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
              Dificultad (Puntos)
            </label>
            <select
              id="points"
              name="points"
              className="select"
              value={formData.points}
              onChange={handleChange}
            >
              <option value="1">⭐ Fácil (1 punto)</option>
              <option value="2">⭐⭐ Media (2 puntos)</option>
              <option value="3">⭐⭐⭐ Difícil (3 puntos)</option>
              <option value="4">⭐⭐⭐⭐ Muy Difícil (4 puntos)</option>
              <option value="5">⭐⭐⭐⭐⭐ Extrema (5 puntos)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="is_priority"
              name="is_priority"
              checked={formData.is_priority}
              onChange={handleChange}
              className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="is_priority" className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
              <Flag className={`w-4 h-4 mr-2 ${formData.is_priority ? 'text-red-600 fill-red-600' : 'text-gray-400'}`} />
              Marcar como prioritaria (Bandera roja)
            </label>
          </div>

          {task && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="status"
                name="status"
                className="select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                task ? 'Actualizar' : 'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}