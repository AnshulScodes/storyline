
import React from 'react';
import { Persona } from '@/types';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, Zap, Clock, User, Mail } from 'lucide-react';

interface PersonaCardProps {
  persona: Persona;
  onClick: (persona: Persona) => void;
}

const getSegmentIcon = (segment: string) => {
  switch (segment) {
    case 'power':
      return <Zap className="h-4 w-4" />;
    case 'atrisk':
      return <AlertTriangle className="h-4 w-4" />;
    case 'occasional':
      return <Clock className="h-4 w-4" />;
    default:
      return null;
  }
};

const getSegmentColor = (segment: string) => {
  switch (segment) {
    case 'power':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'atrisk':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'occasional':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getSegmentLabel = (segment: string) => {
  switch (segment) {
    case 'power':
      return 'Power User';
    case 'atrisk':
      return 'At Risk';
    case 'occasional':
      return 'Occasional';
    default:
      return segment;
  }
};

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, onClick }) => {
  const segmentClass = getSegmentColor(persona.segment);
  const segmentIcon = getSegmentIcon(persona.segment);
  const segmentLabel = getSegmentLabel(persona.segment);
  
  // Display example user details for at-risk personas
  const showUserDetails = persona.segment === 'atrisk';
  
  // Generate sample user ID and email based on persona name
  const sampleUserId = `user_${persona.name.toLowerCase().replace(' ', '_')}${Math.floor(Math.random() * 1000)}`;
  const sampleEmail = `${persona.name.toLowerCase().replace(' ', '.')}@example.com`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="glass-card overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-md"
      onClick={() => onClick(persona)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{persona.name}</h3>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${segmentClass}`}>
              {segmentIcon}
              {segmentLabel}
            </div>
          </div>
          <div 
            className={`rounded-full ${
              persona.churnRisk > 0.7 
                ? 'bg-red-50 text-red-700' 
                : persona.churnRisk > 0.4 
                ? 'bg-orange-50 text-orange-700'
                : 'bg-green-50 text-green-700'
            } px-2 py-1 text-xs font-semibold`}
          >
            {Math.round(persona.churnRisk * 100)}% Risk
          </div>
        </div>
        
        {showUserDetails && (
          <div className="mb-4 bg-red-50 p-3 rounded-md border border-red-200">
            <h4 className="text-xs font-semibold text-red-700 mb-2">Example At-Risk User</h4>
            <div className="flex items-center gap-2 text-xs text-red-700 mb-1">
              <User className="h-3 w-3" />
              <span className="font-medium">ID:</span> 
              <span className="font-mono">{sampleUserId}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-red-700">
              <Mail className="h-3 w-3" />
              <span className="font-medium">Email:</span> 
              <span>{sampleEmail}</span>
            </div>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {persona.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {persona.painPoints.slice(0, 2).map((point, index) => (
            <span key={index} className="bg-secondary text-xs px-2 py-1 rounded-full">
              {point}
            </span>
          ))}
          {persona.painPoints.length > 2 && (
            <span className="bg-secondary text-xs px-2 py-1 rounded-full">
              +{persona.painPoints.length - 2} more
            </span>
          )}
        </div>
        
        <div className="flex justify-end">
          <span className="text-primary text-sm font-medium flex items-center gap-1">
            View Details
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PersonaCard;
