'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { socketClient } from '@/lib/socket'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'

export default function TasksSection() {
  const [tasks, setTasks] = useState<any[]>([])
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [cars, setCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()

    socketClient.on('task-added', (newTask) => {
      setTasks(prev => [newTask, ...prev])
    })

    socketClient.on('task-updated', (updatedTask) => {
      setTasks(prev => prev.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      ))
    })

    socketClient.on('task-deleted', ({ id }) => {
      setTasks(prev => prev.filter(task => task.id !== id))
    })

    return () => {
      socketClient.off('task-added')
      socketClient.off('task-updated')
      socketClient.off('task-deleted')
    }
  }, [])

  useEffect(() => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchTerm, statusFilter])

  const loadData = async () => {
    try {
      const [tasksData, carsData] = await Promise.all([
        api.getTasks(),
        api.getCars()
      ])
      setTasks(tasksData)
      setCars(carsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setShowModal(true)
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task)
    setShowModal(true)
  }

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await api.deleteTask(taskId)
      } catch (error) {
        console.error('Error deleting task:', error)
        alert('Error al eliminar la tarea')
      }
    }
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, taskData)
      } else {
        await api.createTask(taskData)
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving task:', error)
      throw error
    }
  }

  const handleCompleteTask = async (taskId: number) => {
    try {
      await api.updateTask(taskId, { status: 'completed' })
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Error al completar la tarea')
    }
  }

  const statusOptions = [
    { value: 'all', label: '📋 Todas' },
    { value: 'pending', label: '⏳ Pendientes' },
    { value: 'in_progress', label: '🔧 En Progreso' },
    { value: 'completed', label: '✅ Completadas' }
  ]

  const getStatusCounts = () => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
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
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h2>
          <p className="text-gray-600">Lista colaborativa de tareas del taller</p>
        </div>
        <button
          onClick={handleAddTask}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Tarea
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-lg font-semibold text-gray-900">
            {tasks.length}
          </div>
          <div className="text-sm text-gray-600">📋 Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-lg font-semibold text-yellow-600">
            {statusCounts.pending || 0}
          </div>
          <div className="text-sm text-gray-600">⏳ Pendientes</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-lg font-semibold text-blue-600">
            {statusCounts.in_progress || 0}
          </div>
          <div className="text-sm text-gray-600">🔧 En Progreso</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-lg font-semibold text-green-600">
            {statusCounts.completed || 0}
          </div>
          <div className="text-sm text-gray-600">✅ Completadas</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {tasks.length === 0 ? 'No hay tareas registradas' : 'No se encontraron tareas'}
          </div>
          {tasks.length === 0 && (
            <button
              onClick={handleAddTask}
              className="btn btn-primary"
            >
              Agregar la primera tarea
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onComplete={handleCompleteTask}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editingTask}
          cars={cars}
          onSave={handleSaveTask}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}