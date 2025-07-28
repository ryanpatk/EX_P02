import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreakpointValue } from '@chakra-ui/react'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects'
import { useAppStore } from '../store'
import { CreateProjectData } from '../types/database'
import supabase from '../supabase'
import UserProfile from '../components/UserProfile'
import MobileDrawer from '../components/MobileDrawer'

const DashboardPage = () => {
  const navigate = useNavigate()
  const [newProjectName, setNewProjectName] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const searchQuery = useAppStore(state => state.searchQuery)
  const setSearchQuery = useAppStore(state => state.setSearchQuery)
  
  // Chakra breakpoint: [mobile, tablet, desktop]
  const isMobile = useBreakpointValue([true, true, false])
  
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  
  // Get current user with loading state to prevent jank
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      // Small delay to prevent visual jank
      setTimeout(() => setUser(user), 100)
    }
    getUser()
  }, [])
  
  // Use React Query data directly instead of Zustand selectors
  const starredProjects = projects?.filter(p => p.is_starred)
    .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()) || []
  const unstarredProjects = projects?.filter(p => !p.is_starred)
    .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()) || []
  
  // Filter projects based on search query
  const filterProjects = (projects: typeof starredProjects) => {
    if (!searchQuery.trim()) return projects
    const query = searchQuery.toLowerCase()
    return projects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    )
  }
  
  const filteredStarredProjects = filterProjects(starredProjects)
  const filteredUnstarredProjects = filterProjects(unstarredProjects)
  
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    const projectData: CreateProjectData = {
      name: newProjectName.trim(),
      is_starred: false,
    }
    
    try {
      await createProject.mutateAsync(projectData)
      setNewProjectName('')
      console.log('Project created successfully')
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }
  
  const handleToggleStar = async (projectId: string, isStarred: boolean) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        updates: { is_starred: !isStarred }
      })
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }
  
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This will also delete all notes and links in this project.`)) {
      return
    }
    
    try {
      await deleteProject.mutateAsync(projectId)
      console.log('Project deleted successfully')
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }
  
  const ProjectCard = ({ project }: { project: typeof starredProjects[0] }) => (
    <div
      className="card p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col space-y-2 flex-1">
          <h3 className="text-xl font-black text-black tracking-tight leading-tight uppercase">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-600 font-medium leading-tight">
              {project.description}
            </p>
          )}
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {new Date(project.last_modified).toLocaleDateString()}
          </p>
          
          {/* Metrics Grid - Portfolio Style */}
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-medium-grey">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</span>
              <span className="text-lg font-black text-black">
                {project.notes?.[0]?.count || 0}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Links</span>
              <span className="text-lg font-black text-black">
                {project.links?.[0]?.count || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            className={`px-2 py-1 text-sm transition-colors ${
              project.is_starred ? 'text-orange' : 'text-gray-400'
            } hover:text-orange`}
            onClick={(e) => {
              e.stopPropagation()
              handleToggleStar(project.id, project.is_starred)
            }}
          >
            ★
          </button>
          <button
            className="px-2 py-1 text-sm text-red-500 hover:bg-red-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteProject(project.id, project.name)
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-light-grey p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* User Profile - Desktop (fixed positioned, no layout impact) */}
        {!isMobile && (
          <div className="fixed top-6 right-6 z-50">
            {user ? (
              <UserProfile user={user} isMobile={false} />
            ) : (
              <div className="flex items-center space-x-2 p-2">
                <div className="w-8 h-8 bg-gray-200 border border-medium-grey animate-pulse" />
                <div className="w-20 h-4 bg-gray-200 animate-pulse" />
              </div>
            )}
          </div>
        )}
        
        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <div className="flex justify-end mb-4">
            {user ? (
              <button
                id="mobile-hamburger"
                onClick={() => {
                  setIsMobileDrawerOpen(true)
                }}
                className="p-3 hover:bg-gray-100 transition-colors border border-medium-grey bg-white flex items-center justify-center"
                style={{ width: '48px', height: '48px' }}
              >
                <div className="flex flex-col justify-center" style={{ gap: '4px' }}>
                  <div style={{ width: '20px', height: '3px', backgroundColor: '#000000' }}></div>
                  <div style={{ width: '20px', height: '3px', backgroundColor: '#000000' }}></div>
                  <div style={{ width: '20px', height: '3px', backgroundColor: '#000000' }}></div>
                </div>
              </button>
            ) : (
              <div className="p-3 border border-medium-grey bg-white flex items-center justify-center animate-pulse" style={{ width: '48px', height: '48px' }}>
                <div className="flex flex-col justify-center" style={{ gap: '4px' }}>
                  <div style={{ width: '20px', height: '3px', backgroundColor: '#e5e7eb' }}></div>
                  <div style={{ width: '20px', height: '3px', backgroundColor: '#e5e7eb' }}></div>
                  <div style={{ width: '20px', height: '3px', backgroundColor: '#e5e7eb' }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-orange text-white font-mono px-3 py-2 text-2xl flex-shrink-0" style={{ fontWeight: '900' }}>
              02
            </div>
            <h1 className="text-4xl text-chunky text-black tracking-tighter uppercase">
              EX_P02
            </h1>
          </div>
          
          {/* Search */}
          <div className="flex justify-center">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field max-w-md w-full"
            />
          </div>
          
          {/* Create Project */}
          <div className="flex space-x-2 max-w-md w-full mx-auto">
            <input
              type="text"
              placeholder="New project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="input-field flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
            />
            <button
              onClick={handleCreateProject}
              disabled={createProject.isPending}
              className="btn-primary px-4 disabled:opacity-50"
            >
              {createProject.isPending ? '...' : '+'}
            </button>
          </div>
        </div>
        
        {/* Starred Projects */}
        {filteredStarredProjects.length > 0 && (
          <div className="space-y-3 w-full">
            <h2 className="text-2xl font-black text-black tracking-tight uppercase">
              Starred Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStarredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}
        
        {/* All Projects */}
        {filteredUnstarredProjects.length > 0 && (
          <div className="space-y-3 w-full">
            <h2 className="text-2xl font-black text-black tracking-tight uppercase">
              {filteredStarredProjects.length > 0 ? 'Other Projects' : 'All Projects'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnstarredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {(!projects || projects.length === 0) && (
          <div className="space-y-4 py-12 text-center">
            <p className="text-xl text-gray-600 font-mono">
              No projects yet
            </p>
            <p className="text-sm text-gray-500 font-mono">
              Create your first project to get started
            </p>
          </div>
        )}
        
        {/* No Search Results */}
        {projects && projects.length > 0 && 
         filteredStarredProjects.length === 0 && 
         filteredUnstarredProjects.length === 0 && 
         searchQuery.trim() && (
          <div className="space-y-4 py-12 text-center">
            <p className="text-xl text-gray-600 font-mono">
              No projects found
            </p>
            <p className="text-sm text-gray-500 font-mono">
              Try a different search term
            </p>
          </div>
        )}
        
        {/* Mobile Drawer */}
        {user && isMobile && (
          <MobileDrawer
            user={user}
            isOpen={isMobileDrawerOpen}
            onClose={() => setIsMobileDrawerOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default DashboardPage