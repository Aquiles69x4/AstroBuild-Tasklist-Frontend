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
  async getLeaderboard() {
    return this.request('/mechanics/leaderboard')
  }

  async getMechanicsStats() {
    return this.request('/mechanics/stats')
  }
}

export const api = new ApiClient()