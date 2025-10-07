'use client'

import { useState, useEffect } from 'react'
import { Car, Plus, Check, Clock, AlertCircle, Trash2, Edit3, Zap, Flag, ChevronUp, ChevronDown } from 'lucide-react'
import confetti from 'canvas-confetti'
import { api } from '@/lib/api'
import { socketClient } from '@/lib/socket'
import { playConfettiSound } from '@/lib/sounds'
import CarModal from './cars/CarModal'

interface Car {
  id: number
  brand: string
  model: string
  year: number
  repair_time?: string
  start_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'delivered'
  created_at: string
  updated_at: string
}

interface Task {
  id: number
  car_id: number
  title: string
  description?: string
  assigned_mechanic?: string
  points: number
  is_priority?: number
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  completed_at?: string
  // Car properties (included in priority tasks from backend)
  brand?: string
  model?: string
  year?: number
}

const gradients = [
  'from-orange-400 via-pink-500 to-purple-600',
  'from-blue-500 via-purple-500 to-pink-500',
  'from-green-400 via-blue-500 to-purple-600',
  'from-yellow-400 via-red-500 to-pink-500',
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-teal-400 via-blue-500 to-purple-600'
]

const mechanics = [
  'IgenieroErick',
  'ChristianCobra',
  'Chicanto',
  'SpiderSteven',
  'LaBestiaPelua',
  'PhonKing',
  'CarlosMariconGay'
]

const mechanicAvatars: { [key: string]: string } = {
  'IgenieroErick': '👨‍💻',
  'ChristianCobra': '🐍',
  'Chicanto': '🎵',
  'SpiderSteven': '🕷️',
  'LaBestiaPelua': '🦁',
  'PhonKing': '📱',
  'CarlosMariconGay': '🌈'
}

export default function IntegratedSection() {
  const [cars, setCars] = useState<Car[]>([])
  const [tasks, setTasks] = useState<{ [carId: number]: Task[] }>({})
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCarModal, setShowCarModal] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState<{ [carId: number]: string }>({})
  const [completingTaskMechanic, setCompletingTaskMechanic] = useState<{ [taskId: number]: string }>({})
  const [newTaskPoints, setNewTaskPoints] = useState<{ [carId: number]: number }>({})
  const [newTaskMechanic, setNewTaskMechanic] = useState<{ [carId: number]: string }>({})
  const [newTaskPriority, setNewTaskPriority] = useState<{ [carId: number]: boolean }>({})
  const [showNewTaskInput, setShowNewTaskInput] = useState<{ [carId: number]: boolean }>({})

  useEffect(() => {
    loadData(true) // Initial load with spinner

    // Connect socket
    socketClient.connect()

    // Socket listeners - reload without spinner for seamless updates
    const handleUpdate = () => {
      console.log('Socket event received, reloading data...')
      loadData(false)
    }

    socketClient.on('car-added', handleUpdate)
    socketClient.on('car-updated', handleUpdate)
    socketClient.on('car-deleted', handleUpdate)
    socketClient.on('car-moved', handleUpdate)
    socketClient.on('task-added', handleUpdate)
    socketClient.on('task-updated', handleUpdate)
    socketClient.on('task-deleted', handleUpdate)

    return () => {
      socketClient.off('car-added', handleUpdate)
      socketClient.off('car-updated', handleUpdate)
      socketClient.off('car-deleted', handleUpdate)
      socketClient.off('car-moved', handleUpdate)
      socketClient.off('task-added', handleUpdate)
      socketClient.off('task-updated', handleUpdate)
      socketClient.off('task-deleted', handleUpdate)
    }
  }, [])

  const loadData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true)
      }
      const [carsData, allTasks, priorityTasksData] = await Promise.all([
        api.getCars(),
        api.getTasks(),
        api.getPriorityTasks()
      ])

      setCars(carsData)

      // Order priority tasks by car order
      const carOrderMap = new Map<number, number>(carsData.map((car: Car, index: number) => [car.id, index]))
      const orderedPriorityTasks = priorityTasksData.sort((a: Task, b: Task) => {
        const orderA = carOrderMap.get(a.car_id) ?? 999
        const orderB = carOrderMap.get(b.car_id) ?? 999
        return orderA - orderB
      })
      setPriorityTasks(orderedPriorityTasks)

      // Group tasks by car_id
      const tasksByCarId: { [carId: number]: Task[] } = {}
      allTasks.forEach((task: Task) => {
        if (!tasksByCarId[task.car_id]) {
          tasksByCarId[task.car_id] = []
        }
        tasksByCarId[task.car_id].push(task)
      })

      setTasks(tasksByCarId)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      if (showLoadingSpinner) {
        setLoading(false)
      }
    }
  }

  const handleAddTask = async (carId: number) => {
    const title = newTaskTitle[carId]?.trim()
    if (!title) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3004'}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          car_id: carId,
          title,
          description: '',
          assigned_mechanic: newTaskMechanic[carId] || null,
          points: newTaskPoints[carId] || 1,
          is_priority: newTaskPriority[carId] ? 1 : 0
        })
      })

      if (response.ok) {
        // Clear inputs
        setNewTaskTitle(prev => ({ ...prev, [carId]: '' }))
        setNewTaskPoints(prev => ({ ...prev, [carId]: 1 }))
        setNewTaskMechanic(prev => ({ ...prev, [carId]: '' }))
        setNewTaskPriority(prev => ({ ...prev, [carId]: false }))
        setShowNewTaskInput(prev => ({ ...prev, [carId]: false }))
        // Socket will handle update via 'task-added' event
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const handleToggleTaskStatus = async (taskId: number, currentStatus: string) => {
    // If marking as completed, show mechanic selector first
    if (currentStatus !== 'completed') {
      setCompletingTaskMechanic(prev => ({ ...prev, [taskId]: '' }))
      return
    }

    // If unmarking completed, just toggle back to pending
    const newStatus = 'pending'

    try {
      await api.updateTask(taskId, {
        status: newStatus,
        assigned_mechanic: null
      })
      // Socket will handle update via 'task-updated' event
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleCompleteTask = async (taskId: number, mechanic: string) => {
    if (!mechanic) {
      alert('Por favor selecciona un mecánico')
      return
    }

    try {
      // Disparar confetti visual con múltiples explosiones
      const count = 200
      const defaults = {
        origin: { y: 0.7 }
      }

      const fire = (particleRatio: number, opts: any) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6']
        })
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })
      fire(0.2, {
        spread: 60,
      })
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      })
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      })
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })

      // Reproducir sonido
      playConfettiSound()

      await api.updateTask(taskId, {
        status: 'completed',
        assigned_mechanic: mechanic
      })

      // Clear the mechanic selector
      setCompletingTaskMechanic(prev => {
        const updated = { ...prev }
        delete updated[taskId]
        return updated
      })
      // Socket will handle update via 'task-updated' event
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  const handleCancelCompletion = (taskId: number) => {
    setCompletingTaskMechanic(prev => {
      const updated = { ...prev }
      delete updated[taskId]
      return updated
    })
  }

  const handleDeleteTask = async (taskId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await api.deleteTask(taskId)
        // Socket will handle update via 'task-deleted' event
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const handleDeleteCar = async (carId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este carro? Esto eliminará también todas sus tareas.')) {
      try {
        await api.deleteCar(carId)
        // Socket will handle update via 'car-deleted' event
      } catch (error) {
        console.error('Error deleting car:', error)
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
      setShowCarModal(false)
      setEditingCar(null)
      // Socket will handle update via 'car-added' or 'car-updated' event
    } catch (error) {
      console.error('Error saving car:', error)
      throw error
    }
  }

  const handleMoveCar = async (carId: number, direction: 'up' | 'down') => {
    try {
      await api.moveCar(carId, direction)
      // Socket will handle update via 'car-moved' event
    } catch (error) {
      console.error('Error moving car:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Car className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Cargando taller...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="mb-4 overflow-visible -ml-44 sm:-ml-60">
            <img
              src="/images/logo-astrobuild.png"
              alt="ASTROBUILD Tareas"
              className="w-auto"
              style={{
                height: '80px',
                transform: 'scale(6)',
                transformOrigin: 'left center',
                filter: 'drop-shadow(8px 8px 16px rgba(0,0,0,0.4))',
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-800 tracking-wide mt-4"
                style={{
                  fontFamily: 'Anton, sans-serif',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  letterSpacing: '2px'
                }}>
              Carros:
            </h2>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowCarModal(true)
              }}
              className="bg-black text-white px-6 py-3 rounded-2xl flex items-center space-x-2 font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Vehículo</span>
            </button>
          </div>
        </div>

        {/* Priority Tasks Section */}
        {priorityTasks.length > 0 && (
          <div className="mb-8">
            <div
              className="car-card relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
              style={{
                animation: 'slideInUp 0.5s ease-out both'
              }}
            >
              {/* Gradient Header - Red theme for urgent tasks */}
              <div className="bg-gradient-to-r from-red-500 via-orange-500 to-pink-600 p-6 text-white relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 animate-pulse">
                        <Flag className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">
                          🚩 Tareas Urgentes
                        </h3>
                        <p className="text-white/80 text-sm">
                          {priorityTasks.length} {priorityTasks.length === 1 ? 'tarea prioritaria' : 'tareas prioritarias'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Tasks List */}
              <div className="bg-white rounded-t-3xl p-6 -mt-6 relative z-10">
                <div className="space-y-3">
                  {priorityTasks.map((task, taskIndex) => (
                    <div
                      key={task.id}
                      className="task-item group p-4 rounded-2xl border border-l-4 border-l-red-500 bg-white hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                      style={{
                        animation: `fadeInSlide 0.3s ease-out ${taskIndex * 0.05}s both`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <button
                            onPointerDown={(e) => {
                              e.preventDefault()
                              handleToggleTaskStatus(task.id, task.status)
                            }}
                            className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 touch-none ${
                              task.status === 'completed'
                                ? 'bg-green-500 border-green-500 text-white shadow-lg animate-pulse'
                                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                            }`}
                            style={{ touchAction: 'none' }}
                          >
                            {task.status === 'completed' && <Check className="w-4 h-4" />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Flag className="w-4 h-4 text-red-600 fill-red-600" />
                              <span className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                <span className="font-medium">{task.brand} {task.model} {task.year}</span>
                              </div>
                              {task.assigned_mechanic && (
                                <div className="flex items-center gap-1">
                                  <span>{mechanicAvatars[task.assigned_mechanic]}</span>
                                  <span>{task.assigned_mechanic}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      {completingTaskMechanic[task.id] !== undefined && task.status !== 'completed' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 relative">
                          <button
                            onClick={() => handleCancelCompletion(task.id)}
                            className="absolute -top-1 -right-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
                            title="Cancelar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <div className="flex items-center gap-2">
                            <select
                              value={completingTaskMechanic[task.id]}
                              onChange={(e) => setCompletingTaskMechanic(prev => ({
                                ...prev,
                                [task.id]: e.target.value
                              }))}
                              className="flex-1 min-w-0 px-2 md:px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">Seleccionar...</option>
                              {mechanics.map(mechanic => (
                                <option key={mechanic} value={mechanic}>
                                  {mechanicAvatars[mechanic]} {mechanic}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleCompleteTask(task.id, completingTaskMechanic[task.id])}
                              disabled={!completingTaskMechanic[task.id]}
                              className="px-3 md:px-4 py-2 bg-green-500 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                            >
                              ✓ OK
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {cars.map((car, index) => {
            const carTasks = tasks[car.id] || []
            const completedTasks = carTasks.filter(task => task.status === 'completed').length
            const totalTasks = carTasks.length
            const gradient = gradients[index % gradients.length]

            return (
              <div
                key={car.id}
                className="car-card group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
                style={{
                  animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${gradient} p-6 text-white relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300 flex-shrink-0">
                          <Car className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-xl font-bold mb-1 truncate">
                            {car.brand} {car.model} {car.year}
                          </h3>
                          <p className="text-white/80 text-xs md:text-sm mb-2 md:mb-3 truncate">
                            {car.repair_time && `⏱️ ${car.repair_time}`}
                            {car.start_date && ` • 📅 ${new Date(car.start_date).toLocaleDateString()}`}
                          </p>
                          <div className="flex items-center space-x-2 md:space-x-3 flex-wrap gap-1">
                            <div className="bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full">
                              <span className="text-xs font-semibold whitespace-nowrap">
                                {car.status === 'pending' ? '⏳ Pendiente' :
                                 car.status === 'in_progress' ? '🔧 Progreso' :
                                 car.status === 'completed' ? '✅ Listo' : '🎉 Entregado'}
                              </span>
                            </div>
                            {totalTasks > 0 && (
                              <div className="flex items-center space-x-1 text-xs md:text-sm animate-pulse">
                                <Zap className="w-3 h-3 md:w-4 md:h-4 animate-bounce" />
                                <span className="font-semibold whitespace-nowrap">{completedTasks}/{totalTasks}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleMoveCar(car.id, 'up')}
                          disabled={index === 0}
                          className="opacity-0 group-hover:opacity-100 p-1.5 md:p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 hover:scale-110 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover arriba"
                        >
                          <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleMoveCar(car.id, 'down')}
                          disabled={index === cars.length - 1}
                          className="opacity-0 group-hover:opacity-100 p-1.5 md:p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 hover:scale-110 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover abajo"
                        >
                          <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                        </button>
                        <button
                          onClick={() => setEditingCar(car)}
                          className="p-1.5 md:p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 hover:scale-110 transition-all duration-200"
                          title="Editar vehículo"
                        >
                          <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="p-1.5 md:p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-red-500/30 hover:scale-110 transition-all duration-200"
                          title="Eliminar vehículo"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks Section */}
                <div className="bg-white rounded-t-3xl p-6 -mt-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900 text-lg">📝 Tareas</h4>
                    <button
                      onClick={() => setShowNewTaskInput(prev => ({ ...prev, [car.id]: !prev[car.id] }))}
                      className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 hover:scale-105 transition-all duration-200 flex items-center space-x-1 shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nueva</span>
                    </button>
                  </div>

                  {/* Add new task input */}
                  {showNewTaskInput[car.id] && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                      <div className="space-y-3">
                        {/* Task title */}
                        <input
                          type="text"
                          value={newTaskTitle[car.id] || ''}
                          onChange={(e) => setNewTaskTitle(prev => ({ ...prev, [car.id]: e.target.value }))}
                          placeholder="Ej: Cambiar aceite, Revisar frenos..."
                          className="w-full px-4 py-3 bg-white border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTask(car.id)}
                        />

                        {/* Two column layout for selects */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Mechanic selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Mecánico Asignado</label>
                            <select
                              value={newTaskMechanic[car.id] || ''}
                              onChange={(e) => setNewTaskMechanic(prev => ({ ...prev, [car.id]: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                            >
                              <option value="">Sin asignar</option>
                              {mechanics.map(mechanic => (
                                <option key={mechanic} value={mechanic}>
                                  {mechanicAvatars[mechanic]} {mechanic}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Points selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Dificultad (Puntos)</label>
                            <select
                              value={newTaskPoints[car.id] || 1}
                              onChange={(e) => setNewTaskPoints(prev => ({ ...prev, [car.id]: parseInt(e.target.value) }))}
                              className="w-full px-3 py-2 bg-white border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                            >
                              <option value={1}>⭐ Fácil (1 pto)</option>
                              <option value={2}>⭐⭐ Media (2 ptos)</option>
                              <option value={3}>⭐⭐⭐ Difícil (3 ptos)</option>
                              <option value={4}>⭐⭐⭐⭐ Muy Difícil (4 ptos)</option>
                              <option value={5}>⭐⭐⭐⭐⭐ Extrema (5 ptos)</option>
                            </select>
                          </div>
                        </div>

                        {/* Priority checkbox */}
                        <div className="flex items-center space-x-2 p-3 bg-white rounded-xl border border-gray-200">
                          <input
                            type="checkbox"
                            id={`priority-${car.id}`}
                            checked={newTaskPriority[car.id] || false}
                            onChange={(e) => setNewTaskPriority(prev => ({ ...prev, [car.id]: e.target.checked }))}
                            className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`priority-${car.id}`} className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                            <Flag className={`w-4 h-4 mr-2 ${newTaskPriority[car.id] ? 'text-red-600 fill-red-600' : 'text-gray-400'}`} />
                            Marcar como prioritaria (Bandera roja)
                          </label>
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleAddTask(car.id)}
                            className="flex-1 py-3 bg-black text-white text-sm rounded-xl hover:bg-gray-800 font-semibold"
                          >
                            ✅ Crear Tarea
                          </button>
                          <button
                            onClick={() => setShowNewTaskInput(prev => ({ ...prev, [car.id]: false }))}
                            className="px-6 py-3 text-gray-600 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tasks list */}
                  <div className="space-y-3">
                    {carTasks.length > 0 ? (
                      carTasks.map((task, taskIndex) => (
                        <div
                          key={task.id}
                          className={`task-item group p-4 rounded-2xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                            task.status === 'completed'
                              ? 'bg-green-50 border-green-200'
                              : task.is_priority
                              ? 'bg-white border-l-4 border-l-red-500 border-gray-200 hover:border-gray-300'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            animation: `fadeInSlide 0.3s ease-out ${taskIndex * 0.05}s both`
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <button
                                onPointerDown={(e) => {
                                  e.preventDefault()
                                  handleToggleTaskStatus(task.id, task.status)
                                }}
                                className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 touch-none ${
                                  task.status === 'completed'
                                    ? 'bg-green-500 border-green-500 text-white shadow-lg animate-pulse'
                                    : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                                }`}
                                style={{ touchAction: 'none' }}
                              >
                                {task.status === 'completed' && <Check className="w-4 h-4" />}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  {task.is_priority === 1 && (
                                    <Flag className="w-4 h-4 text-red-600 fill-red-600 flex-shrink-0 animate-bounce" />
                                  )}
                                  <p className={`font-medium ${
                                    task.status === 'completed' ? 'line-through text-green-600' : 'text-gray-900'
                                  }`}>
                                    {task.title}
                                  </p>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                      {task.points} pts
                                    </span>
                                  </div>
                                </div>
                                {task.assigned_mechanic && (
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-gray-500">Asignado a:</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                      {mechanicAvatars[task.assigned_mechanic]} {task.assigned_mechanic}
                                    </span>
                                  </div>
                                )}
                                {task.description && (
                                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                              title="Eliminar tarea"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Mechanic selection when completing task */}
                          {completingTaskMechanic[task.id] !== undefined && (
                            <div className="mt-4 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-xl relative">
                              <button
                                onClick={() => handleCancelCompletion(task.id)}
                                className="absolute -top-1 -right-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
                                title="Cancelar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>

                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </div>
                                <span className="font-medium text-blue-800 text-xs md:text-sm">
                                  ¿Qué mecánico completó esta tarea?
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={completingTaskMechanic[task.id] || ''}
                                  onChange={(e) => setCompletingTaskMechanic(prev => ({
                                    ...prev,
                                    [task.id]: e.target.value
                                  }))}
                                  className="flex-1 min-w-0 px-2 md:px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Seleccionar...</option>
                                  {mechanics.map(mechanic => (
                                    <option key={mechanic} value={mechanic}>
                                      {mechanicAvatars[mechanic]} {mechanic}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => handleCompleteTask(task.id, completingTaskMechanic[task.id])}
                                  disabled={!completingTaskMechanic[task.id]}
                                  className="px-3 md:px-4 py-2 bg-green-500 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                                >
                                  ✓ OK
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Check className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">Sin tareas asignadas</p>
                        <p className="text-sm text-gray-500 mt-1">Agrega la primera tarea para este vehículo</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {cars.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Car className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">¡Bienvenido al Taller!</h3>
              <p className="text-gray-600 mb-8 text-lg">Comienza registrando tu primer vehículo</p>
              <button
                onClick={() => setShowCarModal(true)}
                className="bg-black text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all duration-200 shadow-lg flex items-center space-x-3 mx-auto"
              >
                <Plus className="w-6 h-6" />
                <span>Registrar Primer Vehículo</span>
              </button>
            </div>
          )}
        </div>

        {/* Car Modal */}
        {(showCarModal || editingCar) && (
          <CarModal
            isOpen={showCarModal || !!editingCar}
            onClose={() => {
              setShowCarModal(false)
              setEditingCar(null)
            }}
            onSave={handleSaveCar}
            car={editingCar}
          />
        )}
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .car-card:hover {
          transform: translateY(-4px);
        }

        .task-item:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}