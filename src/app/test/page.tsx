'use client'

import { useState } from 'react'

export default function TestPage() {
  const [activeTab, setActiveTab] = useState('workshop')

  return (
    <html>
      <body>
        <div style={{ padding: '50px' }}>
          <h1>TEST PAGE</h1>

          <div style={{ marginBottom: '20px' }}>
            Current tab: <strong>{activeTab}</strong>
          </div>

          <div
            onClick={() => {
              console.log('WORKSHOP CLICKED!')
              setActiveTab('workshop')
            }}
            style={{
              padding: '30px',
              backgroundColor: 'red',
              color: 'white',
              cursor: 'pointer',
              margin: '10px',
              fontSize: '20px'
            }}
          >
            WORKSHOP
          </div>

          <div
            onClick={() => {
              console.log('LEADERBOARD CLICKED!')
              setActiveTab('leaderboard')
            }}
            style={{
              padding: '30px',
              backgroundColor: 'green',
              color: 'white',
              cursor: 'pointer',
              margin: '10px',
              fontSize: '20px'
            }}
          >
            LEADERBOARD
          </div>

          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'yellow' }}>
            {activeTab === 'workshop' && <div>WORKSHOP CONTENT IS SHOWING</div>}
            {activeTab === 'leaderboard' && <div>LEADERBOARD CONTENT IS SHOWING</div>}
          </div>
        </div>
      </body>
    </html>
  )
}