import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'
import DarkModeToggle from './DarkModeToggle'

interface MobileDrawerProps {
  user: any
  isOpen: boolean
  onClose: () => void
}

const MobileDrawer = ({ user, isOpen, onClose }: MobileDrawerProps) => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    // Generate a fallback avatar using the user's email initial
    const initial = user?.email?.charAt(0).toUpperCase() || 'U'
    return `https://ui-avatars.com/api/?name=${initial}&background=1E3A8A&color=FFFFFF&size=40&format=png&bold=true&font-size=0.6`
  }

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User'
  }

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const drawer = document.getElementById('mobile-drawer')
      const hamburger = document.getElementById('mobile-hamburger')
      
      if (isOpen && drawer && !drawer.contains(event.target as Node) && 
          hamburger && !hamburger.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            margin: 0,
            padding: 0
          }}
          onClick={onClose} 
        />
      )}
      
      {/* Drawer */}
      <div
        id="mobile-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '320px',
          backgroundColor: 'var(--color-blue)',
          borderLeft: '2px solid var(--color-medium-grey)',
          zIndex: 101,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-in-out',
          overflow: 'hidden',
          margin: 0,
          padding: 0
        }}
      >
        {/* Top blue bar to cover any bleed-through */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50px',
          backgroundColor: 'var(--color-blue)',
          zIndex: 1
        }}></div>
        
        {/* Drawer Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid var(--color-black)', 
          backgroundColor: 'var(--color-blue)',
          margin: 0,
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '16px' 
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '900', 
              letterSpacing: '-0.025em', 
              textTransform: 'uppercase',
              color: 'white',
              margin: 0
            }}>Menu</h2>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              ×
            </button>
          </div>
          
          {/* User Profile Info */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <img
              src={getAvatarUrl()}
              alt="User avatar"
              style={{
                width: '48px',
                height: '48px',
                border: '1px solid var(--color-medium-grey)',
                display: 'block'
              }}
            />
            <div style={{ 
              flex: '1', 
              minWidth: 0 
            }}>
              <p style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: 'white', 
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>{getUserName()}</p>
              <p style={{ 
                fontSize: '14px', 
                color: 'white', 
                opacity: 0.7,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Drawer Content */}
        <div style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          backgroundColor: 'var(--color-blue)',
          position: 'relative',
          zIndex: 2,
          flex: 1
        }}>
          {/* Dark Mode Toggle */}
          <DarkModeToggle className="w-full justify-start border border-medium-grey p-3" />
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full text-left p-3 text-base font-bold text-red-500 hover:bg-red-50 transition-colors border border-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  )
}

export default MobileDrawer