'use client'

import { useState, useEffect } from 'react'
import { Car, Trophy, Clock } from 'lucide-react'
import IntegratedSection from './IntegratedSection'
import Leaderboard from './Leaderboard'
import PunchesTab from './PunchesTab'
import SimpleButton from './SimpleButton'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('workshop')

  // Keep-alive ping para mantener backend despierto (Render free tier)
  useEffect(() => {
    const keepAlive = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'
        await fetch(`${apiUrl}/api/health`, { method: 'GET' })
        console.log('🔄 Keep-alive ping sent')
      } catch (error) {
        console.log('⚠️ Keep-alive ping failed:', error)
      }
    }

    // Ping inicial
    keepAlive()

    // Ping cada 10 minutos (600000ms)
    const interval = setInterval(keepAlive, 600000)

    return () => clearInterval(interval)
  }, [])


  const tabs = [
    { id: 'workshop', name: 'Taller', icon: Car },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
    { id: 'punches', name: 'Ponches', icon: Clock },
  ]


  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:h-16">
            <div className="flex items-center justify-between h-16 sm:h-auto">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900"
                    style={{
                      fontFamily: 'Anton, sans-serif',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                      letterSpacing: '1px'
                    }}>
                  AstroBuild
                </h1>
                <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Colaborativo
                </span>
              </div>
            </div>

            <div className="pb-3 sm:pb-0 sm:flex sm:items-center">
              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: isActive ? '#3b82f6' : 'transparent',
                        color: isActive ? 'white' : '#64748b',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '8px',
                        pointerEvents: 'auto',
                        zIndex: 9999,
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f1f5f9'
                          e.currentTarget.style.color = '#475569'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#64748b'
                        }
                      }}
                    >
                      <Icon size={16} />
                      {tab.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>


      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'workshop' && <IntegratedSection />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'punches' && <PunchesTab />}
      </main>
    </div>
  )
}