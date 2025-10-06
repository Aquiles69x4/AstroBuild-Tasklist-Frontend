'use client'

import { io, Socket } from 'socket.io-client'

class SocketClient {
  private socket: Socket | null = null
  private isConnected = false

  connect() {
    if (this.socket) return this.socket

    this.socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      // Configuración para manejar cold starts de Render
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 15000,
      timeout: 60000, // 60 segundos para conectar (Render cold start)
      transports: ['websocket', 'polling'], // Intentar websocket primero, luego polling
    })

    this.socket.on('connect', () => {
      console.log('✅ Connected to server')
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.log('⚠️ Connection error, retrying...', error.message)
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`)
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`)
      this.isConnected = true
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  getSocket() {
    return this.socket
  }

  isSocketConnected() {
    return this.isConnected
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }
}

export const socketClient = new SocketClient()