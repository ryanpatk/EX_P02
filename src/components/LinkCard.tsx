import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LinkWithTag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import ProjectSelector from './ProjectSelector';
import { ProjectWithCounts } from '../types/database';

interface LinkCardProps {
  link: LinkWithTag;
  scrapedData?: ScrapedUrlData;
  onDelete: (linkId: string) => void;
  projects?: ProjectWithCounts[];
  onUpdateProject?: (linkId: string, projectId: string | null) => void;
  isSelected?: boolean;
  isCursor?: boolean;
}

// Helper function to safely extract hostname from URL
const getHostname = (url: string, removeWww: boolean = false): string => {
  if (!url || typeof url !== 'string') {
    return 'Unknown';
  }

  try {
    // If URL doesn't have a protocol, add https://
    const urlWithProtocol = url.includes('://') ? url : `https://${url}`;
    let hostname = new URL(urlWithProtocol).hostname;
    if (removeWww) {
      hostname = hostname.replace('www.', '');
    }
    return hostname;
  } catch (error) {
    console.log('Failed to construct URL:', url, 'Error:', error);
    // If URL is invalid, try to extract a simple domain-like string
    // Remove protocol if present
    let cleaned = url.replace(/^https?:\/\//, '').split('/')[0];
    if (removeWww) {
      cleaned = cleaned.replace('www.', '');
    }
    return cleaned || 'Unknown';
  }
};

const LinkCard = ({
  link,
  scrapedData,
  onDelete,
  projects = [],
  onUpdateProject,
  isSelected = false,
  isCursor = false,
}: LinkCardProps) => {
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const projectBadgeRef = useRef<HTMLDivElement>(null);
  const imageUrl = scrapedData?.image || link.preview_image_url;
  const faviconUrl = scrapedData?.logo || link.favicon_url;

  const showFullLink = isHoveringCard && !isHoveringButton;

  const handleProjectBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateProject && projects.length > 0) {
      // Calculate position when opening
      if (projectBadgeRef.current) {
        const rect = projectBadgeRef.current.getBoundingClientRect();
        setSelectorPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
      setIsProjectSelectorOpen(true);
    }
  };

  const handleProjectSelect = (projectId: string | null) => {
    if (onUpdateProject) {
      onUpdateProject(link.id, projectId);
    }
    setIsProjectSelectorOpen(false);
  };

  // Determine border style based on selection state
  // Use absolutely positioned border overlay to avoid affecting layout and work with overflow-hidden
  const getBorderClass = () => {
    return 'border border-medium-grey';
  };

  return (
    <div
      className={`flex flex-col ${getBorderClass()} rounded-none overflow-hidden transition-all duration-100 group h-full relative ${
        showFullLink ? 'bg-gray-50' : 'bg-white'
      }`}
      onMouseEnter={() => setIsHoveringCard(true)}
      onMouseLeave={() => setIsHoveringCard(false)}
    >
      {/* Selection border overlay - absolutely positioned to not affect layout */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            border: '2px solid var(--color-orange)',
            boxSizing: 'border-box',
          }}
        />
      )}
      {isCursor && (
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            border: '2px dashed #999999',
            boxSizing: 'border-box',
          }}
        />
      )}
      {/* Selection overlay for selected cards */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            backgroundColor: 'rgba(255, 59, 60, 0.15)', // Red-orange overlay
          }}
        />
      )}
      {/* Preview/Thumbnail Area */}
      <div
        className={`relative w-full bg-white aspect-[300/157] flex items-center justify-center overflow-hidden group/image transition-colors duration-100 flex-shrink-0 ${
          showFullLink ? 'bg-gray-50' : ''
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={scrapedData?.title || ''}
            className={`w-full h-full object-contain transition-opacity duration-200 ${
              showFullLink ? 'opacity-0' : 'opacity-100'
            }`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`flex flex-col items-center justify-center gap-3 transition-opacity duration-200 ${
              showFullLink ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="w-12 h-12"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <p className="text-xs font-medium text-gray-600 text-center px-4">
              {scrapedData?.title || getHostname(link.url)}
            </p>
          </div>
        )}
        {/* Delete Button - appears on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link.id);
          }}
          className={`absolute top-3 right-3 transition-opacity duration-200 w-6 h-6 flex items-center justify-center bg-white border border-medium-grey rounded-sm hover:bg-gray-50 cursor-pointer z-10 ${
            showFullLink ? 'opacity-100' : 'opacity-0'
          }`}
          title="Delete link"
        >
          <svg
            className="w-3 h-3 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {/* Project Name Badge - Upper Left */}
        <div ref={projectBadgeRef} className="absolute top-3 left-3 z-10">
          {link.project ? (
            <button
              onClick={handleProjectBadgeClick}
              className={`inline-block px-2 py-1 text-xs font-bold text-black bg-white bg-opacity-90 hover:bg-opacity-100 transition-opacity ${
                onUpdateProject && projects.length > 0 ? 'cursor-pointer' : ''
              }`}
              title={
                onUpdateProject && projects.length > 0
                  ? 'Click to change project'
                  : undefined
              }
            >
              {link.project.name}
            </button>
          ) : onUpdateProject && projects.length > 0 ? (
            <button
              onClick={handleProjectBadgeClick}
              className="inline-block px-2 py-1 text-xs font-bold text-gray-500 bg-white bg-opacity-90 hover:bg-opacity-100 transition-opacity cursor-pointer border border-dashed border-gray-400"
              title="Click to assign project"
            >
              + Assign
            </button>
          ) : null}
        </div>
        {/* Link Info Overlay on Hover */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200 overflow-y-auto bg-gray-50 ${
            showFullLink ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            padding: '24px',
          }}
        >
          <div className="flex flex-col items-center justify-center gap-3 w-full">
            {scrapedData?.title ? (
              <h3 className="text-base font-bold text-black text-center">
                {scrapedData.title}
              </h3>
            ) : scrapedData?.description ? (
              <p className="text-sm text-black text-center leading-relaxed">
                {scrapedData.description}
              </p>
            ) : (
              <p
                className="text-xs font-medium text-black text-center break-all mt-2"
                style={{
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  opacity: 0.7,
                }}
              >
                {link.url}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div
        className={`pt-4 px-4 pb-4 transition-colors duration-200 flex-shrink-0 ${
          showFullLink ? 'bg-gray-50' : 'bg-white'
        }`}
      >
        <button
          onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
          onMouseEnter={() => setIsHoveringButton(true)}
          onMouseLeave={() => setIsHoveringButton(false)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2 text-black border border-medium-grey hover:bg-gray-50 transition-all duration-300 text-sm font-medium rounded-sm cursor-pointer bg-white"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {faviconUrl && (
              <img
                src={faviconUrl}
                alt=""
                className="w-4 h-4 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span className="truncate">
              {scrapedData?.title || getHostname(link.url, true)}
            </span>
          </div>
          <svg
            className="w-4 h-4 transition-transform duration-300 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
      {/* Project Selector - rendered via portal to avoid clipping */}
      {isProjectSelectorOpen &&
        createPortal(
          <ProjectSelector
            projects={projects}
            selectedProjectId={link.project_id}
            onSelect={handleProjectSelect}
            onClose={() => setIsProjectSelectorOpen(false)}
            position={selectorPosition}
          />,
          document.body
        )}
    </div>
  );
};

export default LinkCard;
