'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Star, Zap, Target, Crown, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'
import { socketClient } from '@/lib/socket'

interface Mechanic {
  name: string
  total_points: number
  total_tasks: number
  rank: number
  medal: string
  updated_at: string
}

interface LeaderboardStats {
  total_mechanics: number
  total_points_awarded: number
  total_tasks_completed: number
  avg_points_per_mechanic: number
  highest_score: number
  top_mechanic: {
    name: string
    total_points: number
  } | null
}

const mechanicAvatars: { [key: string]: string } = {
  'IgenieroErick': '👨‍💻',
  'ChristianCobra': '🐍',
  'Chicanto': '🎵',
  'SpiderSteven': '🕷️',
  'LaBestiaPelua': '🦁',
  'PhonKing': '📱',
  'CarlosMariconGay': '🌈'
}

// Same gradients as IntegratedSection
const gradients = [
  'from-orange-400 via-pink-500 to-purple-600',
  'from-blue-500 via-purple-500 to-pink-500',
  'from-green-400 via-blue-500 to-purple-600',
  'from-yellow-400 via-red-500 to-pink-500',
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-teal-400 via-blue-500 to-purple-600'
]

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Mechanic[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
    loadStats()

    // Socket listeners for real-time updates
    socketClient.on('task-added', loadLeaderboard)
    socketClient.on('task-updated', loadLeaderboard)
    socketClient.on('task-deleted', loadLeaderboard)

    return () => {
      socketClient.off('task-added', loadLeaderboard)
      socketClient.off('task-updated', loadLeaderboard)
      socketClient.off('task-deleted', loadLeaderboard)
    }
  }, [])

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard()
      setLeaderboard(data)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const loadStats = async () => {
    try {
      const data = await api.getMechanicsStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Cargando ranking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mr-4 shadow-xl hover:scale-110 transition-transform duration-300">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">🏆 Leaderboard de Mecánicos</h2>
              <p className="text-gray-600 text-lg">Ranking por puntos ganados</p>
            </div>
          </div>
        </div>

        {/* 1. RANKING COMPLETO - FIRST */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 hover:shadow-2xl transition-all duration-300">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Medal className="w-6 h-6 mr-2 text-yellow-500" />
            Ranking Completo
          </h3>

          <div className="space-y-3">
            {leaderboard.map((mechanic, index) => {
              const gradientIndex = index % gradients.length
              const gradient = gradients[gradientIndex]

              return (
                <div
                  key={mechanic.name}
                  className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-gray-200"
                  style={{
                    animation: `slideInRight 0.4s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className={`bg-gradient-to-r ${gradient} p-1`}>
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Rank */}
                          <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-110 transition-transform duration-300`}>
                            #{mechanic.rank}
                          </div>

                          {/* Avatar */}
                          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform duration-300">
                            {mechanicAvatars[mechanic.name] || '👤'}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-bold text-gray-900 text-lg">{mechanic.name}</h4>
                              {mechanic.medal && <span className="text-2xl animate-bounce">{mechanic.medal}</span>}
                            </div>
                            <p className="text-sm text-gray-500">
                              {mechanic.total_tasks} tareas completadas
                            </p>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <Star className="w-5 h-5 text-yellow-500 hover:rotate-180 transition-transform duration-500" />
                            <span className="text-2xl font-bold text-gray-900">{mechanic.total_points}</span>
                          </div>
                          <p className="text-sm text-gray-500">puntos</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`}
                            style={{
                              width: `${Math.min((mechanic.total_points / (stats?.highest_score || 1)) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin ranking disponible</h3>
              <p className="text-gray-500">Los mecánicos aparecerán aquí cuando completen tareas</p>
            </div>
          )}
        </div>

        {/* 2. TOP 3 CHAMPIONS - SECOND */}
        {leaderboard.length >= 3 && (
          <div className="mb-8 animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🥇 Top 3 Champions</h3>
            <div className="flex justify-center items-end space-x-4">
              {/* 2nd Place */}
              <div className="text-center hover:scale-105 transition-transform duration-300" style={{animation: 'bounceIn 0.6s ease-out 0.2s both'}}>
                <div className="w-24 h-24 bg-gradient-to-r from-gray-300 to-gray-500 rounded-3xl flex items-center justify-center mb-3 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <span className="text-3xl">{mechanicAvatars[leaderboard[1]?.name] || '👤'}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-300 min-w-[140px] hover:shadow-xl transition-all duration-300">
                  <div className="text-2xl mb-1">🥈</div>
                  <h4 className="font-bold text-gray-900 text-sm">{leaderboard[1]?.name}</h4>
                  <p className="text-lg font-bold text-gray-600">{leaderboard[1]?.total_points} pts</p>
                  <p className="text-xs text-gray-500">{leaderboard[1]?.total_tasks} tareas</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center hover:scale-105 transition-transform duration-300" style={{animation: 'bounceIn 0.6s ease-out both'}}>
                <div className="w-28 h-28 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mb-3 shadow-xl relative hover:shadow-2xl transition-shadow duration-300">
                  <span className="text-4xl">{mechanicAvatars[leaderboard[0]?.name] || '👤'}</span>
                  <div className="absolute -top-2 -right-2 animate-bounce">
                    <Crown className="w-6 h-6 text-yellow-300" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-yellow-400 min-w-[160px] hover:shadow-2xl transition-all duration-300">
                  <div className="text-3xl mb-1 animate-pulse">🥇</div>
                  <h4 className="font-bold text-gray-900">{leaderboard[0]?.name}</h4>
                  <p className="text-xl font-bold text-yellow-600">{leaderboard[0]?.total_points} pts</p>
                  <p className="text-sm text-gray-500">{leaderboard[0]?.total_tasks} tareas</p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center hover:scale-105 transition-transform duration-300" style={{animation: 'bounceIn 0.6s ease-out 0.4s both'}}>
                <div className="w-24 h-24 bg-gradient-to-r from-amber-600 to-amber-800 rounded-3xl flex items-center justify-center mb-3 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <span className="text-3xl">{mechanicAvatars[leaderboard[2]?.name] || '👤'}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-amber-600 min-w-[140px] hover:shadow-xl transition-all duration-300">
                  <div className="text-2xl mb-1">🥉</div>
                  <h4 className="font-bold text-gray-900 text-sm">{leaderboard[2]?.name}</h4>
                  <p className="text-lg font-bold text-amber-600">{leaderboard[2]?.total_points} pts</p>
                  <p className="text-xs text-gray-500">{leaderboard[2]?.total_tasks} tareas</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. STATS CARDS - THIRD */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center hover:rotate-12 transition-transform duration-300">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Puntos</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_points_awarded}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center hover:rotate-12 transition-transform duration-300">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tareas Totales</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_tasks_completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center hover:rotate-12 transition-transform duration-300">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Record</p>
                  <p className="text-xl font-bold text-gray-900">{stats.highest_score}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center hover:rotate-12 transition-transform duration-300">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Promedio</p>
                  <p className="text-xl font-bold text-gray-900">{Math.round(stats.avg_points_per_mechanic)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(50px);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}
