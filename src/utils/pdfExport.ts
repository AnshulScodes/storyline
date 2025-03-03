import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserData, Persona, UserStory, ChurnMetric, Insight, PersonaUser } from '@/types';

/**
 * Generate a PDF report with user data, personas, stories, metrics, and insights
 * @param title The title of the PDF report
 * @param userData Array of user data
 * @param personas Array of personas
 * @param stories Array of user stories
 * @param metrics Array of churn metrics
 * @param insights Array of insights
 * @returns void - triggers a download of the PDF file
 */
export const generatePDFReport = (
  title: string,
  userData: UserData[] = [],
  personas: Persona[] = [],
  stories: UserStory[] = [],
  metrics: ChurnMetric[] = [],
  insights: Insight[] = []
): void => {
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set document properties
  pdf.setProperties({
    title: title,
    subject: 'User Churn Analysis Report',
    author: 'Storyline App',
    keywords: 'churn, personas, user stories',
    creator: 'Storyline App'
  });

  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(41, 98, 255); // Primary color
  pdf.text(title, 105, 20, { align: 'center' });
  
  // Add date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString();
  pdf.text(`Generated on: ${date}`, 105, 27, { align: 'center' });
  
  // Add horizontal line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(20, 30, 190, 30);

  let yPosition = 40;
  
  // Add churn metrics section if available
  if (metrics.length > 0) {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Churn Metrics Overview', 20, yPosition);
    yPosition += 10;
    
    // Create metrics table
    const metricsTableHeaders = [['Metric', 'Value', 'Change', 'Description']];
    const metricsTableData = metrics.map(metric => [
      metric.title,
      metric.value.toString(),
      `${metric.change > 0 ? '+' : ''}${metric.change}%`,
      metric.description
    ]);
    
    (pdf as any).autoTable({
      head: metricsTableHeaders,
      body: metricsTableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 'auto' }
      },
      didDrawPage: (data: any) => {
        // Add page number at the bottom
        pdf.setFontSize(8);
        pdf.text(`Page ${pdf.getNumberOfPages()}`, 105, 290, { align: 'center' });
      }
    });
    
    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // Add personas section if available
  if (personas.length > 0) {
    // Check if we need a new page
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Key User Personas', 20, yPosition);
    yPosition += 10;
    
    // Create personas table
    const personasTableHeaders = [['Name', 'Segment', 'Churn Risk', 'Description', 'User Count']];
    const personasTableData = personas.map(persona => [
      persona.name,
      persona.segment.charAt(0).toUpperCase() + persona.segment.slice(1),
      `${(persona.churnRisk * 100).toFixed(0)}%`,
      persona.description.substring(0, 60) + (persona.description.length > 60 ? '...' : ''),
      persona.users ? persona.users.length.toString() : '0'
    ]);
    
    (pdf as any).autoTable({
      head: personasTableHeaders,
      body: personasTableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      didDrawPage: (data: any) => {
        // Add page number at the bottom
        pdf.setFontSize(8);
        pdf.text(`Page ${pdf.getNumberOfPages()}`, 105, 290, { align: 'center' });
      }
    });
    
    yPosition = (pdf as any).lastAutoTable.finalY + 15;
    
    // For each persona, add a section with their actual users if available
    for (const persona of personas) {
      if (persona.users && persona.users.length > 0) {
        // Check if we need a new page
        if (yPosition > 230) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(41, 98, 255);
        pdf.text(`${persona.name} - Actual Users (Top ${Math.min(5, persona.users.length)})`, 20, yPosition);
        yPosition += 10;
        
        // Create users table (showing only top 5 users to save space)
        const usersTableHeaders = [['Name', 'Email', 'Last Login', 'Churn Risk']];
        const usersTableData = persona.users.slice(0, 5).map(user => [
          user.name,
          user.email,
          new Date(user.lastLogin).toLocaleDateString(),
          `${(user.churnRisk * 100).toFixed(0)}%`
        ]);
        
        (pdf as any).autoTable({
          head: usersTableHeaders,
          body: usersTableData,
          startY: yPosition,
          theme: 'grid',
          headStyles: {
            fillColor: [41, 98, 255],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 60 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30, halign: 'center' }
          }
        });
        
        yPosition = (pdf as any).lastAutoTable.finalY + 15;
      }
    }
  }
  
  // Add user stories section if available
  if (stories.length > 0) {
    // Check if we need a new page
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('User Stories', 20, yPosition);
    yPosition += 10;
    
    // Create stories table
    const storiesTableHeaders = [['Title', 'Priority', 'Description']];
    const storiesTableData = stories.map(story => [
      story.title,
      story.priority.charAt(0).toUpperCase() + story.priority.slice(1),
      story.description.substring(0, 80) + (story.description.length > 80 ? '...' : '')
    ]);
    
    (pdf as any).autoTable({
      head: storiesTableHeaders,
      body: storiesTableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 'auto' }
      },
      didDrawPage: (data: any) => {
        // Add page number at the bottom
        pdf.setFontSize(8);
        pdf.text(`Page ${pdf.getNumberOfPages()}`, 105, 290, { align: 'center' });
      }
    });
    
    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // Add insights section if available
  if (insights.length > 0) {
    // Check if we need a new page
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Key Insights & Recommendations', 20, yPosition);
    yPosition += 10;
    
    // Create insights table
    const insightsTableHeaders = [['Insight', 'Impact', 'Category', 'Recommendation']];
    const insightsTableData = insights.map(insight => [
      insight.title,
      insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1),
      insight.category.charAt(0).toUpperCase() + insight.category.slice(1),
      insight.recommendation.substring(0, 60) + (insight.recommendation.length > 60 ? '...' : '')
    ]);
    
    (pdf as any).autoTable({
      head: insightsTableHeaders,
      body: insightsTableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 'auto' }
      },
      didDrawPage: (data: any) => {
        // Add page number at the bottom
        pdf.setFontSize(8);
        pdf.text(`Page ${pdf.getNumberOfPages()}`, 105, 290, { align: 'center' });
      }
    });
  }
  
  // Add footer with disclaimer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('This report is generated based on the data provided and is for informational purposes only.', 105, 285, { align: 'center' });
  pdf.text(`Page ${pdf.getNumberOfPages()}`, 105, 290, { align: 'center' });
  
  // Save the PDF with the given filename
  pdf.save(`${title.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`);
};

/**
 * Generate a PDF report for a specific persona and their user stories
 * @param persona The persona to generate a report for
 * @param stories Array of user stories related to the persona
 * @returns void - triggers a download of the PDF file
 */
export const generatePersonaReport = (
  persona: Persona,
  stories: UserStory[]
): void => {
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set document properties
  pdf.setProperties({
    title: `Persona Report - ${persona.name}`,
    subject: 'User Persona Analysis',
    author: 'Storyline App',
    keywords: 'persona, user stories',
    creator: 'Storyline App'
  });

  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(41, 98, 255); // Primary color
  pdf.text(`Persona: ${persona.name}`, 105, 20, { align: 'center' });
  
  // Add date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString();
  pdf.text(`Generated on: ${date}`, 105, 27, { align: 'center' });
  
  // Add horizontal line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(20, 30, 190, 30);

  let yPosition = 40;
  
  // Add persona details
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Persona Details', 20, yPosition);
  yPosition += 10;
  
  // Create persona details table
  const personaDetailsHeaders = [['Attribute', 'Value']];
  const personaDetailsData = [
    ['Segment', persona.segment.charAt(0).toUpperCase() + persona.segment.slice(1)],
    ['Churn Risk', `${(persona.churnRisk * 100).toFixed(0)}%`],
    ['Description', persona.description]
  ];
  
  (pdf as any).autoTable({
    head: personaDetailsHeaders,
    body: personaDetailsData,
    startY: yPosition,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 98, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 'auto' }
    }
  });
  
  yPosition = (pdf as any).lastAutoTable.finalY + 10;
  
  // Add pain points
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Pain Points', 20, yPosition);
  yPosition += 7;
  
  persona.painPoints.forEach((point, index) => {
    pdf.setFontSize(10);
    pdf.text(`• ${point}`, 25, yPosition);
    yPosition += 6;
  });
  
  yPosition += 5;
  
  // Add goals
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Goals', 20, yPosition);
  yPosition += 7;
  
  persona.goals.forEach((goal, index) => {
    pdf.setFontSize(10);
    pdf.text(`• ${goal}`, 25, yPosition);
    yPosition += 6;
  });
  
  yPosition += 10;
  
  // Add actual users section if available
  if (persona.users && persona.users.length > 0) {
    // Check if we need a new page
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Actual Users', 20, yPosition);
    yPosition += 10;
    
    // Create users table
    const usersTableHeaders = [['Name', 'Email', 'Last Login', 'Churn Risk']];
    const usersTableData = persona.users.map(user => [
      user.name,
      user.email,
      new Date(user.lastLogin).toLocaleDateString(),
      `${(user.churnRisk * 100).toFixed(0)}%`
    ]);
    
    (pdf as any).autoTable({
      head: usersTableHeaders,
      body: usersTableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: 'center' }
      },
      didDrawPage: (data: any) => {
        // Add page number at the bottom
        pdf.setFontSize(8);
        pdf.text(`Page ${pdf.getNumberOfPages()}`, 105, 290, { align: 'center' });
      }
    });
    
    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // Add user stories if available
  if (stories.length > 0) {
    // Check if we need a new page
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('User Stories', 20, yPosition);
    yPosition += 10;
    
    // For each story, create a detailed section
    stories.forEach((story, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(12);
      pdf.setTextColor(41, 98, 255);
      pdf.text(`Story ${index + 1}: ${story.title}`, 20, yPosition);
      yPosition += 7;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Priority: ${story.priority.charAt(0).toUpperCase() + story.priority.slice(1)}`, 25, yPosition);
      yPosition += 5;
      
      // Split description into multiple lines if needed
      const descriptionLines = pdf.splitTextToSize(story.description, 170);
      pdf.text(descriptionLines, 25, yPosition);
      yPosition += descriptionLines.length * 5 + 5;
      
      // Add acceptance criteria
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Acceptance Criteria:', 25, yPosition);
      yPosition += 5;
      
      story.acceptanceCriteria.forEach((criteria, criteriaIndex) => {
        pdf.text(`${criteriaIndex + 1}. ${criteria}`, 30, yPosition);
        yPosition += 5;
      });
      
      yPosition += 10;
    });
  }
  
  // Add footer with disclaimer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('This report is generated based on the data provided and is for informational purposes only.', 105, 285, { align: 'center' });
  pdf.text(`Page ${pdf.getNumberOfPages()}`, 105, 290, { align: 'center' });
  
  // Save the PDF with the given filename
  pdf.save(`Persona_${persona.name.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`);
}; 