import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generatePDFReport, generatePersonaReport } from '@/utils/pdfExport';
import { 
  getGeneratedPersonas, 
  getGeneratedStories, 
  getGeneratedMetrics, 
  getGeneratedInsights,
  getGeneratedUserData
} from '@/utils/dataProcessor';
import { Persona, UserStory } from '@/types';

interface ExportPDFProps {
  className?: string;
}

const ExportPDF: React.FC<ExportPDFProps> = ({ className }) => {
  // Function to export full report
  const handleExportFullReport = () => {
    const userData = getGeneratedUserData();
    const personas = getGeneratedPersonas();
    const stories = getGeneratedStories();
    const metrics = getGeneratedMetrics();
    const insights = getGeneratedInsights();
    
    generatePDFReport(
      'User Churn Analysis Report',
      userData,
      personas,
      stories,
      metrics,
      insights
    );
  };
  
  // Function to export personas report
  const handleExportPersonasReport = () => {
    const personas = getGeneratedPersonas();
    const stories = getGeneratedStories();
    
    generatePDFReport(
      'User Personas Report',
      [],
      personas,
      stories,
      [],
      []
    );
  };
  
  // Function to export insights report
  const handleExportInsightsReport = () => {
    const metrics = getGeneratedMetrics();
    const insights = getGeneratedInsights();
    
    generatePDFReport(
      'Churn Insights Report',
      [],
      [],
      [],
      metrics,
      insights
    );
  };
  
  // Function to export a specific persona report
  const handleExportPersonaReport = (persona: Persona) => {
    const stories = getGeneratedStories().filter(
      story => story.personaId === persona.id
    );
    
    generatePersonaReport(persona, stories);
  };
  
  // Get personas for individual exports
  const personas = getGeneratedPersonas();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportFullReport}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Complete Report</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPersonasReport}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Personas Report</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportInsightsReport}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Insights Report</span>
        </DropdownMenuItem>
        
        {personas.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Individual Personas</DropdownMenuLabel>
            {personas.map(persona => (
              <DropdownMenuItem 
                key={persona.id}
                onClick={() => handleExportPersonaReport(persona)}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{persona.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportPDF; 