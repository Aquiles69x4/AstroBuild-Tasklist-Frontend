'use client'

interface SimpleButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

export default function SimpleButton({ active, onClick, children }: SimpleButtonProps) {
  const handleClick = () => {
    console.log('SimpleButton clicked!')
    onClick()
  }

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '12px 20px',
        backgroundColor: active ? '#3b82f6' : '#f3f4f6',
        color: active ? 'white' : '#374151',
        borderRadius: '8px',
        cursor: 'pointer',
        userSelect: 'none',
        display: 'inline-block',
        fontWeight: '500',
        border: '2px solid transparent'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#e5e7eb'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#f3f4f6'
        }
      }}
    >
      {children}
    </div>
  )
}