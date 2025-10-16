'use client'

import { useState, useEffect } from 'react'
import { Clock, LogIn, LogOut, Car, Play, Square, Calendar, DollarSign, Wrench, Edit2, MoreVertical } from 'lucide-react'
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
  total_paused_seconds?: number
  current_pause_start?: string
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
  const [allCarSessions, setAllCarSessions] = useState<CarWorkSession[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [carCostsSummary, setCarCostsSummary] = useState<any[]>([])
  const [selectedCar, setSelectedCar] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'clock' | 'history'>('clock')
  const [, forceUpdate] = useState(0)
  const [clockOffset, setClockOffset] = useState<number | null>(null)
  const [showPunchOutModal, setShowPunchOutModal] = useState(false)
  const [carDistributions, setCarDistributions] = useState<CarHourDistribution[]>([{ car_id: 0, hours: 0, minutes: 0 }])
  const [mechanicsSummary, setMechanicsSummary] = useState<MechanicSummary[]>([])
  const [expandedMechanics, setExpandedMechanics] = useState<Set<string>>(new Set())
  const [topMechanic, setTopMechanic] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPunch, setEditingPunch] = useState<Punch | null>(null)
  const [editPassword, setEditPassword] = useState('')
  const [editPunchIn, setEditPunchIn] = useState('')
  const [editPunchOut, setEditPunchOut] = useState('')
  const [editError, setEditError] = useState('')
  const [punchesLimit] = useState(20)
  const [punchesOffset, setPunchesOffset] = useState(0)
  const [totalPunches, setTotalPunches] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showEditSummaryModal, setShowEditSummaryModal] = useState(false)
  const [editingSummary, setEditingSummary] = useState<MechanicSummary | null>(null)
  const [editSummaryPassword, setEditSummaryPassword] = useState('')
  const [editSummaryError, setEditSummaryError] = useState('')
  const [editingCarHours, setEditingCarHours] = useState<{ car_id: number; hours: number; minutes: number; session_id?: number }[]>([])
  const [showMechanicMenu, setShowMechanicMenu] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMechanic, setPaymentMechanic] = useState<MechanicSummary | null>(null)
  const [paymentPassword, setPaymentPassword] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [showResetCarHoursModal, setShowResetCarHoursModal] = useState(false)
  const [resetCarHoursPassword, setResetCarHoursPassword] = useState('')
  const [resetCarHoursError, setResetCarHoursError] = useState('')
  const [showCarMenu, setShowCarMenu] = useState<number | null>(null)
  const [showEditCarHoursModal, setShowEditCarHoursModal] = useState(false)
  const [editingCarCost, setEditingCarCost] = useState<any | null>(null)
  const [editCarHoursValue, setEditCarHoursValue] = useState({ hours: 0, minutes: 0 })
  const [editCarHoursPassword, setEditCarHoursPassword] = useState('')
  const [editCarHoursError, setEditCarHoursError] = useState('')

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
    socketClient.on('punch-paused', handleUpdate)
    socketClient.on('punch-resumed', handleUpdate)
    socketClient.on('car-session-started', handleUpdate)
    socketClient.on('car-session-ended', handleUpdate)

    // Force re-render every second to update elapsed time
    const timer = setInterval(() => forceUpdate(n => n + 1), 1000)

    return () => {
      socketClient.off('punch-added', handleUpdate)
      socketClient.off('punch-updated', handleUpdate)
      socketClient.off('punch-deleted', handleUpdate)
      socketClient.off('punch-paused', handleUpdate)
      socketClient.off('punch-resumed', handleUpdate)
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

      const [punchesData, sessionsData, allSessionsData, carsData, summaryData, carCostsData, leaderboardData] = await Promise.all([
        api.getPunches({ limit: punchesLimit, offset: 0 }), // Removed date filter to show all punches
        api.getCarWorkSessions({ date: today }),
        api.getCarWorkSessions({}), // Get all sessions for payment info
        api.getCars(),
        api.getMechanicCarsSummary(),
        api.getCarCostsSummary(), // Get total hours by car (not filtered by reset date)
        api.getLeaderboard()
      ])

      // Handle pagination response
      if (punchesData && punchesData.punches) {
        setTodayPunches(punchesData.punches || [])
        setTotalPunches(punchesData.total || 0)
        setPunchesOffset(punchesLimit)
      } else {
        // Fallback for old API format (just in case)
        setTodayPunches([])
        setTotalPunches(0)
      }

      setTodayCarSessions(sessionsData)
      setAllCarSessions(allSessionsData)
      setCars(carsData)
      setMechanicsSummary(summaryData)
      setCarCostsSummary(carCostsData)

      // Set top mechanic from leaderboard
      if (leaderboardData && leaderboardData.length > 0) {
        setTopMechanic(leaderboardData[0].name)
      }
    } catch (error) {
      console.error('Error loading punches data:', error)
      setTodayPunches([])
      setTotalPunches(0)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const loadMorePunches = async () => {
    try {
      setLoadingMore(true)

      const punchesData = await api.getPunches({
        limit: punchesLimit,
        offset: punchesOffset
      })

      if (punchesData && punchesData.punches) {
        setTodayPunches(prev => [...prev, ...(punchesData.punches || [])])
        setPunchesOffset(prev => prev + punchesLimit)
      }
    } catch (error) {
      console.error('Error loading more punches:', error)
    } finally {
      setLoadingMore(false)
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

  const playPunchSound = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Resume AudioContext for mobile browsers (iOS/Android require user interaction)
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

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

      // Create all car work sessions in parallel
      const validDistributions = carDistributions.filter(d => d.car_id > 0 && (d.hours > 0 || d.minutes > 0))

      const sessionPromises = validDistributions.map(async (dist) => {
        const totalHours = dist.hours + (dist.minutes / 60)
        const notes = `${dist.hours}h ${dist.minutes}m trabajadas`

        // Create session
        const session = await api.startCarSession({
          punch_id: activePunch.id,
          car_id: dist.car_id,
          mechanic_name: selectedMechanic,
          notes
        })

        // End session immediately
        return api.endCarSession(session.id, notes, totalHours)
      })

      // Wait for all sessions to be created and ended
      await Promise.all(sessionPromises)

      // Then punch out
      await api.punchOut(activePunch.id)

      setActivePunch(null)
      setShowPunchOutModal(false)
      await loadData(false)
    } catch (error: any) {
      console.error('Error al ponchar salida:', error)
      alert(error.message || 'Error al ponchar salida')
    }
  }

  const handlePausePunch = async () => {
    if (!activePunch) return

    // Check if already paused
    if (activePunch.current_pause_start) {
      alert('El punch ya está pausado')
      return
    }

    try {
      await api.pausePunch(activePunch.id, 'lunch')
      await loadData(false)
    } catch (error: any) {
      console.error('Error al pausar punch:', error)
      alert(error.message || 'Error al pausar el punch')
    }
  }

  const handleResumePunch = async () => {
    if (!activePunch) return

    // Check if actually paused
    if (!activePunch.current_pause_start) {
      alert('El punch no está pausado')
      return
    }

    try {
      await api.resumePunch(activePunch.id)
      await loadData(false)
    } catch (error: any) {
      console.error('Error al reanudar punch:', error)
      alert(error.message || 'Error al reanudar el punch')
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

  const handleResetMechanicHours = (mechanicName: string) => {
    // Get current hours before resetting
    const mechanicData = mechanicsSummary.find(m => m.mechanic_name === mechanicName)
    if (!mechanicData) return

    // Open payment modal
    setPaymentMechanic(mechanicData)
    setPaymentPassword('')
    setPaymentError('')
    setShowPaymentModal(true)
  }

  const handleConfirmPayment = async () => {
    if (!paymentMechanic) return

    // Validate password
    if (paymentPassword !== 'hola123') {
      setPaymentError('Contraseña incorrecta')
      return
    }

    const mechanicName = paymentMechanic.mechanic_name
    const totalHours = paymentMechanic.total_hours
    const formattedHours = formatHours(totalHours)

    try {
      // Create punch in
      const punchResponse = await api.punchIn(mechanicName)
      const punchId = punchResponse.id

      // Create car work session and end it immediately in parallel
      if (cars.length > 0) {
        const sessionResponse = await api.startCarSession({
          punch_id: punchId,
          car_id: cars[0].id,
          mechanic_name: mechanicName,
          notes: `PAGO: ${formattedHours} pagadas`
        })

        // End session and punch out in parallel
        await Promise.all([
          api.endCarSession(sessionResponse.id),
          api.punchOut(punchId)
        ])
      } else {
        await api.punchOut(punchId)
      }

      // Reset hours and reload data in parallel
      await Promise.all([
        api.resetMechanicHours(mechanicName),
        loadData(false)
      ])

      // Reset pagination
      setPunchesOffset(0)

      // Close modal
      setShowPaymentModal(false)
      setPaymentMechanic(null)
      setPaymentPassword('')

      // Simple success message (removed "Puedes ver el registro" as requested)
      alert(`✅ Pago registrado: ${formattedHours}`)
    } catch (error: any) {
      console.error('Error al registrar el pago:', error)
      setPaymentError(error.message || 'Error al registrar el pago')
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

  const handleResetCarHours = async () => {
    // Validate password
    if (resetCarHoursPassword !== 'hola123') {
      setResetCarHoursError('Contraseña incorrecta')
      return
    }

    try {
      const result = await api.resetCarHours(resetCarHoursPassword)

      // Close modal
      setShowResetCarHoursModal(false)
      setResetCarHoursPassword('')
      setResetCarHoursError('')

      // Reload data
      await loadData(false)

      alert(`✅ Horas de carros reseteadas exitosamente\n\nSe eliminaron ${result.deleted_sessions} sesiones de trabajo.`)
    } catch (error: any) {
      console.error('Error al resetear horas de carros:', error)
      setResetCarHoursError(error.message || 'Error al resetear horas de carros')
    }
  }

  const handleEditCarHours = (carCost: any) => {
    setEditingCarCost(carCost)
    const totalHours = carCost.total_hours || 0
    const hours = Math.floor(totalHours)
    const minutes = Math.round((totalHours - hours) * 60)
    setEditCarHoursValue({ hours, minutes })
    setEditCarHoursPassword('')
    setEditCarHoursError('')
    setShowEditCarHoursModal(true)
    setShowCarMenu(null)
  }

  const handleSaveCarHours = async () => {
    if (!editingCarCost) return

    // Validate password
    if (editCarHoursPassword !== 'hola123') {
      setEditCarHoursError('Contraseña incorrecta')
      return
    }

    const totalHours = editCarHoursValue.hours + (editCarHoursValue.minutes / 60)

    try {
      await api.updateCarHours(editingCarCost.car_id, totalHours, editCarHoursPassword)

      // Close modal
      setShowEditCarHoursModal(false)
      setEditingCarCost(null)
      setEditCarHoursPassword('')
      setEditCarHoursError('')

      // Reload data
      await loadData(false)

      alert(`✅ Horas actualizadas exitosamente`)
    } catch (error: any) {
      console.error('Error al actualizar horas:', error)
      setEditCarHoursError(error.message || 'Error al actualizar horas')
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

  const getElapsedTime = (punch: Punch | string) => {
    // Support both old signature (string) and new signature (Punch object)
    const startTime = typeof punch === 'string' ? punch : punch.punch_in
    const totalPausedSeconds = typeof punch === 'string' ? 0 : (punch.total_paused_seconds || 0)
    const currentPauseStart = typeof punch === 'string' ? null : punch.current_pause_start

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
    let elapsedMs = nowMs - startMs

    // Subtract total paused seconds (already completed pauses)
    elapsedMs -= totalPausedSeconds * 1000

    // If currently paused, subtract ongoing pause duration
    if (currentPauseStart) {
      const pauseStartMs = new Date(currentPauseStart).getTime()
      const currentPauseDurationMs = nowMs - pauseStartMs
      elapsedMs -= currentPauseDurationMs
    }

    const elapsedSeconds = Math.floor(elapsedMs / 1000)

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

  const handleEditPunch = (punch: Punch) => {
    setEditingPunch(punch)
    // Convert to datetime-local format
    const punchInDate = new Date(punch.punch_in)
    setEditPunchIn(formatDateTimeLocal(punchInDate))

    if (punch.punch_out) {
      const punchOutDate = new Date(punch.punch_out)
      setEditPunchOut(formatDateTimeLocal(punchOutDate))
    } else {
      setEditPunchOut('')
    }

    setEditPassword('')
    setEditError('')
    setShowEditModal(true)
  }

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSubmitEdit = async () => {
    if (!editingPunch) return

    setEditError('')

    if (!editPassword) {
      setEditError('La contraseña es requerida')
      return
    }

    if (!editPunchIn) {
      setEditError('La hora de entrada es requerida')
      return
    }

    if (editPunchOut && new Date(editPunchOut) <= new Date(editPunchIn)) {
      setEditError('La hora de salida debe ser después de la hora de entrada')
      return
    }

    try {
      await api.updatePunchTimes(editingPunch.id, {
        punch_in: new Date(editPunchIn).toISOString(),
        punch_out: editPunchOut ? new Date(editPunchOut).toISOString() : undefined,
        password: editPassword
      })

      // Reload data
      await loadData(false)

      // Close modal
      setShowEditModal(false)
      setEditingPunch(null)
      setEditPassword('')
      setEditPunchIn('')
      setEditPunchOut('')
    } catch (error: any) {
      setEditError(error.message || 'Error al actualizar el ponche')
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingPunch(null)
    setEditPassword('')
    setEditPunchIn('')
    setEditPunchOut('')
    setEditError('')
  }

  const handleEditSummary = async (mechanic: MechanicSummary) => {
    try {
      // Use mechanic.cars data that's already loaded instead of fetching sessions
      const carHoursArray = mechanic.cars.map(car => {
        const totalHours = car.total_hours || 0
        const hours = Math.floor(totalHours)
        const minutes = Math.round((totalHours - hours) * 60)

        return {
          car_id: car.car_id,
          hours,
          minutes,
          session_id: undefined // Will be set by backend when updating
        }
      })

      setEditingSummary(mechanic)
      setEditingCarHours(carHoursArray)
      setEditSummaryPassword('')
      setEditSummaryError('')
      setShowEditSummaryModal(true)
    } catch (error: any) {
      alert('Error al preparar edición: ' + (error.message || 'Error desconocido'))
    }
  }

  const updateEditingCarHour = (index: number, field: 'hours' | 'minutes', value: number) => {
    const updated = [...editingCarHours]
    updated[index] = { ...updated[index], [field]: value }
    setEditingCarHours(updated)
  }

  const handleSubmitSummaryEdit = async () => {
    if (!editingSummary) return

    setEditSummaryError('')

    if (!editSummaryPassword) {
      setEditSummaryError('La contraseña es requerida')
      return
    }

    try {
      // Update each car session
      for (const car of editingCarHours) {
        if (car.session_id) {
          const totalHours = car.hours + (car.minutes / 60)
          await api.updateCarSessionHours(car.session_id, totalHours, editSummaryPassword)
        }
      }

      // Reload data
      await loadData(false)

      // Close modal
      setShowEditSummaryModal(false)
      setEditingSummary(null)
      setEditingCarHours([])
      setEditSummaryPassword('')
    } catch (error: any) {
      setEditSummaryError(error.message || 'Error al actualizar el resumen')
    }
  }

  const closeEditSummaryModal = () => {
    setShowEditSummaryModal(false)
    setEditingSummary(null)
    setEditingCarHours([])
    setEditSummaryPassword('')
    setEditSummaryError('')
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
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-shimmer" style={{ animationDuration: '3s', animationIterationCount: 'infinite' }} />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-2xl md:text-4xl font-black flex items-center gap-2 md:gap-4 drop-shadow-lg">
              <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm">
                <Clock className="w-6 h-6 md:w-10 md:h-10 animate-pulse" />
              </div>
              <span className="leading-tight">Sistema de Ponches</span>
            </h2>
            <p className="text-blue-100 mt-2 text-xs md:text-sm font-medium hidden md:block">Gestiona el tiempo de tus mecánicos de forma profesional</p>
          </div>
          <div className="flex gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={() => setView('clock')}
              className={`group flex-1 md:flex-initial px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all duration-300 transform hover:scale-105 md:hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                view === 'clock'
                  ? 'bg-white text-purple-600 scale-105'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm'
              }`}
            >
              <Clock className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${view === 'clock' ? 'animate-pulse' : 'group-hover:rotate-12'}`} />
              <span>Ponches</span>
            </button>
            <button
              onClick={() => setView('history')}
              className={`group flex-1 md:flex-initial px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all duration-300 transform hover:scale-105 md:hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                view === 'history'
                  ? 'bg-white text-purple-600 scale-105'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm'
              }`}
            >
              <Calendar className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${view === 'history' ? 'animate-pulse' : 'group-hover:rotate-12'}`} />
              <span>Historial</span>
            </button>
          </div>
        </div>
      </div>

      {view === 'clock' ? (
        <>
          {/* Mechanic Selection */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              Seleccionar Empleado
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {mechanics.map((mechanic) => {
                const isTopMechanic = mechanic === topMechanic
                // Check if mechanic has an active punch
                const isOnline = todayPunches.some(punch =>
                  punch.mechanic_name === mechanic && punch.status === 'active'
                )
                return (
                  <button
                    key={mechanic}
                    onClick={() => setSelectedMechanic(mechanic)}
                    className={`group p-3 md:p-5 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all duration-500 hover:scale-105 md:hover:scale-110 hover:shadow-xl md:hover:shadow-2xl active:scale-95 relative overflow-hidden ${
                      selectedMechanic === mechanic
                        ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg transform scale-[1.02] md:scale-105 animate-pulse-subtle'
                        : isTopMechanic
                        ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-md hover:border-yellow-600'
                        : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 shadow-md'
                    }`}
                    style={{
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-shimmer"
                         style={{
                           transform: 'translateX(-100%)',
                         }}
                    />

                    {/* Online status indicator */}
                    {isOnline && (
                      <div className="absolute top-1 left-1 md:top-2 md:left-2 z-10">
                        <div className="relative">
                          <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    )}

                    {isTopMechanic && (
                      <div
                        className="absolute -top-1 -right-1 md:-top-2 md:-right-2 text-lg md:text-2xl animate-bounce z-10"
                        style={{
                          animation: 'bounce 1s infinite, spin 3s linear infinite',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        }}
                      >
                        🏆
                      </div>
                    )}
                    <div className="text-2xl md:text-4xl mb-1 md:mb-2 transition-all duration-500 group-hover:scale-110 md:group-hover:scale-125 group-hover:rotate-12">{mechanicAvatars[mechanic]}</div>
                    <div className={`text-xs md:text-sm font-semibold transition-all duration-300 ${
                      selectedMechanic === mechanic ? 'text-blue-700' : isTopMechanic ? 'text-yellow-700' : 'text-gray-700 group-hover:text-blue-600'
                    }`}>{mechanic}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Punch In/Out Section */}
          {selectedMechanic && (
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
                <div>
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    <span className="text-xl md:text-2xl">{mechanicAvatars[selectedMechanic]}</span>
                    <span className="text-sm md:text-base">{selectedMechanic}</span>
                  </h3>
                  <p className={`text-xs md:text-sm font-medium mt-1 ${activePunch ? 'text-green-600' : 'text-gray-500'}`}>
                    Estado: {activePunch ? '🟢 Dentro (Poncheado)' : '🔴 Fuera'}
                  </p>
                </div>
                <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                  {!activePunch ? (
                    <button
                      onClick={handlePunchIn}
                      className="group flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm md:text-base hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:animate-shimmer" />
                      <LogIn className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:rotate-12" />
                      <span className="relative z-10">Ponche Entrada</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePunchOut}
                      className="group flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold text-sm md:text-base hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden animate-pulse-slow"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:animate-shimmer" />
                      <LogOut className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:rotate-12" />
                      <span className="relative z-10">Ponche Salida</span>
                    </button>
                  )}
                </div>
              </div>

              {activePunch && (
                <div className={`bg-gradient-to-br ${activePunch.current_pause_start ? 'from-yellow-50 to-amber-50 border-yellow-400' : 'from-green-50 to-emerald-50 border-green-300'} border-2 rounded-xl p-5 shadow-md animate-fade-in-up`}>
                  {activePunch.current_pause_start && (
                    <div className="mb-3 px-3 py-2 bg-yellow-100 border border-yellow-400 rounded-lg flex items-center gap-2">
                      <span className="text-yellow-700 font-semibold text-sm">⏸️ EN PAUSA - LUNCH</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="transform transition-all duration-300 hover:scale-105">
                      <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Hora de entrada:
                      </p>
                      <p className="text-xl font-bold text-green-700 mt-1">{formatTime(activePunch.punch_in)}</p>
                    </div>
                    <div className="transform transition-all duration-300 hover:scale-105">
                      <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${activePunch.current_pause_start ? '' : 'animate-spin-slow'}`} />
                        Tiempo trabajado:
                      </p>
                      <p className={`text-xl font-bold ${activePunch.current_pause_start ? 'text-yellow-700' : 'text-green-700 animate-pulse-subtle'} mt-1`}>{getElapsedTime(activePunch)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {!activePunch.current_pause_start ? (
                      <button
                        onClick={handlePausePunch}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <span>⏸️</span> Pausar (Lunch)
                      </button>
                    ) : (
                      <button
                        onClick={handleResumePunch}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg animate-pulse"
                      >
                        <span>▶️</span> Reanudar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary View - Moved from History */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8 mt-6 border-2 border-blue-100 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-8">
              <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-2 md:p-3 rounded-lg md:rounded-xl shadow-md">
                  <DollarSign className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-base md:text-2xl">Resumen de Horas Acumuladas</span>
              </h3>
            </div>

            <div className="space-y-4">
              {mechanicsSummary.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay horas registradas</p>
              ) : (
                mechanicsSummary.map((mechanic, index) => (
                  <div
                    key={mechanic.mechanic_name}
                    className="border-2 border-gray-200 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] animate-fade-in-up relative"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      overflow: 'visible'
                    }}
                  >
                    {/* Mechanic Header */}
                    <div
                      className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-3 md:p-6 cursor-pointer hover:from-blue-100 hover:via-purple-100 hover:to-pink-100 transition-all duration-300 group relative rounded-t-xl md:rounded-t-2xl"
                      onClick={() => toggleMechanicExpanded(mechanic.mechanic_name)}
                      style={{ overflow: 'visible' }}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4" style={{ overflow: 'visible' }}>
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="text-2xl md:text-4xl transition-all duration-300 group-hover:scale-110 md:group-hover:scale-125 group-hover:rotate-12">
                            {mechanicAvatars[mechanic.mechanic_name]}
                          </div>
                          <div>
                            <p className="font-bold text-sm md:text-xl text-gray-800 group-hover:text-blue-700 transition-colors">{mechanic.mechanic_name}</p>
                            <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 flex items-center gap-1 md:gap-2">
                              <Car className="w-3 h-3 md:w-4 md:h-4" />
                              {mechanic.cars.length} {mechanic.cars.length === 1 ? 'carro' : 'carros'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto" style={{ overflow: 'visible' }}>
                          <div className="flex-1 md:flex-initial text-left md:text-right bg-white rounded-lg md:rounded-xl p-2 md:p-4 shadow-sm border-2 border-blue-200 transform transition-all duration-300 hover:scale-105 md:hover:scale-110">
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total</p>
                            <p className="text-base md:text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-0.5 md:mt-1">
                              {formatHours(mechanic.total_hours)}
                            </p>
                          </div>
                          <div className="relative" style={{ overflow: 'visible' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowMechanicMenu(showMechanicMenu === mechanic.mechanic_name ? null : mechanic.mechanic_name)
                              }}
                              className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-lg md:rounded-xl hover:bg-purple-100 transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-sm hover:shadow-md active:scale-95"
                              title="Opciones"
                            >
                              <MoreVertical className="w-4 h-4 md:w-6 md:h-6" />
                            </button>

                            {showMechanicMenu === mechanic.mechanic_name && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowMechanicMenu(null)
                                  }}
                                />
                                <div className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-2xl border-2 border-purple-200 overflow-visible z-40 min-w-[150px]"
                                     style={{ position: 'absolute' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowMechanicMenu(null)
                                      handleEditSummary(mechanic)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-all flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-700"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Editar
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowMechanicMenu(null)
                                      handleResetMechanicHours(mechanic.mechanic_name)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-green-50 transition-all flex items-center gap-2 text-sm font-bold text-green-700 hover:text-green-800 border-t border-gray-100"
                                  >
                                    <span className="text-lg">💰</span>
                                    ¡Pago!
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Car Details */}
                    {expandedMechanics.has(mechanic.mechanic_name) && mechanic.cars.length > 0 && (
                      <div className="bg-gradient-to-br from-white to-gray-50 p-6 border-t-2 border-gray-200 animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Car className="w-5 h-5 text-purple-600" />
                            Desglose por carro:
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSummary(mechanic)
                            }}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all duration-300 transform hover:scale-110 text-xs flex items-center gap-1 shadow-sm"
                          >
                            <MoreVertical className="w-4 h-4" />
                            Editar
                          </button>
                        </div>
                        <div className="space-y-3">
                          {mechanic.cars.map((car, carIndex) => (
                            <div
                              key={car.car_id}
                              className="group flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md border-2 border-transparent hover:border-purple-300 animate-fade-in-up"
                              style={{
                                animationDelay: `${carIndex * 50}ms`,
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:shadow-md transition-all">
                                  <Car className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                                  {car.brand} {car.model} {car.year}
                                </span>
                              </div>
                              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border-2 border-purple-200 group-hover:border-purple-400 transition-all">
                                <span className="font-black text-purple-600 text-lg">
                                  {formatHours(car.total_hours)}
                                </span>
                              </div>
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
      ) : (
        <>
          {/* Cars Summary */}
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8 mt-6 border-2 border-purple-100 animate-fade-in-up">
            <h3 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2 md:gap-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <div className="bg-gradient-to-br from-purple-400 to-pink-600 p-2 md:p-3 rounded-lg md:rounded-xl shadow-md">
                <Car className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <span className="text-base md:text-2xl">Horas Totales por Carro</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {carCostsSummary.map((carCost, index) => {
                return (
                  <div
                    key={carCost.car_id}
                    className="group border-2 border-gray-200 rounded-lg md:rounded-xl p-3 md:p-5 hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 animate-fade-in-up relative"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      overflow: 'visible'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="bg-purple-50 p-2 rounded-lg group-hover:bg-purple-100 transition-all group-hover:scale-110 flex-shrink-0">
                          <Car className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-800 text-sm md:text-base group-hover:text-purple-700 transition-colors truncate">
                            {carCost.brand} {carCost.model}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">{carCost.year}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-2 md:px-3 py-1 md:py-2 rounded-lg border-2 border-purple-200 group-hover:border-purple-400 transition-all group-hover:scale-110 flex-shrink-0">
                          <span className="font-black text-purple-600 text-sm md:text-base">
                            {formatHours(carCost.total_hours)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditCarHours(carCost)
                          }}
                          className="p-1 md:p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-sm hover:shadow-md active:scale-95"
                          title="Editar horas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Punches History */}
          <div className="bg-gradient-to-br from-white to-indigo-50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8 mt-6 border-2 border-indigo-100 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                <div className="bg-gradient-to-br from-purple-400 to-indigo-600 p-2 md:p-3 rounded-lg md:rounded-xl shadow-md">
                  <Clock className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
                <span className="text-base md:text-2xl">Historial de Ponches</span>
              </h3>
              {totalPunches > 0 && (
                <div className="bg-white px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl shadow-md border-2 border-indigo-200">
                  <span className="text-xs md:text-sm font-bold text-gray-700">
                    Mostrando <span className="text-purple-600">{todayPunches.length}</span> de <span className="text-indigo-600">{totalPunches}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {todayPunches.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay ponches registrados hoy</p>
              ) : (
                <>
                  {todayPunches.map((punch, index) => {
                    // Check if this is a payment record (very low hours)
                    const isPayment = punch.total_hours !== null && punch.total_hours !== undefined && punch.total_hours < 0.01

                    // Get payment info from car work session notes
                    let paymentHours = ''
                    if (isPayment) {
                      const paymentSession = allCarSessions.find(s =>
                        s.punch_id === punch.id && s.notes && s.notes.startsWith('PAGO:')
                      )
                      if (paymentSession && paymentSession.notes) {
                        // Extract hours from "PAGO: Xh Ym pagadas"
                        const match = paymentSession.notes.match(/PAGO: (.+) pagadas/)
                        if (match) {
                          paymentHours = match[1]
                        }
                      }
                    }

                    // Format the date
                    const punchDate = new Date(punch.punch_in)
                    const formattedDate = punchDate.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })

                    return (
                      <div
                        key={punch.id}
                        className={`group border-2 rounded-xl p-3 md:p-5 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] animate-fade-in-up ${
                          isPayment
                            ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-400 hover:from-green-100 hover:to-emerald-100'
                            : 'border-gray-200 bg-white hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50'
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        {isPayment ? (
                          // Payment Record Layout
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 md:gap-4 flex-1">
                              <div className="text-3xl md:text-4xl">
                                💰
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-green-700 text-sm md:text-lg">{punch.mechanic_name}</p>
                                <p className="text-xs md:text-sm text-green-600 font-semibold mt-1">
                                  Pago Registrado {paymentHours && `• ${paymentHours}`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  📅 {formattedDate} • {formatTime(punch.punch_in)}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 px-3 md:px-5 py-2 md:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-md text-xs md:text-sm">
                              Horas Pagadas
                            </div>
                          </div>
                        ) : (
                          // Regular Punch Layout
                          <div className="flex flex-col gap-3">
                            {/* Header row with mechanic info and edit button */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 md:gap-4 flex-1">
                                <div className="text-2xl md:text-3xl transform transition-all duration-300 group-hover:scale-110 md:group-hover:scale-125 group-hover:rotate-12">
                                  {mechanicAvatars[punch.mechanic_name]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-800 text-sm md:text-lg transition-colors group-hover:text-purple-700">{punch.mechanic_name}</p>
                                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-5 text-xs md:text-sm text-gray-600 mt-1">
                                    <span className="flex items-center gap-1 transition-all duration-300 hover:text-green-600">
                                      <LogIn className="w-3 h-3" />
                                      Entrada: <strong>{formatTime(punch.punch_in)}</strong>
                                    </span>
                                    {punch.punch_out && (
                                      <span className="flex items-center gap-1 transition-all duration-300 hover:text-red-600">
                                        <LogOut className="w-3 h-3" />
                                        Salida: <strong>{formatTime(punch.punch_out)}</strong>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleEditPunch(punch)}
                                className="flex-shrink-0 p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl hover:bg-blue-100 transition-all duration-300 transform hover:scale-110 hover:rotate-12 hover:shadow-md active:scale-95"
                                title="Editar ponche"
                              >
                                <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                            </div>

                            {/* Bottom row with hours and status */}
                            <div className="flex items-center justify-between gap-2">
                              {punch.total_hours && (
                                <div className="text-left transform transition-all duration-300 hover:scale-105">
                                  <p className="text-xs text-gray-500 font-medium">Total</p>
                                  <span className="font-bold text-purple-600 text-base md:text-xl">
                                    {formatHours(punch.total_hours)}
                                  </span>
                                </div>
                              )}
                              <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-sm transition-all duration-300 flex items-center gap-1 ${
                                punch.status === 'active'
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 animate-pulse-subtle'
                                  : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700'
                              }`}>
                                <span className="text-base">{punch.status === 'active' ? '🟢' : '✅'}</span>
                                <span>{punch.status === 'active' ? 'Activo' : 'Completado'}</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Load More Button */}
                  {todayPunches.length < totalPunches && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={loadMorePunches}
                        disabled={loadingMore}
                        className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-shimmer" />
                        {loadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span className="relative z-10">Cargando más ponches...</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="relative z-10">
                              Ver más ({totalPunches - todayPunches.length} restantes)
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
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

      {/* Edit Punch Modal */}
      {showEditModal && editingPunch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit2 className="w-6 h-6" />
                Editar Ponche
              </h3>
              <p className="text-blue-100 mt-1">
                {editingPunch.mechanic_name} - {new Date(editingPunch.punch_in).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  ⚠️ {editError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de Administrador:
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa la contraseña"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Entrada:
                </label>
                <input
                  type="datetime-local"
                  value={editPunchIn}
                  onChange={(e) => setEditPunchIn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Salida:
                </label>
                <input
                  type="datetime-local"
                  value={editPunchOut}
                  onChange={(e) => setEditPunchOut(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Deja vacío si el ponche está activo</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitEdit}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Summary Modal */}
      {showEditSummaryModal && editingSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <MoreVertical className="w-6 h-6" />
                Editar Resumen de Horas
              </h3>
              <p className="text-purple-100 mt-1">
                {mechanicAvatars[editingSummary.mechanic_name]} {editingSummary.mechanic_name}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {editSummaryError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  ⚠️ {editSummaryError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de Administrador:
                </label>
                <input
                  type="password"
                  value={editSummaryPassword}
                  onChange={(e) => setEditSummaryPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ingresa la contraseña"
                />
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Horas por carro:</h4>
                <div className="space-y-4">
                  {editingCarHours.map((car, index) => {
                    const carInfo = cars.find(c => c.id === car.car_id)
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-700">
                            {carInfo ? `${carInfo.brand} ${carInfo.model} ${carInfo.year}` : 'Carro desconocido'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Horas:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={car.hours}
                              onChange={(e) => updateEditingCarHour(index, 'hours', Number(e.target.value))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                              value={car.minutes}
                              onChange={(e) => updateEditingCarHour(index, 'minutes', Number(e.target.value))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Nuevo total acumulado:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const totalMinutes = editingCarHours.reduce((sum, car) => sum + (car.hours * 60 + car.minutes), 0)
                    const hours = Math.floor(totalMinutes / 60)
                    const minutes = totalMinutes % 60
                    return `${hours}h ${minutes}m`
                  })()}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeEditSummaryModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitSummaryEdit}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 shadow-md hover:shadow-lg transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentMechanic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-7 h-7" />
                Registrar Pago
              </h3>
              <p className="text-green-100 mt-1">
                {mechanicAvatars[paymentMechanic.mechanic_name]} {paymentMechanic.mechanic_name}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  ⚠️ {paymentError}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total a pagar:</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {formatHours(paymentMechanic.total_hours)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de Administrador:
                </label>
                <input
                  type="password"
                  value={paymentPassword}
                  onChange={(e) => {
                    setPaymentPassword(e.target.value)
                    setPaymentError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmPayment()
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ingresa la contraseña"
                  autoFocus
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-medium">⚠️ Importante:</p>
                <p className="mt-1">
                  Esto registrará el pago en el historial y reseteará las horas acumuladas del mecánico.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentMechanic(null)
                    setPaymentPassword('')
                    setPaymentError('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                >
                  💰 Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Car Hours Modal */}
      {showEditCarHoursModal && editingCarCost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Edit2 className="w-6 h-6" />
                Editar Horas de Carro
              </h3>
              <p className="text-purple-100 mt-1">
                {editingCarCost.brand} {editingCarCost.model} {editingCarCost.year}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {editCarHoursError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  ⚠️ {editCarHoursError}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Horas actuales:</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatHours(editingCarCost.total_hours)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Nuevas horas:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Horas:</label>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={editCarHoursValue.hours}
                      onChange={(e) => setEditCarHoursValue({ ...editCarHoursValue, hours: Number(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Minutos:</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={editCarHoursValue.minutes}
                      onChange={(e) => setEditCarHoursValue({ ...editCarHoursValue, minutes: Number(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de Administrador:
                </label>
                <input
                  type="password"
                  value={editCarHoursPassword}
                  onChange={(e) => {
                    setEditCarHoursPassword(e.target.value)
                    setEditCarHoursError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveCarHours()
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ingresa la contraseña"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEditCarHoursModal(false)
                    setEditingCarCost(null)
                    setEditCarHoursPassword('')
                    setEditCarHoursError('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCarHours}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Car Hours Modal */}
      {showResetCarHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                🗑️ Resetear Horas de Carros
              </h3>
              <p className="text-red-100 mt-1">
                Eliminar todo el historial de trabajo
              </p>
            </div>

            <div className="p-6 space-y-6">
              {resetCarHoursError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  ⚠️ {resetCarHoursError}
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-bold text-yellow-800 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  ¡ADVERTENCIA!
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Esta acción es <strong>PERMANENTE</strong> y eliminará todas las sesiones de trabajo completadas de todos los carros.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Las horas de todos los carros volverán a 0.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de Administrador:
                </label>
                <input
                  type="password"
                  value={resetCarHoursPassword}
                  onChange={(e) => {
                    setResetCarHoursPassword(e.target.value)
                    setResetCarHoursError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleResetCarHours()
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Ingresa la contraseña"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowResetCarHoursModal(false)
                    setResetCarHoursPassword('')
                    setResetCarHoursError('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetCarHours}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all"
                >
                  🗑️ Resetear Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
