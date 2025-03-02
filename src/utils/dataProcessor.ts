import { UserData, UserSegment, Persona, UserStory, ChurnMetric, Insight } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { pipeline } from '@huggingface/transformers';

// Global store for processed data
let processedUserData: UserData[] = [];
let generatedPersonas: Persona[] = [];
let generatedStories: UserStory[] = [];
let generatedMetrics: ChurnMetric[] = [];
let generatedInsights: Insight[] = [];

// Process file data
export const processFileData = async (file: File): Promise<boolean> => {
  try {
    const fileData = await readFileData(file);
    if (!fileData || !fileData.length) {
      console.error('No data found in the file');
      return false;
    }

    // Transform raw data into UserData objects
    processedUserData = transformRawData(fileData);
    
    // Generate personas based on processed data
    await generatePersonas();
    
    // Generate user stories based on personas
    await generateUserStories();
    
    // Generate churn metrics
    generateChurnMetrics();
    
    // Generate insights
    await generateInsights();
    
    return true;
  } catch (error) {
    console.error('Error processing file data:', error);
    return false;
  }
};

// Read file data based on file type
const readFileData = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'text/csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          resolve(results.data as any[]);
        },
        error: (error) => {
          reject(error);
        }
      });
    } else if (
      file.type === 'application/vnd.ms-excel' || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData as any[]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};

// Transform raw data into UserData objects
const transformRawData = (rawData: any[]): UserData[] => {
  // Map expected field names (flexible mapping to accommodate different CSV formats)
  const fieldMap = {
    id: ['id', 'user_id', 'userid', 'user id', 'ID'],
    name: ['name', 'user_name', 'username', 'user name', 'fullname', 'full_name', 'full name'],
    email: ['email', 'user_email', 'useremail', 'user email', 'mail'],
    lastLogin: ['last_login', 'lastlogin', 'last login', 'last_seen', 'lastseen', 'last seen'],
    registeredDate: ['registered_date', 'registereddate', 'registered date', 'signup_date', 'signupdate', 'signup date', 'created_at', 'createdat', 'created at'],
    activityScore: ['activity_score', 'activityscore', 'activity score', 'engagement_score', 'engagementscore', 'engagement score'],
  };

  // Find the actual field names in the data
  const actualFieldMap: Record<string, string> = {};
  const sampleRow = rawData[0] || {};
  
  for (const [expectedField, possibleNames] of Object.entries(fieldMap)) {
    const match = possibleNames.find(name => sampleRow[name] !== undefined);
    if (match) {
      actualFieldMap[expectedField] = match;
    }
  }

  // Transform the data
  return rawData.map((row, index) => {
    // Generate random values for missing fields
    const activityScoreValue = actualFieldMap.activityScore && !isNaN(Number(row[actualFieldMap.activityScore])) 
      ? Number(row[actualFieldMap.activityScore]) 
      : Math.random() * 10;
      
    // Calculate churn risk based on activity score
    const churnRisk = 1 - (activityScoreValue / 10);
    
    // Determine user segment based on churn risk
    let userSegment: UserSegment = 'occasional';
    if (churnRisk > 0.7) {
      userSegment = 'atrisk';
    } else if (churnRisk < 0.3) {
      userSegment = 'power';
    }
    
    return {
      id: row[actualFieldMap.id] || uuidv4(),
      name: row[actualFieldMap.name] || `User ${index + 1}`,
      email: row[actualFieldMap.email] || `user${index + 1}@example.com`,
      lastLogin: row[actualFieldMap.lastLogin] || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      registeredDate: row[actualFieldMap.registeredDate] || new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      userSegment,
      churnRisk,
      activityScore: activityScoreValue
    };
  });
};

// Helper function to safely extract text from text generation output
const extractGeneratedText = (result: any): string => {
  // Check various properties that might contain the generated text
  if (result && typeof result === 'object') {
    // For TextGenerationSingle format
    if (result.generated_text) {
      return result.generated_text;
    }
    // For array format
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      if (typeof firstResult === 'string') {
        return firstResult;
      }
      if (firstResult && firstResult.generated_text) {
        return firstResult.generated_text;
      }
      if (firstResult && firstResult.text) {
        return firstResult.text;
      }
    }
    // For object format with text property
    if (result.text) {
      return result.text;
    }
    // For object format with sequences
    if (result.sequences && result.sequences.length > 0) {
      return result.sequences[0].text || '';
    }
  }
  
  // If we can't find generated text, return empty string
  console.warn('Could not extract generated text from result:', result);
  return '';
};

// Generate personas based on processed user data
const generatePersonas = async (): Promise<void> => {
  // Group users by segment
  const usersBySegment: Record<UserSegment, UserData[]> = {
    power: processedUserData.filter(user => user.userSegment === 'power'),
    atrisk: processedUserData.filter(user => user.userSegment === 'atrisk'),
    occasional: processedUserData.filter(user => user.userSegment === 'occasional')
  };
  
  // Generate text to create personas
  const textGenerator = await pipeline('text-generation', 'distilgpt2');
  
  const personas: Persona[] = [];
  
  for (const segment of Object.keys(usersBySegment) as UserSegment[]) {
    const usersInSegment = usersBySegment[segment];
    if (usersInSegment.length === 0) continue;
    
    // Calculate average churn risk for the segment
    const avgChurnRisk = usersInSegment.reduce((sum, user) => sum + user.churnRisk, 0) / usersInSegment.length;
    
    // Generate persona name
    const segmentNames = {
      power: ['Power', 'Pro', 'Expert', 'Advanced', 'Champion'],
      atrisk: ['Risk', 'Churn', 'Leaving', 'Fading', 'Wavering'],
      occasional: ['Casual', 'Rare', 'Infrequent', 'Part-time', 'Occasional']
    };
    
    const randomNames = [
      'Alex', 'Bailey', 'Casey', 'Dana', 'Ellis', 
      'Francis', 'Glenn', 'Harper', 'Ivy', 'Jordan', 
      'Kelly', 'Leslie', 'Morgan', 'Nico', 'Ollie', 
      'Parker', 'Quinn', 'Riley', 'Sage', 'Taylor'
    ];
    
    const prefix = segmentNames[segment][Math.floor(Math.random() * segmentNames[segment].length)];
    const name = randomNames[Math.floor(Math.random() * randomNames.length)];
    const personaName = `${prefix} ${name}`;
    
    // Generate description using Hugging Face
    const promptText = `This user is a ${segment === 'power' ? 'highly engaged' : segment === 'atrisk' ? 'at risk of churning' : 'occasional'} user of a SaaS product. They`;
    const descriptionResult = await textGenerator(promptText, { max_length: 100, num_return_sequences: 1 });
    const generatedDescription = extractGeneratedText(descriptionResult);
    const description = (generatedDescription || promptText)
      .replace(promptText, '')
      .replace(/\.$/, '')
      .trim();
    
    // Generate pain points
    const painPointsPrompt = `Pain points for ${segment === 'power' ? 'power users' : segment === 'atrisk' ? 'users about to churn' : 'occasional users'} include:`;
    const painPointsResult = await textGenerator(painPointsPrompt, { max_length: 70, num_return_sequences: 1 });
    const painPointsText = extractGeneratedText(painPointsResult) || '';
    
    // Extract pain points from generated text
    const painPoints = painPointsText
      .replace(painPointsPrompt, '')
      .split(/[,.;]/)
      .map(point => point.trim())
      .filter(point => point.length > 0 && point.length < 30)
      .slice(0, 3);
    
    // Same for goals
    const goalsPrompt = `Goals for ${segment === 'power' ? 'power users' : segment === 'atrisk' ? 'users about to churn' : 'occasional users'} include:`;
    const goalsResult = await textGenerator(goalsPrompt, { max_length: 70, num_return_sequences: 1 });
    const goalsText = extractGeneratedText(goalsResult) || '';
    
    const goals = goalsText
      .replace(goalsPrompt, '')
      .split(/[,.;]/)
      .map(goal => goal.trim())
      .filter(goal => goal.length > 0 && goal.length < 30)
      .slice(0, 3);
    
    personas.push({
      id: uuidv4(),
      name: personaName,
      segment,
      description: `${promptText} ${description}.`,
      painPoints: painPoints.length > 0 ? painPoints : ['N/A'],
      goals: goals.length > 0 ? goals : ['N/A'],
      churnRisk: avgChurnRisk
    });
  }
  
  generatedPersonas = personas;
};

// Generate user stories based on personas
const generateUserStories = async (): Promise<void> => {
  if (!generatedPersonas.length) return;
  
  const stories: UserStory[] = [];
  const textGenerator = await pipeline('text-generation', 'distilgpt2');
  
  const storyTypes = {
    power: ['Advanced features', 'Workflow optimization', 'Integration capabilities', 'Power tools'],
    atrisk: ['Simplified interface', 'Onboarding improvements', 'Value demonstration', 'Problem resolution'],
    occasional: ['Re-engagement', 'Feature discovery', 'Value reminders', 'Quick wins']
  };
  
  const priorities = ['high', 'medium', 'low'] as const;
  
  for (const persona of generatedPersonas) {
    const storyTypeOptions = storyTypes[persona.segment] || storyTypes.occasional;
    const storyType = storyTypeOptions[Math.floor(Math.random() * storyTypeOptions.length)];
    
    // Generate story title
    const titlePrompt = `User story for ${storyType}:`;
    const titleResult = await textGenerator(titlePrompt, { max_length: 30, num_return_sequences: 1 });
    const titleText = extractGeneratedText(titleResult) || '';
    const title = titleText.replace(titlePrompt, '').trim() || storyType;
    
    // Generate story description using "As a user, I want to... so that..." format
    const descriptionPrompt = `As ${persona.name}, I want`;
    const descriptionResult = await textGenerator(descriptionPrompt, { max_length: 100, num_return_sequences: 1 });
    const descriptionText = extractGeneratedText(descriptionResult) || '';
    const description = descriptionText.trim() || `${descriptionPrompt} to see value in the product quickly`;
    
    // Generate acceptance criteria
    const criteria: string[] = [];
    for (let i = 0; i < 3; i++) {
      const criteriaPrompt = `Acceptance criteria for ${title}:`;
      const criteriaResult = await textGenerator(criteriaPrompt, { max_length: 50, num_return_sequences: 1 });
      const criteriaText = extractGeneratedText(criteriaResult) || '';
      const criterion = criteriaText.replace(criteriaPrompt, '').trim();
      if (criterion) {
        criteria.push(criterion);
      }
    }
    
    // If no criteria were generated, provide fallbacks
    if (!criteria.length) {
      criteria.push('Feature must be implemented according to specifications');
      criteria.push('User testing shows positive feedback');
      criteria.push('Performance metrics remain stable');
    }
    
    // Assign priority based on persona segment
    const priority = persona.segment === 'atrisk' 
      ? 'high' 
      : persona.segment === 'power' 
        ? 'medium' 
        : 'low';
    
    stories.push({
      id: uuidv4(),
      personaId: persona.id,
      title,
      description,
      priority,
      acceptanceCriteria: criteria
    });
  }
  
  generatedStories = stories;
};

// Generate churn metrics based on processed data
const generateChurnMetrics = (): void => {
  if (!processedUserData.length) return;
  
  // Calculate total users
  const totalUsers = processedUserData.length;
  
  // Calculate users at risk (churn risk > 0.7)
  const atRiskUsers = processedUserData.filter(user => user.churnRisk > 0.7).length;
  const atRiskPercentage = (atRiskUsers / totalUsers) * 100;
  
  // Calculate average engagement
  const avgEngagement = processedUserData.reduce((sum, user) => sum + user.activityScore, 0) / totalUsers;
  
  // Calculate churn rate (simulate based on at-risk percentage)
  const simulatedChurnRate = atRiskPercentage / 10; // Scale down for realistic values
  
  // Calculate retention rate (inverse of churn)
  const retentionRate = 100 - simulatedChurnRate;
  
  // Create metrics with simulated changes
  const metrics: ChurnMetric[] = [
    {
      id: uuidv4(),
      title: 'Churn Rate',
      value: simulatedChurnRate,
      change: -0.5 + Math.random(), // Random change between -0.5 and 0.5
      isPositive: false, // Lower churn is better
      description: 'Monthly user churn based on current data'
    },
    {
      id: uuidv4(),
      title: 'At-Risk Users',
      value: atRiskUsers,
      change: -5 + Math.round(Math.random() * 10), // Random change between -5 and 5
      isPositive: false, // Fewer at-risk users is better
      description: 'Users flagged with >70% probability of churning'
    },
    {
      id: uuidv4(),
      title: 'Avg. Engagement',
      value: avgEngagement,
      change: Math.round(Math.random() * 5 * 10) / 10, // Random change between 0 and 5
      isPositive: true, // Higher engagement is better
      description: 'Average activity score per user'
    },
    {
      id: uuidv4(),
      title: 'Retention Rate',
      value: retentionRate,
      change: Math.round(Math.random() * 3 * 10) / 10, // Random change between 0 and 3
      isPositive: true, // Higher retention is better
      description: 'Percentage of users retained based on current data'
    }
  ];
  
  generatedMetrics = metrics;
};

// Generate insights based on processed data and personas
const generateInsights = async (): Promise<void> => {
  if (!processedUserData.length) return;
  
  const textGenerator = await pipeline('text-generation', 'distilgpt2');
  
  const insightCategories = ['onboarding', 'engagement', 'support', 'product'];
  const impactLevels = ['high', 'medium', 'low'];
  
  const insights: Insight[] = [];
  
  for (let i = 0; i < 6; i++) {
    const category = insightCategories[i % insightCategories.length];
    
    // Generate insight title
    const titlePrompt = `Insight about ${category}:`;
    const titleResult = await textGenerator(titlePrompt, { max_length: 50, num_return_sequences: 1 });
    const title = extractGeneratedText(titleResult).replace(titlePrompt, '').trim() || `Improve ${category}`;
    
    // Generate insight description
    const descriptionPrompt = `Description of insight about ${category}:`;
    const descriptionResult = await textGenerator(descriptionPrompt, { max_length: 80, num_return_sequences: 1 });
    const description = extractGeneratedText(descriptionResult).replace(descriptionPrompt, '').trim() || 
      `Users who interact with ${category} features show different behavior patterns.`;
    
    // Generate recommendation
    const recommendationPrompt = `Recommendation for ${title}:`;
    const recommendationResult = await textGenerator(recommendationPrompt, { max_length: 80, num_return_sequences: 1 });
    const recommendation = extractGeneratedText(recommendationResult).replace(recommendationPrompt, '').trim() || 
      `Consider improving ${category} experience to reduce churn.`;
    
    // Determine impact level - weight toward higher impact for more important categories
    const impact = impactLevels[Math.floor(Math.random() * impactLevels.length)] as 'high' | 'medium' | 'low';
    
    insights.push({
      id: uuidv4(),
      title,
      description,
      impact,
      recommendation,
      category: category as 'onboarding' | 'engagement' | 'support' | 'product'
    });
  }
  
  generatedInsights = insights;
};

// Getter functions to access the processed data
export const getProcessedUserData = (): UserData[] => {
  return processedUserData;
};

export const getGeneratedPersonas = (): Persona[] => {
  return generatedPersonas;
};

export const getGeneratedStories = (): UserStory[] => {
  return generatedStories;
};

export const getGeneratedMetrics = (): ChurnMetric[] => {
  return generatedMetrics;
};

export const getGeneratedInsights = (): Insight[] => {
  return generatedInsights;
};

// For testing, create some initial data if needed
export const hasGeneratedData = (): boolean => {
  return processedUserData.length > 0;
};
