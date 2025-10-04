const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || error.error || 'Request failed')
    }

    return response.json()
  }

  // Cars API
  async getCars(status?: string) {
    const query = status ? `?status=${status}` : ''
    return this.request(`/cars${query}`)
  }

  async getCar(id: number) {
    return this.request(`/cars/${id}`)
  }

  async createCar(carData: any) {
    return this.request('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    })
  }

  async updateCar(id: number, carData: any) {
    return this.request(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carData),
    })
  }

  async deleteCar(id: number) {
    return this.request(`/cars/${id}`, {
      method: 'DELETE',
    })
  }

  // Tasks API
  async getTasks(filters?: { status?: string; car_id?: number }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.car_id) params.append('car_id', filters.car_id.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/tasks${query}`)
  }

  async getTask(id: number) {
    return this.request(`/tasks/${id}`)
  }

  async createTask(taskData: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    })
  }

  async updateTask(id: number, taskData: any) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    })
  }

  async deleteTask(id: number) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  // Stats API
  async getStats() {
    return this.request('/stats')
  }

  // Mechanics API
  async getMechanics() {
    return this.request('/mechanics')
  }

  async getLeaderboard() {
    return this.request('/mechanics/leaderboard')
  }

  async getMechanicsStats() {
    return this.request('/mechanics/stats')
  }

  // Punches API
  async getPunches(filters?: { date?: string; mechanic_name?: string; status?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams()
    if (filters?.date) params.append('date', filters.date)
    if (filters?.mechanic_name) params.append('mechanic_name', filters.mechanic_name)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/punches${query}`)
  }

  async getActivePunch(mechanic_name: string) {
    return this.request(`/punches/active/${mechanic_name}`)
  }

  async punchIn(mechanic_name: string) {
    return this.request('/punches/punch-in', {
      method: 'POST',
      body: JSON.stringify({ mechanic_name }),
    })
  }

  async punchOut(punchId: number) {
    return this.request(`/punches/punch-out/${punchId}`, {
      method: 'PUT',
    })
  }

  async getCarWorkSessions(filters?: { date?: string; mechanic_name?: string; car_id?: number }) {
    const params = new URLSearchParams()
    if (filters?.date) params.append('date', filters.date)
    if (filters?.mechanic_name) params.append('mechanic_name', filters.mechanic_name)
    if (filters?.car_id) params.append('car_id', filters.car_id.toString())

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/punches/car-sessions${query}`)
  }

  async getActiveCarSession(mechanic_name: string) {
    return this.request(`/punches/car-sessions/active/${mechanic_name}`)
  }

  async startCarSession(data: { punch_id: number; car_id: number; mechanic_name: string; notes?: string }) {
    return this.request('/punches/car-sessions/start', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async endCarSession(sessionId: number, notes?: string, total_hours?: number) {
    return this.request(`/punches/car-sessions/end/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({ notes, total_hours }),
    })
  }

  async getPayrollSummary(start_date?: string, end_date?: string) {
    const params = new URLSearchParams()
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/punches/summary/payroll${query}`)
  }

  async getCarCostsSummary(start_date?: string, end_date?: string) {
    const params = new URLSearchParams()
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/punches/summary/car-costs${query}`)
  }

  async updatePunchTimes(punchId: number, data: { punch_in: string; punch_out?: string; password: string }) {
    return this.request(`/punches/${punchId}/edit`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePunch(punchId: number) {
    return this.request(`/punches/${punchId}`, {
      method: 'DELETE',
    })
  }

  async getMechanicCarsSummary(start_date?: string, end_date?: string) {
    const params = new URLSearchParams()
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/punches/summary/mechanic-cars${query}`)
  }

  async resetMechanicHours(mechanic_name: string) {
    return this.request(`/punches/reset-hours/${mechanic_name}`, {
      method: 'POST',
    })
  }

  async resetAllHours() {
    return this.request('/punches/reset-hours', {
      method: 'POST',
    })
  }
}

export const api = new ApiClient()