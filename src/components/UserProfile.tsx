import { useState, useEffect, useRef } from 'react'
import supabase from '../supabase'
import { useNavigate } from 'react-router-dom'
import DarkModeToggle from './DarkModeToggle'

interface UserProfileProps {
  user: any
  isMobile?: boolean
}

const UserProfile = ({ user, isMobile = false }: UserProfileProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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
    return `https://ui-avatars.com/api/?name=${initial}&background=FF69B4&color=FFFFFF&size=40&format=png&bold=true&font-size=0.6`
  }

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User'
  }

  if (isMobile) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 transition-colors border border-medium-grey bg-white"
        >
          <div className="flex flex-col space-y-1">
            <div className="w-5 h-0.5 bg-black transition-all duration-200"></div>
            <div className="w-5 h-0.5 bg-black transition-all duration-200"></div>
            <div className="w-5 h-0.5 bg-black transition-all duration-200"></div>
          </div>
        </button>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white border-2 border-medium-grey shadow-lg z-50">
            <div className="p-4 border-b border-medium-grey">
              <div className="flex items-center space-x-3">
                <img
                  src={getAvatarUrl()}
                  alt="User avatar"
                  className="w-6 h-6 border border-medium-grey"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">{getUserName()}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <DarkModeToggle className="w-full justify-start border-b border-medium-grey pb-2 mb-2" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop version
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 border border-medium-grey bg-gray-100 flex items-center justify-center">
          <img
            src={getAvatarUrl()}
            alt="User avatar"
            className={`w-8 h-8 border border-medium-grey transition-opacity duration-200 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setAvatarLoaded(true)}
            onError={() => setAvatarLoaded(true)}
          />
          {!avatarLoaded && (
            <div className="absolute w-8 h-8 bg-gray-200 border border-medium-grey animate-pulse" />
          )}
        </div>
        <span className="text-sm font-bold text-black">{getUserName()}</span>
      </button>

      {/* Desktop Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border-2 border-medium-grey shadow-lg z-50">
          <div className="p-3 border-b border-medium-grey">
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <div className="p-2">
            <DarkModeToggle className="w-full justify-start border-b border-medium-grey pb-2 mb-2" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile