
import React from 'react';
import { UserStory } from '@/types';

interface StoryDetailProps {
  story: UserStory;
  onClose: () => void;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ story, onClose }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="animate-fade-in glass-card p-6 rounded-xl">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-1">{story.title}</h3>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
          {story.priority.charAt(0).toUpperCase() + story.priority.slice(1)} Priority
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
        <p className="text-foreground">{story.description}</p>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Acceptance Criteria</h4>
        <ul className="list-disc pl-5 space-y-2">
          {story.acceptanceCriteria.map((criteria, index) => (
            <li key={index} className="text-foreground">{criteria}</li>
          ))}
        </ul>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StoryDetail;
