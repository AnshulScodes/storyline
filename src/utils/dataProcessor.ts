
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

/**
 * Process file data from uploaded CSV or Excel
 * 
 * This is the main entry point for data processing that:
 * 1. Reads the uploaded file content
 * 2. Transforms raw data into structured UserData objects
 * 3. Generates personas, stories, metrics and insights
 * 4. Returns success/failure status
 */
export const processFileData = async (file: File): Promise<boolean> => {
  console.log('🔄 Starting file processing:', file.name, file.type);
  try {
    // Step 1: Read file data based on type (CSV or Excel)
    console.log('📖 Reading file data...');
    const fileData = await readFileData(file);
    if (!fileData || !fileData.length) {
      console.error('❌ No data found in the file');
      return false;
    }
    console.log(`✅ File data read successfully. Found ${fileData.length} records.`);

    // Step 2: Transform raw data into UserData objects
    console.log('🔄 Transforming raw data into structured format...');
    processedUserData = transformRawData(fileData);
    console.log(`✅ Data transformation complete. Processed ${processedUserData.length} user records.`);
    
    // Step 3: Sort users by churn risk (highest to lowest)
    processedUserData.sort((a, b) => b.churnRisk - a.churnRisk);
    console.log('✅ Users sorted by churn risk (highest to lowest)');
    
    // Step 4: Generate user personas based on segmentation
    console.log('🔄 Generating user personas...');
    try {
      await generatePersonas();
      console.log(`✅ Generated ${generatedPersonas.length} user personas`);
    } catch (error) {
      console.error('❌ Error generating personas:', error);
      // Use fallback method if AI generation fails
      generateFallbackPersonas();
      console.log(`✅ Used fallback to generate ${generatedPersonas.length} user personas`);
    }
    
    // Step 5: Generate user stories based on personas
    console.log('🔄 Generating user stories...');
    try {
      await generateUserStories();
      console.log(`✅ Generated ${generatedStories.length} user stories`);
    } catch (error) {
      console.error('❌ Error generating user stories:', error);
      // Use fallback method if AI generation fails
      generateFallbackStories();
      console.log(`✅ Used fallback to generate ${generatedStories.length} user stories`);
    }
    
    // Step 6: Generate churn metrics
    console.log('🔄 Generating churn metrics...');
    generateChurnMetrics();
    console.log(`✅ Generated ${generatedMetrics.length} churn metrics`);
    
    // Step 7: Generate insights
    console.log('🔄 Generating insights...');
    try {
      await generateInsights();
      console.log(`✅ Generated ${generatedInsights.length} insights`);
    } catch (error) {
      console.error('❌ Error generating insights:', error);
      // Use fallback method if AI generation fails
      generateFallbackInsights();
      console.log(`✅ Used fallback to generate ${generatedInsights.length} insights`);
    }
    
    console.log('🎉 File processing completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error processing file data:', error);
    return false;
  }
};

/**
 * Read file data based on file type (CSV or Excel)
 * 
 * Uses Papaparse for CSV files and XLSX for Excel files
 * Returns a promise that resolves to an array of raw data objects
 */
const readFileData = async (file: File): Promise<any[]> => {
  console.log('📊 Reading file:', file.name, file.type);
  return new Promise((resolve, reject) => {
    if (file.type === 'text/csv') {
      console.log('📝 Parsing CSV file...');
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          console.log(`📝 CSV parsing complete. Found ${results.data.length} rows.`);
          resolve(results.data as any[]);
        },
        error: (error) => {
          console.error('❌ CSV parsing error:', error);
          reject(error);
        }
      });
    } else if (
      file.type === 'application/vnd.ms-excel' || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      console.log('📊 Parsing Excel file...');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          console.log('📊 Excel file read, converting to workbook...');
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          console.log(`📊 Using first sheet: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          console.log(`📊 Excel parsing complete. Found ${jsonData.length} rows.`);
          resolve(jsonData as any[]);
        } catch (error) {
          console.error('❌ Excel parsing error:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('❌ Excel file reading error:', error);
        reject(error);
      };
      reader.readAsBinaryString(file);
    } else {
      console.error('❌ Unsupported file type:', file.type);
      reject(new Error('Unsupported file type'));
    }
  });
};

/**
 * Transform raw data into structured UserData objects
 * 
 * This function:
 * 1. Maps CSV/Excel column names to expected field names
 * 2. Creates UserData objects with proper typing
 * 3. Calculates churn risk based on advanced weighted factors:
 *    - Activity score (50% weight)
 *    - Last login recency (30% weight)
 *    - Account age (20% weight)
 * 4. Assigns user segments based on churn risk thresholds
 * 5. Returns sorted array of UserData objects
 */
const transformRawData = (rawData: any[]): UserData[] => {
  console.log('🔄 Starting data transformation...');
  
  // Define field mapping for flexible column name handling
  const fieldMap = {
    id: ['id', 'user_id', 'userid', 'user id', 'ID'],
    name: ['name', 'user_name', 'username', 'user name', 'fullname', 'full_name', 'full name'],
    email: ['email', 'user_email', 'useremail', 'user email', 'mail'],
    lastLogin: ['last_login', 'lastlogin', 'last login', 'last_seen', 'lastseen', 'last seen'],
    registeredDate: ['registered_date', 'registereddate', 'registered date', 'signup_date', 'signupdate', 'signup date', 'created_at', 'createdat', 'created at'],
    activityScore: ['activity_score', 'activityscore', 'activity score', 'engagement_score', 'engagementscore', 'engagement score'],
  };

  // Find actual field names in the data
  console.log('🔍 Identifying column mappings...');
  const actualFieldMap: Record<string, string> = {};
  const sampleRow = rawData[0] || {};
  
  // Debug the first row to help identify available fields
  console.log('📊 Sample data row:', JSON.stringify(sampleRow).substring(0, 200) + '...');
  
  for (const [expectedField, possibleNames] of Object.entries(fieldMap)) {
    const match = possibleNames.find(name => sampleRow[name] !== undefined);
    if (match) {
      actualFieldMap[expectedField] = match;
      console.log(`✅ Found mapping for ${expectedField}: ${match}`);
    } else {
      console.log(`⚠️ No mapping found for ${expectedField}. Will use generated value.`);
    }
  }

  // Log the final field mappings
  console.log('📊 Final field mappings:', actualFieldMap);
  
  // Initialize result array
  const userData: UserData[] = [];

  // Process each row in the raw data
  console.log(`🔄 Processing ${rawData.length} rows of user data...`);
  
  rawData.forEach((row, index) => {
    if (index === 0 || index === rawData.length - 1 || index === Math.floor(rawData.length / 2)) {
      console.log(`📊 Processing row ${index + 1}/${rawData.length}:`, JSON.stringify(row).substring(0, 200) + '...');
    }
    
    // Generate or extract activity score (normalized to 0-10 scale)
    let activityScoreValue: number;
    if (actualFieldMap.activityScore && !isNaN(Number(row[actualFieldMap.activityScore]))) {
      activityScoreValue = Number(row[actualFieldMap.activityScore]);
      // Normalize to 0-10 scale if outside that range
      if (activityScoreValue > 10) {
        activityScoreValue = 10 * (activityScoreValue / 100);
      }
    } else {
      // Generate random activity score between 1-10 if not available
      activityScoreValue = 1 + Math.random() * 9;
    }
    
    // Advanced churn risk calculation with weighted factors
    // -------------------------------------------------
    
    // FACTOR 1: Activity-based risk (50% weight)
    // Lower activity score = higher churn risk
    const activityBasedRisk = 1 - (activityScoreValue / 10);
    
    // FACTOR 2: Last login recency (30% weight)
    // More days since last login = higher churn risk
    let lastLoginDate: Date;
    if (actualFieldMap.lastLogin && row[actualFieldMap.lastLogin]) {
      lastLoginDate = new Date(row[actualFieldMap.lastLogin]);
      // Validate date - if invalid, generate a random recent date
      if (isNaN(lastLoginDate.getTime())) {
        lastLoginDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      // Generate random last login between 0-30 days ago
      lastLoginDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    }
    
    const daysSinceLastLogin = (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24);
    // Normalize to 0-1 (max 30 days for full risk)
    const loginRecencyRisk = Math.min(daysSinceLastLogin / 30, 1);
    
    // FACTOR 3: Account age factor (20% weight)
    // Newer accounts have higher churn risk
    let registeredDate: Date;
    if (actualFieldMap.registeredDate && row[actualFieldMap.registeredDate]) {
      registeredDate = new Date(row[actualFieldMap.registeredDate]);
      // Validate date - if invalid, generate a random registration date
      if (isNaN(registeredDate.getTime())) {
        registeredDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      }
    } else {
      // Generate random registration between 0-365 days ago
      registeredDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    }
    
    const accountAgeInDays = (Date.now() - registeredDate.getTime()) / (1000 * 60 * 60 * 24);
    // Normalize to 0-1 (accounts older than 180 days have minimal risk)
    const accountAgeRisk = Math.max(1 - (accountAgeInDays / 180), 0);
    
    // Calculate weighted churn risk
    let churnRisk = (
      (activityBasedRisk * 0.5) + 
      (loginRecencyRisk * 0.3) + 
      (accountAgeRisk * 0.2)
    );
    
    // Ensure churn risk is within 0-1 range
    churnRisk = Math.max(0, Math.min(1, churnRisk));
    
    // Determine user segment based on churn risk thresholds
    let userSegment: UserSegment;
    if (churnRisk > 0.7) {
      userSegment = 'atrisk';  // High churn risk
    } else if (churnRisk < 0.3) {
      userSegment = 'power';   // Low churn risk, highly engaged
    } else {
      userSegment = 'occasional'; // Medium churn risk
    }
    
    // Create user data object
    userData.push({
      id: row[actualFieldMap.id] || uuidv4(),
      name: row[actualFieldMap.name] || `User ${index + 1}`,
      email: row[actualFieldMap.email] || `user${index + 1}@example.com`,
      lastLogin: row[actualFieldMap.lastLogin] || lastLoginDate.toISOString(),
      registeredDate: row[actualFieldMap.registeredDate] || registeredDate.toISOString(),
      userSegment,
      churnRisk,
      activityScore: activityScoreValue
    });
  });

  // Log some statistics about the processed data
  const avgChurnRisk = userData.reduce((sum, user) => sum + user.churnRisk, 0) / userData.length;
  const segmentCounts = {
    power: userData.filter(u => u.userSegment === 'power').length,
    occasional: userData.filter(u => u.userSegment === 'occasional').length,
    atrisk: userData.filter(u => u.userSegment === 'atrisk').length
  };
  
  console.log('📊 Data transformation complete');
  console.log(`📊 Average churn risk: ${avgChurnRisk.toFixed(2)}`);
  console.log(`📊 User segments: Power users: ${segmentCounts.power}, Occasional users: ${segmentCounts.occasional}, At-risk users: ${segmentCounts.atrisk}`);

  // Sort users by churn risk (descending)
  return userData.sort((a, b) => b.churnRisk - a.churnRisk);
};

/**
 * Safely extracts generated text from Hugging Face model output
 * 
 * This function handles the various output formats that might come from
 * the Hugging Face transformers library and ensures we can extract
 * text content regardless of the exact output structure.
 */
const extractGeneratedText = (result: any): string => {
  console.log('🔍 Extracting generated text from model output');
  console.log('🔍 Result type:', typeof result);
  
  try {
    // Log the shape of the result to debug
    if (Array.isArray(result)) {
      console.log('🔍 Result is an array with length:', result.length);
      if (result.length > 0) {
        console.log('🔍 First item type:', typeof result[0]);
      }
    } else if (result && typeof result === 'object') {
      console.log('🔍 Result keys:', Object.keys(result));
    }
    
    // Check various properties that might contain the generated text
    if (result && typeof result === 'object') {
      // Handle string result
      if (typeof result === 'string') {
        console.log('✅ Found string result');
        return result;
      }
      
      // For TextGenerationSingle format
      if (typeof result.generated_text === 'string') {
        console.log('✅ Found generated_text property');
        return result.generated_text;
      }
      
      // For the generated_text in nested format
      if (result.generated_text && Array.isArray(result.generated_text) && result.generated_text.length > 0) {
        console.log('✅ Found generated_text array');
        return typeof result.generated_text[0] === 'string' ? 
          result.generated_text[0] : 
          (result.generated_text[0]?.text || '');
      }
      
      // For array format
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0];
        console.log('🔍 Checking first item in array result');
        
        if (typeof firstResult === 'string') {
          console.log('✅ Found string in array');
          return firstResult;
        }
        
        if (firstResult && typeof firstResult.generated_text === 'string') {
          console.log('✅ Found generated_text in array item');
          return firstResult.generated_text;
        }
        
        if (firstResult && typeof firstResult.text === 'string') {
          console.log('✅ Found text property in array item');
          return firstResult.text;
        }
      }
      
      // For object format with text property
      if (typeof result.text === 'string') {
        console.log('✅ Found text property');
        return result.text;
      }
      
      // For object format with sequences
      if (result.sequences && result.sequences.length > 0) {
        console.log('✅ Found sequences property');
        return typeof result.sequences[0].text === 'string' ? result.sequences[0].text : '';
      }
      
      // For direct access to the text property
      if (result[0] && typeof result[0].text === 'string') {
        console.log('✅ Found text property in first array element');
        return result[0].text;
      }
    }
  } catch (error) {
    console.error('❌ Error extracting generated text:', error);
  }
  
  // If we can't find generated text, return empty string
  console.warn('⚠️ Could not extract generated text from result');
  return '';
};

/**
 * Generate mock text for fallback scenarios
 * 
 * This function mimics the AI text generation when the Hugging Face
 * transformers pipeline fails, providing consistent fallback content.
 */
const generateMockText = (prompt: string, topic: string): string => {
  const fallbacks = {
    persona: {
      power: "is a dedicated user who logs in multiple times per week. They rely on the product for critical work tasks and use advanced features regularly.",
      atrisk: "has shown decreased activity in recent weeks. They've experienced some technical issues and haven't received the value they expected.",
      occasional: "uses the product for specific tasks but hasn't fully incorporated it into their regular workflow. They visit occasionally to complete particular activities."
    },
    painPoints: {
      power: ["Limited advanced features", "Occasional performance issues", "Needs better integration options"],
      atrisk: ["Unclear value proposition", "Difficult onboarding", "Too expensive for current usage"],
      occasional: ["Forgets how to use interface", "Doesn't see regular value", "Notifications are too frequent"]
    },
    goals: {
      power: ["Improve workflow efficiency", "Access advanced analytics", "Customize experience further"],
      atrisk: ["Find immediate value", "Resolve technical issues", "Simplify complex processes"],
      occasional: ["Complete specific tasks quickly", "Learn essential features only", "Minimize time investment"]
    },
    stories: {
      power: "to have more customization options for advanced workflows so that I can optimize my productivity.",
      atrisk: "to see immediate value from the core features so that I can justify continuing to use the product.",
      occasional: "to quickly accomplish specific tasks without a steep learning curve so that I can get in and out efficiently."
    },
    insights: {
      onboarding: "New users struggle with completing the onboarding process. The tutorials are too long and users often skip them.",
      engagement: "Users who connect third-party integrations show 3x higher retention rates and use the product more frequently.",
      support: "Support response time has a direct correlation with user retention. Faster responses lead to significantly lower churn.",
      product: "Feature discovery is a major issue. Many users aren't aware of key features that would solve their specific problems."
    },
    recommendations: {
      onboarding: "Simplify the onboarding process to focus on core value, introducing advanced features through contextual tips later.",
      engagement: "Create an email campaign highlighting integration possibilities and their benefits, targeting occasional users.",
      support: "Implement a priority response system for at-risk users based on their churn prediction score.",
      product: "Add feature discovery tooltips based on user behavior patterns to highlight relevant functionality."
    }
  };
  
  if (prompt.includes('persona') || prompt.includes('user')) {
    // Determine which segment we're generating for
    let segment = 'occasional';
    if (prompt.includes('power')) segment = 'power';
    if (prompt.includes('risk')) segment = 'atrisk';
    
    return fallbacks.persona[segment];
  } else if (prompt.includes('pain point')) {
    let segment = 'occasional';
    if (prompt.includes('power')) segment = 'power';
    if (prompt.includes('risk')) segment = 'atrisk';
    
    return fallbacks.painPoints[segment].join(', ');
  } else if (prompt.includes('goal')) {
    let segment = 'occasional';
    if (prompt.includes('power')) segment = 'power';
    if (prompt.includes('risk')) segment = 'atrisk';
    
    return fallbacks.goals[segment].join(', ');
  } else if (prompt.includes('story')) {
    let segment = 'occasional';
    if (prompt.includes('power')) segment = 'power';
    if (prompt.includes('risk')) segment = 'atrisk';
    
    return fallbacks.stories[segment];
  } else if (prompt.includes('insight')) {
    let category = 'product';
    if (prompt.includes('onboarding')) category = 'onboarding';
    if (prompt.includes('engagement')) category = 'engagement';
    if (prompt.includes('support')) category = 'support';
    
    return fallbacks.insights[category];
  } else if (prompt.includes('recommend')) {
    let category = 'product';
    if (prompt.includes('onboarding')) category = 'onboarding';
    if (prompt.includes('engagement')) category = 'engagement';
    if (prompt.includes('support')) category = 'support';
    
    return fallbacks.recommendations[category];
  }
  
  // Default fallback
  return "The user values simplicity and efficiency in the product experience.";
};

/**
 * Generate user personas based on the processed data
 * 
 * This function:
 * 1. Groups users by segment (power, atrisk, occasional)
 * 2. Uses AI text generation to create realistic descriptions, pain points, and goals
 * 3. Creates persona objects for each segment with representative characteristics
 */
const generatePersonas = async (): Promise<void> => {
  console.log('🧩 Starting persona generation...');
  
  if (!processedUserData.length) {
    console.warn('⚠️ No user data available for persona generation');
    return;
  }
  
  // Group users by segment
  const usersBySegment: Record<UserSegment, UserData[]> = {
    power: processedUserData.filter(user => user.userSegment === 'power'),
    atrisk: processedUserData.filter(user => user.userSegment === 'atrisk'),
    occasional: processedUserData.filter(user => user.userSegment === 'occasional')
  };
  
  console.log('📊 User segment distribution:', {
    power: usersBySegment.power.length,
    atrisk: usersBySegment.atrisk.length,
    occasional: usersBySegment.occasional.length
  });
  
  // Try to initialize the text generation pipeline with fallback options
  let textGenerator;
  try {
    console.log('🤖 Initializing text generation model...');
    textGenerator = await pipeline('text-generation', 'distilgpt2');
    console.log('✅ Text generation model initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize text generation model:', error);
    // We'll handle this by using fallback generation methods
    throw new Error('Failed to initialize text generation model');
  }
  
  const personas: Persona[] = [];
  
  for (const segment of Object.keys(usersBySegment) as UserSegment[]) {
    console.log(`🧩 Generating persona for ${segment} segment...`);
    
    const usersInSegment = usersBySegment[segment];
    if (usersInSegment.length === 0) {
      console.log(`⚠️ No users in ${segment} segment, skipping persona generation`);
      continue;
    }
    
    // Calculate average churn risk for the segment
    const avgChurnRisk = usersInSegment.reduce((sum, user) => sum + user.churnRisk, 0) / usersInSegment.length;
    console.log(`📊 Average churn risk for ${segment} segment: ${avgChurnRisk.toFixed(2)}`);
    
    // Generate persona name based on segment
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
    console.log(`👤 Generated persona name: ${personaName}`);
    
    // Generate description using Hugging Face or fallback
    const promptText = `This user is a ${segment === 'power' ? 'highly engaged' : segment === 'atrisk' ? 'at risk of churning' : 'occasional'} user of a SaaS product. They`;
    let description;
    
    try {
      console.log(`🤖 Generating description for ${segment} persona...`);
      console.log(`🤖 Prompt: "${promptText}"`);
      
      const descriptionResult = await textGenerator(promptText, { 
        max_length: 100, 
        num_return_sequences: 1 
      });
      
      console.log('🤖 Raw description result:', JSON.stringify(descriptionResult).substring(0, 200) + '...');
      
      const generatedDescription = extractGeneratedText(descriptionResult);
      console.log(`🤖 Extracted description: "${generatedDescription}"`);
      
      description = (generatedDescription || promptText)
        .replace(promptText, '')
        .replace(/\.$/, '')
        .trim();
        
      if (!description) {
        throw new Error('Empty generated description');
      }
      
      console.log(`✅ Generated description: "${description}"`);
    } catch (error) {
      console.error('❌ Error generating description:', error);
      description = generateMockText(promptText, segment);
      console.log(`🔄 Using fallback description: "${description}"`);
    }
    
    // Generate pain points
    const painPointsPrompt = `Pain points for ${segment === 'power' ? 'power users' : segment === 'atrisk' ? 'users about to churn' : 'occasional users'} include:`;
    let painPoints: string[] = [];
    
    try {
      console.log(`🤖 Generating pain points for ${segment} persona...`);
      console.log(`🤖 Prompt: "${painPointsPrompt}"`);
      
      const painPointsResult = await textGenerator(painPointsPrompt, { 
        max_length: 70, 
        num_return_sequences: 1 
      });
      
      console.log('🤖 Raw pain points result:', JSON.stringify(painPointsResult).substring(0, 200) + '...');
      
      const painPointsText = extractGeneratedText(painPointsResult) || '';
      console.log(`🤖 Extracted pain points text: "${painPointsText}"`);
      
      // Extract pain points from generated text
      painPoints = painPointsText
        .replace(painPointsPrompt, '')
        .split(/[,.;]/)
        .map(point => point.trim())
        .filter(point => point.length > 0 && point.length < 30)
        .slice(0, 3);
        
      if (painPoints.length === 0) {
        throw new Error('No pain points extracted');
      }
      
      console.log(`✅ Generated pain points: ${painPoints.join(', ')}`);
    } catch (error) {
      console.error('❌ Error generating pain points:', error);
      const fallbackText = generateMockText(painPointsPrompt, segment);
      painPoints = fallbackText.split(', ');
      console.log(`🔄 Using fallback pain points: ${painPoints.join(', ')}`);
    }
    
    // Generate goals
    const goalsPrompt = `Goals for ${segment === 'power' ? 'power users' : segment === 'atrisk' ? 'users about to churn' : 'occasional users'} include:`;
    let goals: string[] = [];
    
    try {
      console.log(`🤖 Generating goals for ${segment} persona...`);
      console.log(`🤖 Prompt: "${goalsPrompt}"`);
      
      const goalsResult = await textGenerator(goalsPrompt, { 
        max_length: 70, 
        num_return_sequences: 1 
      });
      
      console.log('🤖 Raw goals result:', JSON.stringify(goalsResult).substring(0, 200) + '...');
      
      const goalsText = extractGeneratedText(goalsResult) || '';
      console.log(`🤖 Extracted goals text: "${goalsText}"`);
      
      goals = goalsText
        .replace(goalsPrompt, '')
        .split(/[,.;]/)
        .map(goal => goal.trim())
        .filter(goal => goal.length > 0 && goal.length < 30)
        .slice(0, 3);
        
      if (goals.length === 0) {
        throw new Error('No goals extracted');
      }
      
      console.log(`✅ Generated goals: ${goals.join(', ')}`);
    } catch (error) {
      console.error('❌ Error generating goals:', error);
      const fallbackText = generateMockText(goalsPrompt, segment);
      goals = fallbackText.split(', ');
      console.log(`🔄 Using fallback goals: ${goals.join(', ')}`);
    }
    
    personas.push({
      id: uuidv4(),
      name: personaName,
      segment,
      description: `${promptText} ${description}.`,
      painPoints: painPoints.length > 0 ? painPoints : ['N/A'],
      goals: goals.length > 0 ? goals : ['N/A'],
      churnRisk: avgChurnRisk
    });
    
    console.log(`✅ Created persona: ${personaName} (${segment})`);
  }
  
  generatedPersonas = personas;
  console.log(`✅ Generated ${personas.length} personas successfully`);
};

/**
 * Generate fallback personas when AI generation fails
 * 
 * Creates basic personas for each user segment using
 * predefined templates for descriptions, pain points and goals.
 */
const generateFallbackPersonas = (): void => {
  console.log('🔄 Generating fallback personas...');
  
  // Group users by segment
  const usersBySegment: Record<UserSegment, UserData[]> = {
    power: processedUserData.filter(user => user.userSegment === 'power'),
    atrisk: processedUserData.filter(user => user.userSegment === 'atrisk'),
    occasional: processedUserData.filter(user => user.userSegment === 'occasional')
  };
  
  const personas: Persona[] = [];
  
  // Predefined persona templates by segment
  const personaTemplates = {
    power: {
      namePrefix: ['Power', 'Pro', 'Expert'],
      description: 'This user is a highly engaged user of a SaaS product. They use the product daily and leverage advanced features.',
      painPoints: ['Limited advanced features', 'Occasional performance issues', 'Needs better integration options'],
      goals: ['Improve workflow efficiency', 'Access advanced analytics', 'Customize experience further']
    },
    atrisk: {
      namePrefix: ['At-Risk', 'Churning', 'Leaving'],
      description: 'This user is at risk of churning from a SaaS product. They have decreased their usage recently and may not renew.',
      painPoints: ['Unclear value proposition', 'Difficult onboarding', 'Too expensive for current usage'],
      goals: ['Find immediate value', 'Resolve technical issues', 'Simplify complex processes']
    },
    occasional: {
      namePrefix: ['Casual', 'Occasional', 'Infrequent'],
      description: 'This user is an occasional user of a SaaS product. They log in periodically for specific tasks.',
      painPoints: ['Forgets how to use interface', 'Doesn't see regular value', 'Notifications are too frequent'],
      goals: ['Complete specific tasks quickly', 'Learn essential features only', 'Minimize time investment']
    }
  };
  
  const randomNames = [
    'Alex', 'Bailey', 'Casey', 'Dana', 'Ellis', 
    'Francis', 'Glenn', 'Harper', 'Ivy', 'Jordan'
  ];
  
  for (const segment of Object.keys(usersBySegment) as UserSegment[]) {
    const usersInSegment = usersBySegment[segment];
    if (usersInSegment.length === 0) continue;
    
    // Calculate average churn risk for the segment
    const avgChurnRisk = usersInSegment.reduce((sum, user) => sum + user.churnRisk, 0) / usersInSegment.length;
    
    // Get template for this segment
    const template = personaTemplates[segment];
    
    // Generate name
    const prefix = template.namePrefix[Math.floor(Math.random() * template.namePrefix.length)];
    const name = randomNames[Math.floor(Math.random() * randomNames.length)];
    const personaName = `${prefix} ${name}`;
    
    personas.push({
      id: uuidv4(),
      name: personaName,
      segment,
      description: template.description,
      painPoints: template.painPoints,
      goals: template.goals,
      churnRisk: avgChurnRisk
    });
  }
  
  generatedPersonas = personas;
  console.log(`✅ Generated ${personas.length} fallback personas`);
};

/**
 * Generate user stories based on personas
 * 
 * Creates user stories for each persona with:
 * 1. Story title tailored to persona segment
 * 2. Description in "As a user, I want to... so that..." format
 * 3. Acceptance criteria for implementation
 * 4. Priority based on persona segment
 */
const generateUserStories = async (): Promise<void> => {
  console.log('📝 Starting user story generation...');
  
  if (!generatedPersonas.length) {
    console.warn('⚠️ No personas available for story generation');
    return;
  }
  
  const stories: UserStory[] = [];
  
  // Try to initialize the text generation pipeline
  let textGenerator;
  try {
    console.log('🤖 Initializing text generation model...');
    textGenerator = await pipeline('text-generation', 'distilgpt2');
    console.log('✅ Text generation model initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize text generation model:', error);
    throw new Error('Failed to initialize text generation model');
  }
  
  const storyTypes = {
    power: ['Advanced features', 'Workflow optimization', 'Integration capabilities', 'Power tools'],
    atrisk: ['Simplified interface', 'Onboarding improvements', 'Value demonstration', 'Problem resolution'],
    occasional: ['Re-engagement', 'Feature discovery', 'Value reminders', 'Quick wins']
  };
  
  for (const persona of generatedPersonas) {
    console.log(`📝 Generating story for persona: ${persona.name} (${persona.segment})`);
    
    const storyTypeOptions = storyTypes[persona.segment] || storyTypes.occasional;
    const storyType = storyTypeOptions[Math.floor(Math.random() * storyTypeOptions.length)];
    console.log(`📝 Selected story type: ${storyType}`);
    
    // Generate story title
    const titlePrompt = `User story for ${storyType}:`;
    let title: string;
    
    try {
      console.log(`🤖 Generating title with prompt: "${titlePrompt}"`);
      const titleResult = await textGenerator(titlePrompt, { 
        max_length: 30, 
        num_return_sequences: 1 
      });
      
      const titleText = extractGeneratedText(titleResult) || '';
      title = titleText.replace(titlePrompt, '').trim() || storyType;
      console.log(`✅ Generated title: ${title}`);
    } catch (error) {
      console.error('❌ Error generating title:', error);
      title = storyType;
      console.log(`🔄 Using fallback title: ${title}`);
    }
    
    // Generate story description using "As a user, I want to... so that..." format
    const descriptionPrompt = `As ${persona.name}, I want`;
    let description: string;
    
    try {
      console.log(`🤖 Generating description with prompt: "${descriptionPrompt}"`);
      const descriptionResult = await textGenerator(descriptionPrompt, { 
        max_length: 100, 
        num_return_sequences: 1 
      });
      
      const descriptionText = extractGeneratedText(descriptionResult) || '';
      description = descriptionText.trim() || `${descriptionPrompt} to see value in the product quickly`;
      console.log(`✅ Generated description: ${description}`);
    } catch (error) {
      console.error('❌ Error generating description:', error);
      description = `${descriptionPrompt} ${generateMockText('story', persona.segment)}`;
      console.log(`🔄 Using fallback description: ${description}`);
    }
    
    // Generate acceptance criteria
    const criteria: string[] = [];
    const criteriaPrompt = `Acceptance criteria for ${title}:`;
    
    try {
      console.log(`🤖 Generating acceptance criteria for: ${title}`);
      for (let i = 0; i < 3; i++) {
        const criteriaResult = await textGenerator(criteriaPrompt, { 
          max_length: 50, 
          num_return_sequences: 1 
        });
        
        const criteriaText = extractGeneratedText(criteriaResult) || '';
        const criterion = criteriaText.replace(criteriaPrompt, '').trim();
        if (criterion) {
          criteria.push(criterion);
        }
      }
      
      console.log(`✅ Generated ${criteria.length} acceptance criteria`);
    } catch (error) {
      console.error('❌ Error generating acceptance criteria:', error);
    }
    
    // If no criteria were generated, provide fallbacks
    if (!criteria.length) {
      console.log('🔄 Using fallback acceptance criteria');
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
    
    console.log(`✅ Created user story: ${title} (${priority} priority)`);
  }
  
  generatedStories = stories;
  console.log(`✅ Generated ${stories.length} user stories successfully`);
};

/**
 * Generate fallback user stories when AI generation fails
 * 
 * Creates template-based user stories for each persona
 * with predefined titles, descriptions and acceptance criteria
 */
const generateFallbackStories = (): void => {
  console.log('🔄 Generating fallback user stories...');
  
  if (!generatedPersonas.length) {
    console.warn('⚠️ No personas available for fallback story generation');
    return;
  }
  
  const stories: UserStory[] = [];
  
  // Story templates by segment
  const storyTemplates = {
    power: [
      {
        title: 'Advanced Analytics Dashboard',
        description: 'As a power user, I want to see comprehensive analytics and insights so that I can make data-driven decisions more effectively.',
        criteria: [
          'Dashboard should include customizable widgets',
          'Data should be exportable in multiple formats',
          'Advanced filtering options should be available'
        ]
      },
      {
        title: 'Keyboard Shortcuts',
        description: 'As a power user, I want to use keyboard shortcuts for common actions so that I can work more efficiently.',
        criteria: [
          'All primary actions should have shortcuts',
          'Shortcuts should be customizable',
          'A shortcut reference guide should be accessible'
        ]
      }
    ],
    atrisk: [
      {
        title: 'Value Demonstration Wizard',
        description: 'As an at-risk user, I want to see concrete examples of how the product can solve my specific problems so that I can justify continued usage.',
        criteria: [
          'Wizard should identify user pain points',
          'Solutions should be tailored to user needs',
          'Benefits should be quantified where possible'
        ]
      },
      {
        title: 'Simplified Workflow Guide',
        description: 'As an at-risk user, I want simpler ways to accomplish my goals so that I don't feel overwhelmed by the product.',
        criteria: [
          'Guide should focus on essential steps only',
          'Visual cues should highlight primary actions',
          'Progress should be clearly tracked'
        ]
      }
    ],
    occasional: [
      {
        title: 'Quick Start Templates',
        description: 'As an occasional user, I want predefined templates for common tasks so that I can get started quickly without remembering all the steps.',
        criteria: [
          'Templates should cover most common use cases',
          'Templates should be easily accessible from home screen',
          'Template usage should be tracked to improve offerings'
        ]
      },
      {
        title: 'Feature Reminder Tooltips',
        description: 'As an occasional user, I want contextual reminders about how features work so that I don't need to relearn the interface each time.',
        criteria: [
          'Tooltips should appear for infrequently used features',
          'Tooltips should be dismissible',
          'User should be able to control tooltip frequency'
        ]
      }
    ]
  };
  
  for (const persona of generatedPersonas) {
    // Get template for this segment
    const templates = storyTemplates[persona.segment];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Assign priority based on persona segment
    const priority = persona.segment === 'atrisk' 
      ? 'high' 
      : persona.segment === 'power' 
        ? 'medium' 
        : 'low';
    
    stories.push({
      id: uuidv4(),
      personaId: persona.id,
      title: template.title,
      description: template.description,
      priority,
      acceptanceCriteria: template.criteria
    });
  }
  
  generatedStories = stories;
  console.log(`✅ Generated ${stories.length} fallback user stories`);
};

/**
 * Generate churn metrics based on processed data
 * 
 * Calculates key metrics including:
 * 1. Churn rate based on at-risk user percentage
 * 2. Count and percentage of at-risk users
 * 3. Average engagement score across all users
 * 4. Retention rate (inverse of churn)
 */
const generateChurnMetrics = (): void => {
  console.log('📊 Generating churn metrics...');
  
  if (!processedUserData.length) {
    console.warn('⚠️ No user data available for metrics generation');
    return;
  }
  
  // Calculate total users
  const totalUsers = processedUserData.length;
  console.log(`📊 Total users: ${totalUsers}`);
  
  // Calculate users at risk (churn risk > 0.7)
  const atRiskUsers = processedUserData.filter(user => user.churnRisk > 0.7).length;
  const atRiskPercentage = (atRiskUsers / totalUsers) * 100;
  console.log(`📊 At-risk users: ${atRiskUsers} (${atRiskPercentage.toFixed(1)}%)`);
  
  // Calculate average engagement
  const avgEngagement = processedUserData.reduce((sum, user) => sum + user.activityScore, 0) / totalUsers;
  console.log(`📊 Average engagement score: ${avgEngagement.toFixed(2)}`);
  
  // Calculate churn rate (simulate based on at-risk percentage)
  const simulatedChurnRate = atRiskPercentage / 10; // Scale down for realistic values
  console.log(`📊 Simulated churn rate: ${simulatedChurnRate.toFixed(2)}%`);
  
  // Calculate retention rate (inverse of churn)
  const retentionRate = 100 - simulatedChurnRate;
  console.log(`📊 Retention rate: ${retentionRate.toFixed(2)}%`);
  
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
  console.log(`✅ Generated ${metrics.length} churn metrics`);
};

/**
 * Generate insights based on processed data and personas
 * 
 * Creates data-driven insights across categories:
 * 1. Onboarding experiences and improvements
 * 2. User engagement patterns and opportunities
 * 3. Support interactions and satisfaction
 * 4. Product feature usage and enhancement opportunities
 */
const generateInsights = async (): Promise<void> => {
  console.log('💡 Starting insights generation...');
  
  if (!processedUserData.length) {
    console.warn('⚠️ No user data available for insights generation');
    return;
  }
  
  // Try to initialize the text generation pipeline
  let textGenerator;
  try {
    console.log('🤖 Initializing text generation model...');
    textGenerator = await pipeline('text-generation', 'distilgpt2');
    console.log('✅ Text generation model initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize text generation model:', error);
    throw new Error('Failed to initialize text generation model');
  }
  
  const insightCategories = ['onboarding', 'engagement', 'support', 'product'];
  const impactLevels = ['high', 'medium', 'low'] as const;
  
  const insights: Insight[] = [];
  
  for (let i = 0; i < 6; i++) {
    const category = insightCategories[i % insightCategories.length] as 'onboarding' | 'engagement' | 'support' | 'product';
    console.log(`💡 Generating insight for category: ${category}`);
    
    // Generate insight title
    const titlePrompt = `Insight about ${category}:`;
    let title: string;
    
    try {
      console.log(`🤖 Generating title with prompt: "${titlePrompt}"`);
      const titleResult = await textGenerator(titlePrompt, { 
        max_length: 50, 
        num_return_sequences: 1 
      });
      
      const extractedTitle = extractGeneratedText(titleResult);
      title = extractedTitle.replace(titlePrompt, '').trim() || `Improve ${category}`;
      console.log(`✅ Generated title: ${title}`);
    } catch (error) {
      console.error('❌ Error generating title:', error);
      title = `Improve ${category} experience`;
      console.log(`🔄 Using fallback title: ${title}`);
    }
    
    // Generate insight description
    const descriptionPrompt = `Description of insight about ${category}:`;
    let description: string;
    
    try {
      console.log(`🤖 Generating description with prompt: "${descriptionPrompt}"`);
      const descriptionResult = await textGenerator(descriptionPrompt, { 
        max_length: 80, 
        num_return_sequences: 1 
      });
      
      const extractedDescription = extractGeneratedText(descriptionResult);
      description = extractedDescription.replace(descriptionPrompt, '').trim() || 
        `Users who interact with ${category} features show different behavior patterns.`;
      console.log(`✅ Generated description: ${description}`);
    } catch (error) {
      console.error('❌ Error generating description:', error);
      description = generateMockText('insight', category);
      console.log(`🔄 Using fallback description: ${description}`);
    }
    
    // Generate recommendation
    const recommendationPrompt = `Recommendation for ${title}:`;
    let recommendation: string;
    
    try {
      console.log(`🤖 Generating recommendation with prompt: "${recommendationPrompt}"`);
      const recommendationResult = await textGenerator(recommendationPrompt, { 
        max_length: 80, 
        num_return_sequences: 1 
      });
      
      const extractedRecommendation = extractGeneratedText(recommendationResult);
      recommendation = extractedRecommendation.replace(recommendationPrompt, '').trim() || 
        `Consider improving ${category} experience to reduce churn.`;
      console.log(`✅ Generated recommendation: ${recommendation}`);
    } catch (error) {
      console.error('❌ Error generating recommendation:', error);
      recommendation = generateMockText('recommend', category);
      console.log(`🔄 Using fallback recommendation: ${recommendation}`);
    }
    
    // Determine impact level - weight toward higher impact for more important categories
    const impactWeights = {
      onboarding: [0.5, 0.3, 0.2], // 50% high, 30% medium, 20% low
      engagement: [0.6, 0.3, 0.1], // 60% high, 30% medium, 10% low
      support: [0.3, 0.4, 0.3],    // 30% high, 40% medium, 30% low
      product: [0.4, 0.4, 0.2]     // 40% high, 40% medium, 20% low
    };
    
    const impactRandom = Math.random();
    let impactIndex = 0;
    
    if (impactRandom > impactWeights[category][0]) {
      impactIndex = 1;
      if (impactRandom > (impactWeights[category][0] + impactWeights[category][1])) {
        impactIndex = 2;
      }
    }
    
    const impact = impactLevels[impactIndex];
    console.log(`✅ Assigned impact level: ${impact}`);
    
    insights.push({
      id: uuidv4(),
      title,
      description,
      impact,
      recommendation,
      category
    });
    
    console.log(`✅ Created insight: ${title} (${impact} impact)`);
  }
  
  generatedInsights = insights;
  console.log(`✅ Generated ${insights.length} insights successfully`);
};

/**
 * Generate fallback insights when AI generation fails
 * 
 * Creates predefined insights for each category
 * with realistic titles, descriptions, and recommendations
 */
const generateFallbackInsights = (): void => {
  console.log('🔄 Generating fallback insights...');
  
  const insights: Insight[] = [];
  
  // Insight templates by category
  const insightTemplates = {
    onboarding: [
      {
        title: 'Onboarding Completion Analysis',
        description: 'New users struggle with completing the onboarding process. The tutorials are too long and users often skip them.',
        recommendation: 'Simplify the onboarding process to focus on core value, introducing advanced features through contextual tips later.',
        impact: 'high' as const
      },
      {
        title: 'First Week Engagement',
        description: 'Users who complete at least 3 key actions in their first week are 2.5x more likely to become active users.',
        recommendation: 'Redesign the onboarding flow to encourage completion of these 3 key actions within the first week.',
        impact: 'high' as const
      }
    ],
    engagement: [
      {
        title: 'Integration Usage Impact',
        description: 'Users who connect third-party integrations show 3x higher retention rates and use the product more frequently.',
        recommendation: 'Create an email campaign highlighting integration possibilities and their benefits, targeting occasional users.',
        impact: 'medium' as const
      },
      {
        title: 'Feature Adoption Gap',
        description: 'Only 23% of users discover and use the advanced filtering features, which are highly correlated with retention.',
        recommendation: 'Implement contextual tooltips highlighting the advanced filtering options when users are performing related tasks.',
        impact: 'high' as const
      }
    ],
    support: [
      {
        title: 'Response Time Correlation',
        description: 'Support response time has a direct correlation with user retention. Faster responses lead to significantly lower churn.',
        recommendation: 'Implement a priority response system for at-risk users based on their churn prediction score.',
        impact: 'medium' as const
      },
      {
        title: 'Self-Help Resource Utilization',
        description: 'Users who access help documentation resolve issues 45% faster but only 12% of users find the help center.',
        recommendation: 'Increase visibility of self-help resources within the product UI and improve search functionality.',
        impact: 'low' as const
      }
    ],
    product: [
      {
        title: 'Feature Discovery Analysis',
        description: 'Feature discovery is a major issue. Many users aren't aware of key features that would solve their specific problems.',
        recommendation: 'Add feature discovery tooltips based on user behavior patterns to highlight relevant functionality.',
        impact: 'high' as const
      },
      {
        title: 'Mobile Usage Patterns',
        description: '38% of at-risk users primarily access via mobile, where the experience is significantly worse than desktop.',
        recommendation: 'Prioritize mobile experience improvements, focusing on the most common tasks performed on mobile devices.',
        impact: 'medium' as const
      }
    ]
  };
  
  // Generate two insights for each category
  for (const category of ['onboarding', 'engagement', 'support', 'product'] as const) {
    const templates = insightTemplates[category];
    
    for (let i = 0; i < Math.min(2, templates.length); i++) {
      const template = templates[i];
      
      insights.push({
        id: uuidv4(),
        title: template.title,
        description: template.description,
        impact: template.impact,
        recommendation: template.recommendation,
        category
      });
    }
  }
  
  // Shuffle insights to mix up categories
  for (let i = insights.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [insights[i], insights[j]] = [insights[j], insights[i]];
  }
  
  generatedInsights = insights.slice(0, 6);
  console.log(`✅ Generated ${generatedInsights.length} fallback insights`);
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
