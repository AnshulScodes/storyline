
import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import PersonaCard from '@/components/ui/PersonaCard';
import StoryDetail from '@/components/ui/StoryDetail';
import { Persona, UserStory } from '@/types';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown } from 'lucide-react';

const UserStories = () => {
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for demonstration purposes
  const personas: Persona[] = [
    {
      id: '1',
      name: 'Power Partner Patty',
      segment: 'power',
      description: 'Daily user who relies on your product for critical work tasks. Engaged with most features and has a high feature adoption rate.',
      painPoints: ['Complex workflows', 'Performance issues'],
      goals: ['Save time', 'Improve workflow efficiency'],
      churnRisk: 0.15
    },
    {
      id: '2',
      name: 'At-Risk Andy',
      segment: 'atrisk',
      description: 'Previously active user whose engagement has declined over the past month. Hasn\'t logged in for 14 days.',
      painPoints: ['Confusing interface', 'Missing features', 'Technical issues'],
      goals: ['Simplify daily tasks', 'Better support'],
      churnRisk: 0.85
    },
    {
      id: '3',
      name: 'Occasional Olivia',
      segment: 'occasional',
      description: 'Logs in infrequently, typically once every few weeks. Only uses a small subset of features.',
      painPoints: ['Forgetting how to use features', 'Value perception'],
      goals: ['Quick, occasional tasks', 'Easy reengagement'],
      churnRisk: 0.45
    },
    {
      id: '4',
      name: 'Feature Explorer Felix',
      segment: 'power',
      description: 'Enthusiastic early adopter who tries new features immediately after release. Provides frequent feedback.',
      painPoints: ['Bugs in new features', 'Slow release cycle'],
      goals: ['Discover new capabilities', 'Optimize workflows'],
      churnRisk: 0.20
    },
    {
      id: '5',
      name: 'Corporate Claire',
      segment: 'power',
      description: 'Enterprise user who manages team accounts and needs administrative capabilities and reporting.',
      painPoints: ['User management', 'Security concerns'],
      goals: ['Team oversight', 'Compliance reporting'],
      churnRisk: 0.30
    },
    {
      id: '6',
      name: 'Skeptical Sam',
      segment: 'atrisk',
      description: 'Trialed the product but hasn\'t fully committed. Uses minimal features and has a low engagement score.',
      painPoints: ['Unclear value proposition', 'Cost concerns'],
      goals: ['Proof of ROI', 'Essential functionality only'],
      churnRisk: 0.75
    }
  ];
  
  const stories: UserStory[] = [
    {
      id: '1',
      personaId: '2',
      title: 'Simplified Onboarding Flow',
      description: 'As At-Risk Andy, I want a more intuitive onboarding experience so that I can quickly understand the value of the product and how to use its key features.',
      priority: 'high',
      acceptanceCriteria: [
        'Reduce onboarding steps from 7 to maximum 4',
        'Include interactive tutorials for core features',
        'Add progress indicators for completed onboarding tasks',
        'Implement a "skip for now" option that doesn\'t abandon the user'
      ]
    },
    {
      id: '2',
      personaId: '3',
      title: 'Re-engagement Notifications',
      description: 'As Occasional Olivia, I want timely, relevant notifications so that I remember to return to the platform when I would find it most valuable.',
      priority: 'medium',
      acceptanceCriteria: [
        'Send personalized notifications based on user behavior patterns',
        'Limit notifications to maximum 2 per week',
        'Include quick-action buttons in notification emails',
        'Allow granular control over notification frequency and types'
      ]
    },
    {
      id: '3',
      personaId: '1',
      title: 'Advanced Workflow Templates',
      description: 'As Power Partner Patty, I want to create and save custom workflow templates so that I can standardize processes and save time on repetitive tasks.',
      priority: 'medium',
      acceptanceCriteria: [
        'Create a library of user-defined templates',
        'Allow sharing templates with team members',
        'Provide a visual template builder interface',
        'Include version history for template changes'
      ]
    },
    {
      id: '4',
      personaId: '5',
      title: 'Team Analytics Dashboard',
      description: 'As Corporate Claire, I want a consolidated view of my team\'s activities and usage patterns so that I can identify opportunities for improved adoption and efficiency.',
      priority: 'medium',
      acceptanceCriteria: [
        'Display user-level engagement metrics',
        'Show feature adoption rates across the team',
        'Highlight potential productivity bottlenecks',
        'Allow exporting reports for stakeholder sharing'
      ]
    },
    {
      id: '5',
      personaId: '6',
      title: 'Value Demonstration Wizard',
      description: 'As Skeptical Sam, I want to see clear examples of how the product can solve my specific problems so that I can justify continued use and potential upgrade.',
      priority: 'high',
      acceptanceCriteria: [
        'Create an interactive ROI calculator',
        'Show case studies of similar users',
        'Provide guided tours of key value-driving features',
        'Include achievement milestones to mark progress'
      ]
    },
    {
      id: '6',
      personaId: '4',
      title: 'Beta Features Access',
      description: 'As Feature Explorer Felix, I want early access to beta features so that I can provide feedback and be among the first to leverage new capabilities.',
      priority: 'low',
      acceptanceCriteria: [
        'Create an opt-in beta program with clear terms',
        'Provide a separate environment for beta features',
        'Include an easy feedback mechanism',
        'Recognize contributors in release notes'
      ]
    }
  ];
  
  const handlePersonaClick = (persona: Persona) => {
    const story = stories.find(s => s.personaId === persona.id);
    if (story) {
      setSelectedStory(story);
    }
  };
  
  const handleSegmentFilter = (segment: string | null) => {
    setActiveSegment(segment === activeSegment ? null : segment);
  };
  
  const filteredPersonas = personas.filter(persona => {
    const matchesSegment = !activeSegment || persona.segment === activeSegment;
    const matchesSearch = !searchQuery || 
      persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSegment && matchesSearch;
  });
  
  const segments = [
    { id: 'power', label: 'Power Users' },
    { id: 'atrisk', label: 'At-Risk Users' },
    { id: 'occasional', label: 'Occasional Users' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Personas & Stories</h1>
          <p className="text-muted-foreground">AI-generated personas based on your user data</p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {segments.map(segment => (
              <button
                key={segment.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSegment === segment.id
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
                onClick={() => handleSegmentFilter(segment.id)}
              >
                {segment.label}
              </button>
            ))}
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              More Filters
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search personas..."
              className="pl-10 pr-4 py-2 rounded-lg border border-input bg-background w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredPersonas.length > 0 ? (
            filteredPersonas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onClick={handlePersonaClick}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <h3 className="text-lg font-medium mb-2">No personas match your filters</h3>
              <p className="text-muted-foreground">Try changing your search criteria or filters</p>
            </div>
          )}
        </div>
        
        {selectedStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStory(null)}
          >
            <div 
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <StoryDetail 
                story={selectedStory} 
                onClose={() => setSelectedStory(null)} 
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default UserStories;
