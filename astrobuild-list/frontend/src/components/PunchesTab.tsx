'use client'

import { useState, useEffect } from 'react'
import { Clock, LogIn, LogOut, Car, Play, Square, Calendar, DollarSign, Wrench } from 'lucide-react'
import { api } from '@/lib/api'
import { socketClient } from '@/lib/socket'

interface Punch {
  id: number
  mechanic_name: string
  punch_in: string
  punch_out?: string
  total_hours?: number
  date: string
  status: 'active' | 'completed'
  created_at: string
  updated_at: string
}

interface CarWorkSession {
  id: number
  punch_id: number
  car_id: number
  mechanic_name: string
  start_time: string
  end_time?: string
  total_hours?: number
  notes?: string
  brand?: string
  model?: string
  year?: number
}

interface Car {
  id: number
  brand: string
  model: string
  year: number
}

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

export default function PunchesTab() {
  const [selectedMechanic, setSelectedMechanic] = useState('')
  const [activePunch, setActivePunch] = useState<Punch | null>(null)
  const [activeCarSession, setActiveCarSession] = useState<CarWorkSession | null>(null)
  const [todayPunches, setTodayPunches] = useState<Punch[]>([])
  const [todayCarSessions, setTodayCarSessions] = useState<CarWorkSession[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [selectedCar, setSelectedCar] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'clock' | 'history'>('clock')

  useEffect(() => {
    loadData()
    socketClient.connect()

    const handleUpdate = () => {
      console.log('Punch/session event received, reloading data...')
      loadData()
    }

    socketClient.on('punch-added', handleUpdate)
    socketClient.on('punch-updated', handleUpdate)
    socketClient.on('punch-deleted', handleUpdate)
    socketClient.on('car-session-started', handleUpdate)
    socketClient.on('car-session-ended', handleUpdate)

    return () => {
      socketClient.off('punch-added', handleUpdate)
      socketClient.off('punch-updated', handleUpdate)
      socketClient.off('punch-deleted', handleUpdate)
      socketClient.off('car-session-started', handleUpdate)
      socketClient.off('car-session-ended', handleUpdate)
    }
  }, [])

  useEffect(() => {
    if (selectedMechanic) {
      checkActivePunch()
      checkActiveCarSession()
    }
  }, [selectedMechanic])

  const loadData = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      const [punchesData, sessionsData, carsData] = await Promise.all([
        api.getPunches({ date: today }),
        api.getCarWorkSessions({ date: today }),
        api.getCars()
      ])

      setTodayPunches(punchesData)
      setTodayCarSessions(sessionsData)
      setCars(carsData)
    } catch (error) {
      console.error('Error loading punches data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkActivePunch = async () => {
    if (!selectedMechanic) return

    try {
      const response = await api.getActivePunch(selectedMechanic)
      if (response.active) {
        setActivePunch(response.punch)
      } else {
        setActivePunch(null)
      }
    } catch (error) {
      console.error('Error checking active punch:', error)
    }
  }

  const checkActiveCarSession = async () => {
    if (!selectedMechanic) return

    try {
      const response = await api.getActiveCarSession(selectedMechanic)
      if (response.active) {
        setActiveCarSession(response.session)
      } else {
        setActiveCarSession(null)
      }
    } catch (error) {
      console.error('Error checking active car session:', error)
    }
  }

  const handlePunchIn = async () => {
    if (!selectedMechanic) return

    try {
      const punch = await api.punchIn(selectedMechanic)
      setActivePunch(punch)
      await loadData()
    } catch (error: any) {
      alert(error.message || 'Error al ponchar entrada')
    }
  }

  const handlePunchOut = async () => {
    if (!activePunch) return

    // Check if there's an active car session
    if (activeCarSession) {
      alert('Debes terminar la sesión del carro actual antes de ponchar salida')
      return
    }

    try {
      await api.punchOut(activePunch.id)
      setActivePunch(null)
      await loadData()
    } catch (error: any) {
      alert(error.message || 'Error al ponchar salida')
    }
  }

  const handleStartCarWork = async () => {
    if (!activePunch || !selectedCar) return

    try {
      const session = await api.startCarSession({
        punch_id: activePunch.id,
        car_id: selectedCar,
        mechanic_name: selectedMechanic
      })
      setActiveCarSession(session)
      setSelectedCar(null)
      await loadData()
    } catch (error: any) {
      alert(error.message || 'Error al iniciar trabajo en carro')
    }
  }

  const handleEndCarWork = async () => {
    if (!activeCarSession) return

    try {
      await api.endCarSession(activeCarSession.id)
      setActiveCarSession(null)
      await loadData()
    } catch (error: any) {
      alert(error.message || 'Error al terminar trabajo en carro')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatHours = (hours?: number | string) => {
    if (!hours) return '0.00'
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    if (isNaN(numHours)) return '0.00'
    return numHours.toFixed(2)
  }

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime()
    const now = new Date().getTime()
    const elapsed = (now - start) / 1000 / 3600
    return formatHours(elapsed)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-8 h-8" />
              Sistema de Ponches
            </h2>
            <p className="text-blue-100 mt-1">Control de horas de trabajo y costos por carro</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('clock')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'clock'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Ponchar
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'history'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Historial
            </button>
          </div>
        </div>
      </div>

      {view === 'clock' ? (
        <>
          {/* Mechanic Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              Seleccionar Empleado
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mechanics.map((mechanic) => (
                <button
                  key={mechanic}
                  onClick={() => setSelectedMechanic(mechanic)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedMechanic === mechanic
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-1">{mechanicAvatars[mechanic]}</div>
                  <div className="text-sm font-medium text-gray-700">{mechanic}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Punch In/Out Section */}
          {selectedMechanic && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {mechanicAvatars[selectedMechanic]} {selectedMechanic}
                  </h3>
                  <p className={`text-sm font-medium mt-1 ${activePunch ? 'text-green-600' : 'text-gray-500'}`}>
                    Estado: {activePunch ? '🟢 Dentro (Poncheado)' : '🔴 Fuera'}
                  </p>
                </div>
                <div className="flex gap-3">
                  {!activePunch ? (
                    <button
                      onClick={handlePunchIn}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                    >
                      <LogIn className="w-5 h-5" />
                      Ponche Entrada
                    </button>
                  ) : (
                    <button
                      onClick={handlePunchOut}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      Ponche Salida
                    </button>
                  )}
                </div>
              </div>

              {activePunch && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Hora de entrada:</p>
                      <p className="text-lg font-bold text-green-700">{formatTime(activePunch.punch_in)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tiempo transcurrido:</p>
                      <p className="text-lg font-bold text-green-700">{getElapsedTime(activePunch.punch_in)} hrs</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Car Work Session */}
          {activePunch && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Trabajo en Carros
              </h3>

              {!activeCarSession ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Selecciona un carro para empezar a trabajar:</p>
                  <select
                    value={selectedCar || ''}
                    onChange={(e) => setSelectedCar(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Seleccionar Carro --</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} {car.year}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleStartCarWork}
                    disabled={!selectedCar}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5" />
                    Iniciar Trabajo en Carro
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Trabajando en:</p>
                        <p className="text-lg font-bold text-blue-700">
                          {activeCarSession.brand} {activeCarSession.model} {activeCarSession.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Tiempo en este carro:</p>
                        <p className="text-lg font-bold text-blue-700">
                          {getElapsedTime(activeCarSession.start_time)} hrs
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">Inicio: {formatTime(activeCarSession.start_time)}</p>
                    </div>
                    <button
                      onClick={handleEndCarWork}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 shadow-md hover:shadow-lg transition-all"
                    >
                      <Square className="w-5 h-5" />
                      Terminar Trabajo en Este Carro
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* History View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Punches */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Ponches de Hoy
              </h3>
              <div className="space-y-3">
                {todayPunches.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay ponches hoy</p>
                ) : (
                  todayPunches.map((punch) => (
                    <div key={punch.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{mechanicAvatars[punch.mechanic_name]}</span>
                          <span className="font-medium">{punch.mechanic_name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          punch.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {punch.status === 'active' ? 'Activo' : 'Completado'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Entrada:</span>
                          <span className="ml-2 font-medium">{formatTime(punch.punch_in)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Salida:</span>
                          <span className="ml-2 font-medium">
                            {punch.punch_out ? formatTime(punch.punch_out) : '-'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Total horas:</span>
                          <span className="ml-2 font-bold text-blue-600">
                            {formatHours(punch.total_hours)} hrs
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Today's Car Sessions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-purple-600" />
                Sesiones en Carros Hoy
              </h3>
              <div className="space-y-3">
                {todayCarSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay sesiones hoy</p>
                ) : (
                  todayCarSessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-purple-700">
                            {session.brand} {session.model} {session.year}
                          </p>
                          <p className="text-sm text-gray-600">
                            {mechanicAvatars[session.mechanic_name]} {session.mechanic_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Horas:</p>
                          <p className="font-bold text-purple-600">
                            {formatHours(session.total_hours)} hrs
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(session.start_time)} - {session.end_time ? formatTime(session.end_time) : 'En progreso'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
