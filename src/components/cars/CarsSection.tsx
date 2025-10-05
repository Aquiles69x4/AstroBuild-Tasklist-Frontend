'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import { socketClient } from '@/lib/socket'
import CarCard from './CarCard'
import CarModal from './CarModal'

export default function CarsSection() {
  const [cars, setCars] = useState<any[]>([])
  const [filteredCars, setFilteredCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCar, setEditingCar] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadCars()

    socketClient.on('car-added', (newCar) => {
      setCars(prev => [newCar, ...prev])
    })

    socketClient.on('car-updated', (updatedCar) => {
      setCars(prev => prev.map(car =>
        car.id === updatedCar.id ? updatedCar : car
      ))
    })

    socketClient.on('car-deleted', ({ id }) => {
      setCars(prev => prev.filter(car => car.id !== id))
    })

    return () => {
      socketClient.off('car-added')
      socketClient.off('car-updated')
      socketClient.off('car-deleted')
    }
  }, [])

  useEffect(() => {
    let filtered = cars

    if (searchTerm) {
      filtered = filtered.filter(car =>
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(car => car.status === statusFilter)
    }

    setFilteredCars(filtered)
  }, [cars, searchTerm, statusFilter])

  const loadCars = async () => {
    try {
      const carsData = await api.getCars()
      setCars(carsData)
    } catch (error) {
      console.error('Error loading cars:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCar = () => {
    setEditingCar(null)
    setShowModal(true)
  }

  const handleEditCar = (car: any) => {
    setEditingCar(car)
    setShowModal(true)
  }

  const handleDeleteCar = async (carId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este carro?')) {
      try {
        await api.deleteCar(carId)
      } catch (error) {
        console.error('Error deleting car:', error)
        alert('Error al eliminar el carro')
      }
    }
  }

  const handleSaveCar = async (carData: any) => {
    try {
      if (editingCar) {
        await api.updateCar(editingCar.id, carData)
      } else {
        await api.createCar(carData)
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving car:', error)
      throw error
    }
  }

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'completed', label: 'Completados' },
    { value: 'delivered', label: 'Entregados' }
  ]

  const getStatusCounts = () => {
    const counts = cars.reduce((acc, car) => {
      acc[car.status] = (acc[car.status] || 0) + 1
      return acc
    }, {})
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Carros</h2>
          <p className="text-gray-600">Administra los vehículos en el taller</p>
        </div>
        <button
          onClick={handleAddCar}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Carro
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusOptions.map((option) => (
          <div
            key={option.value}
            className={`card p-4 text-center cursor-pointer transition-colors ${
              statusFilter === option.value
                ? 'bg-primary-50 border-primary-200'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setStatusFilter(option.value)}
          >
            <div className="text-lg font-semibold text-gray-900">
              {option.value === 'all' ? cars.length : (statusCounts[option.value] || 0)}
            </div>
            <div className="text-sm text-gray-600">{option.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo, placa o cliente..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCars.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {cars.length === 0 ? 'No hay carros registrados' : 'No se encontraron carros'}
          </div>
          {cars.length === 0 && (
            <button
              onClick={handleAddCar}
              className="btn btn-primary"
            >
              Agregar el primer carro
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onEdit={handleEditCar}
              onDelete={handleDeleteCar}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CarModal
          isOpen={showModal}
          car={editingCar}
          onSave={handleSaveCar}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}