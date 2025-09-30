'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CarModalProps {
  isOpen: boolean
  car?: any
  onSave: (carData: any) => Promise<void>
  onClose: () => void
}

export default function CarModal({ isOpen, car, onSave, onClose }: CarModalProps) {
  const [formData, setFormData] = useState({
    brand: car?.brand || '',
    model: car?.model || '',
    year: car?.year || new Date().getFullYear(),
    repair_time: car?.repair_time || '',
    start_date: car?.start_date || '',
    status: car?.status || 'pending'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onSave(formData)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {car ? 'Editar Carro' : 'Agregar Carro'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                required
                className="input"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Toyota, Honda, etc."
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                required
                className="input"
                value={formData.model}
                onChange={handleChange}
                placeholder="Corolla, Civic, etc."
              />
            </div>
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Año *
            </label>
            <input
              type="number"
              id="year"
              name="year"
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              className="input"
              value={formData.year}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="repair_time" className="block text-sm font-medium text-gray-700 mb-1">
              Tiempo de Arreglo Estimado
            </label>
            <input
              type="text"
              id="repair_time"
              name="repair_time"
              className="input"
              value={formData.repair_time}
              onChange={handleChange}
              placeholder="Ej: 3 días, 1 semana, 2-3 días"
            />
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Iniciación
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              className="input"
              value={formData.start_date}
              onChange={handleChange}
            />
          </div>

          {car && (
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
                <option value="completed">Completado</option>
                <option value="delivered">Entregado</option>
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
                car ? 'Actualizar' : 'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}