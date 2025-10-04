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

interface CarHourDistribution {
  car_id: number
  hours: number
  minutes: number
}

interface MechanicSummary {
  mechanic_name: string
  total_hours: number
  cars: {
    car_id: number
    brand: string
    model: string
    year: number
    total_hours: number
  }[]
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
  const [, forceUpdate] = useState(0)
  const [clockOffset, setClockOffset] = useState<number | null>(null)
  const [showPunchOutModal, setShowPunchOutModal] = useState(false)
  const [carDistributions, setCarDistributions] = useState<CarHourDistribution[]>([{ car_id: 0, hours: 0, minutes: 0 }])
  const [mechanicsSummary, setMechanicsSummary] = useState<MechanicSummary[]>([])
  const [expandedMechanics, setExpandedMechanics] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Try to load clock offset from localStorage
    const savedOffset = localStorage.getItem('clockOffset')
    if (savedOffset) {
      setClockOffset(Number(savedOffset))
      console.log('Loaded clock offset from storage:', savedOffset, 'ms')
    }

    loadData()
    socketClient.connect()

    const handleUpdate = () => {
      loadData(false)
    }

    socketClient.on('punch-added', handleUpdate)
    socketClient.on('punch-updated', handleUpdate)
    socketClient.on('punch-deleted', handleUpdate)
    socketClient.on('car-session-started', handleUpdate)
    socketClient.on('car-session-ended', handleUpdate)

    // Force re-render every second to update elapsed time
    const timer = setInterval(() => forceUpdate(n => n + 1), 1000)

    return () => {
      socketClient.off('punch-added', handleUpdate)
      socketClient.off('punch-updated', handleUpdate)
      socketClient.off('punch-deleted', handleUpdate)
      socketClient.off('car-session-started', handleUpdate)
      socketClient.off('car-session-ended', handleUpdate)
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (selectedMechanic) {
      checkActivePunch()
      checkActiveCarSession()
    }
  }, [selectedMechanic])

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const today = new Date().toISOString().split('T')[0]

      const [punchesData, sessionsData, carsData, summaryData] = await Promise.all([
        api.getPunches({ date: today }),
        api.getCarWorkSessions({ date: today }),
        api.getCars(),
        api.getMechanicCarsSummary()
      ])

      setTodayPunches(punchesData)
      setTodayCarSessions(sessionsData)
      setCars(carsData)
      setMechanicsSummary(summaryData)
    } catch (error) {
      console.error('Error loading punches data:', error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
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

  const playPunchSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Create a "punch" sound with two quick beeps
      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)

      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.value = 1000
        osc2.type = 'sine'
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        osc2.start(audioContext.currentTime)
        osc2.stop(audioContext.currentTime + 0.1)
      }, 100)
    } catch (e) {
      console.log('Could not play sound:', e)
    }
  }

  const handlePunchIn = async () => {
    if (!selectedMechanic) return

    try {
      // Play punch sound
      playPunchSound()

      const clientTimeBeforePunch = Date.now()
      const punch = await api.punchIn(selectedMechanic)
      const serverPunchTime = new Date(punch.punch_in).getTime()

      // Calculate offset: how much ahead is the server compared to client
      const offset = serverPunchTime - clientTimeBeforePunch
      setClockOffset(offset)
      localStorage.setItem('clockOffset', offset.toString())
      console.log('Clock offset calculated:', offset, 'ms (', (offset / 1000 / 60).toFixed(1), 'minutes )')

      setActivePunch(punch)
      await loadData(false)
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

    // Show modal to distribute hours
    setCarDistributions([{ car_id: 0, hours: 0, minutes: 0 }])
    setShowPunchOutModal(true)
  }

  const handleConfirmPunchOut = async () => {
    if (!activePunch) return

    try {
      // Play punch sound
      playPunchSound()

      // First create car work sessions for each distribution BEFORE punching out
      const validDistributions = carDistributions.filter(d => d.car_id > 0 && (d.hours > 0 || d.minutes > 0))

      for (const dist of validDistributions) {
        // Calculate total hours in decimal format
        const totalHours = dist.hours + (dist.minutes / 60)

        // Create and immediately end the session
        await api.startCarSession({
          punch_id: activePunch.id,
          car_id: dist.car_id,
          mechanic_name: selectedMechanic,
          notes: `${dist.hours}h ${dist.minutes}m trabajadas`
        })

        // Get the session we just created and end it
        const sessions = await api.getCarWorkSessions({
          mechanic_name: selectedMechanic,
          car_id: dist.car_id
        })
        const lastSession = sessions[0]
        if (lastSession && !lastSession.end_time) {
          await api.endCarSession(
            lastSession.id,
            `${dist.hours}h ${dist.minutes}m trabajadas`,
            totalHours
          )
        }
      }

      // Then punch out (after all car sessions are saved)
      await api.punchOut(activePunch.id)

      setActivePunch(null)
      setShowPunchOutModal(false)
      await loadData(false)
    } catch (error: any) {
      console.error('Error al ponchar salida:', error)
      alert(error.message || 'Error al ponchar salida')
    }
  }

  const addCarDistribution = () => {
    if (carDistributions.length < 3) {
      setCarDistributions([...carDistributions, { car_id: 0, hours: 0, minutes: 0 }])
    }
  }

  const removeCarDistribution = (index: number) => {
    if (carDistributions.length > 1) {
      setCarDistributions(carDistributions.filter((_, i) => i !== index))
    }
  }

  const updateCarDistribution = (index: number, field: keyof CarHourDistribution, value: number) => {
    const updated = [...carDistributions]
    updated[index] = { ...updated[index], [field]: value }
    setCarDistributions(updated)
  }

  const getTotalDistributedTime = () => {
    return carDistributions.reduce((total, dist) => {
      return total + (dist.hours * 60 + dist.minutes)
    }, 0)
  }

  const getTotalWorkTime = () => {
    if (!activePunch) return 0
    const startMs = new Date(activePunch.punch_in).getTime()

    // If we don't have a clock offset yet, calculate it on the fly from the activePunch
    let offset = clockOffset
    if (offset === null && activePunch) {
      // Estimate offset from the punch_in time vs current client time
      // This is a fallback in case offset wasn't saved
      const serverTime = new Date(activePunch.punch_in).getTime()
      const estimatedClientTime = serverTime - (4 * 60 * 60 * 1000) // Assume 4 hour difference
      offset = serverTime - estimatedClientTime
    }

    const nowMs = Date.now() + (offset || 0)
    const elapsedMs = nowMs - startMs

    // Ensure we don't return negative values
    if (elapsedMs < 0) return 0

    return Math.floor(elapsedMs / 1000 / 60) // in minutes
  }

  const toggleMechanicExpanded = (mechanicName: string) => {
    const newExpanded = new Set(expandedMechanics)
    if (newExpanded.has(mechanicName)) {
      newExpanded.delete(mechanicName)
    } else {
      newExpanded.add(mechanicName)
    }
    setExpandedMechanics(newExpanded)
  }

  const handleResetMechanicHours = async (mechanicName: string) => {
    if (!confirm(`¿Resetear las horas de ${mechanicName}? Esto marcará el período como pagado.`)) {
      return
    }

    try {
      await api.resetMechanicHours(mechanicName)
      await loadData(false)
    } catch (error: any) {
      alert(error.message || 'Error al resetear horas')
    }
  }

  const handleResetAllHours = async () => {
    if (!confirm('¿Resetear las horas de TODOS los mecánicos? Esto marcará el período como pagado.')) {
      return
    }

    try {
      await api.resetAllHours()
      await loadData(false)
    } catch (error: any) {
      alert(error.message || 'Error al resetear todas las horas')
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
      await loadData(false)
    } catch (error: any) {
      alert(error.message || 'Error al iniciar trabajo en carro')
    }
  }

  const handleEndCarWork = async () => {
    if (!activeCarSession) return

    try {
      await api.endCarSession(activeCarSession.id)
      setActiveCarSession(null)
      await loadData(false)
    } catch (error: any) {
      alert(error.message || 'Error al terminar trabajo en carro')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    // Manually adjust UTC to Puerto Rico time (UTC-4)
    const prTime = new Date(date.getTime() - (4 * 60 * 60 * 1000))
    return prTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatHours = (hours?: number | string) => {
    if (!hours) return '0h 0m'
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    if (isNaN(numHours) || numHours < 0) return '0h 0m'

    const h = Math.floor(numHours)
    const m = Math.round((numHours - h) * 60)

    return `${h}h ${m}m`
  }

  const getElapsedTime = (startTime: string) => {
    const startMs = new Date(startTime).getTime()

    // Use saved offset or estimate it
    let offset = clockOffset
    if (offset === null) {
      // Fallback: estimate offset assuming 4 hour difference
      const savedOffset = localStorage.getItem('clockOffset')
      if (savedOffset) {
        offset = Number(savedOffset)
      } else {
        // Last resort: assume 4 hour offset based on Puerto Rico timezone
        offset = 4 * 60 * 60 * 1000
      }
    }

    const nowMs = Date.now() + offset
    const elapsedSeconds = Math.floor((nowMs - startMs) / 1000)

    if (elapsedSeconds <= 0) return '0s'

    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = elapsedSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
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
                  className={`p-5 rounded-2xl border-4 transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 ${
                    selectedMechanic === mechanic
                      ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg transform scale-105'
                      : 'border-gray-400 bg-white hover:border-blue-500 hover:bg-blue-50 shadow-md'
                  }`}
                  style={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div className="text-4xl mb-2 transition-transform duration-300 hover:scale-125">{mechanicAvatars[mechanic]}</div>
                  <div className={`text-sm font-semibold ${
                    selectedMechanic === mechanic ? 'text-blue-700' : 'text-gray-700'
                  }`}>{mechanic}</div>
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
                      <p className="text-lg font-bold text-green-700">{getElapsedTime(activePunch.punch_in)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Summary View */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Resumen de Horas Acumuladas
              </h3>
              <button
                onClick={handleResetAllHours}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all flex items-center gap-2"
              >
                🔄 Resetear Todas las Horas
              </button>
            </div>

            <div className="space-y-4">
              {mechanicsSummary.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay horas registradas</p>
              ) : (
                mechanicsSummary.map((mechanic) => (
                  <div key={mechanic.mechanic_name} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Mechanic Header */}
                    <div
                      className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-all"
                      onClick={() => toggleMechanicExpanded(mechanic.mechanic_name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{mechanicAvatars[mechanic.mechanic_name]}</span>
                          <div>
                            <p className="font-bold text-lg text-gray-800">{mechanic.mechanic_name}</p>
                            <p className="text-sm text-gray-600">
                              {mechanic.cars.length} {mechanic.cars.length === 1 ? 'carro' : 'carros'} trabajados
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Total Acumulado</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatHours(mechanic.total_hours)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleResetMechanicHours(mechanic.mechanic_name)
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                          >
                            Resetear
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Car Details */}
                    {expandedMechanics.has(mechanic.mechanic_name) && mechanic.cars.length > 0 && (
                      <div className="bg-white p-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-600 mb-3">Desglose por carro:</p>
                        <div className="space-y-2">
                          {mechanic.cars.map((car) => (
                            <div
                              key={car.car_id}
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-gray-700">
                                  {car.brand} {car.model} {car.year}
                                </span>
                              </div>
                              <span className="font-bold text-purple-600">
                                {formatHours(car.total_hours)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Punch Out Modal - Car Hour Distribution */}
      {showPunchOutModal && activePunch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <LogOut className="w-6 h-6" />
                Ponche de Salida - Distribución de Horas
              </h3>
              <p className="text-red-100 mt-1">Distribuye tus horas entre los carros en los que trabajaste</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Work Time Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tiempo total trabajado:</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {Math.floor(getTotalWorkTime() / 60)}h {getTotalWorkTime() % 60}m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tiempo distribuido:</p>
                    <p className={`text-2xl font-bold ${getTotalDistributedTime() > getTotalWorkTime() ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.floor(getTotalDistributedTime() / 60)}h {getTotalDistributedTime() % 60}m
                    </p>
                  </div>
                </div>
                {getTotalDistributedTime() > getTotalWorkTime() && (
                  <p className="text-red-600 text-sm mt-2 font-medium">
                    ⚠️ El tiempo distribuido excede el tiempo total trabajado
                  </p>
                )}
              </div>

              {/* Car Distributions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700">Carros trabajados:</h4>
                  {carDistributions.length < 3 && (
                    <button
                      onClick={addCarDistribution}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all"
                    >
                      + Agregar Carro
                    </button>
                  )}
                </div>

                {carDistributions.map((dist, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Carro #{index + 1}</span>
                      {carDistributions.length > 1 && (
                        <button
                          onClick={() => removeCarDistribution(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Carro:
                      </label>
                      <select
                        value={dist.car_id}
                        onChange={(e) => updateCarDistribution(index, 'car_id', Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={0}>-- Seleccionar Carro --</option>
                        {cars.map((car) => (
                          <option key={car.id} value={car.id}>
                            {car.brand} {car.model} {car.year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horas:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={dist.hours}
                          onChange={(e) => updateCarDistribution(index, 'hours', Number(e.target.value))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minutos:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={dist.minutes}
                          onChange={(e) => updateCarDistribution(index, 'minutes', Number(e.target.value))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPunchOutModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPunchOut}
                  disabled={getTotalDistributedTime() > getTotalWorkTime()}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Ponche de Salida
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
