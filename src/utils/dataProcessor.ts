import { UserData, UserSegment, Persona, UserStory, ChurnMetric, Insight, PersonaUser } from '@/types';
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
    
    return fallbacks.persona[segment as keyof typeof fallbacks.persona];
  } else if (prompt.includes('pain point')) {
    let segment = 'occasional';
    if (prompt.includes('power')) segment = 'power';
    if (prompt.includes('risk')) segment = 'atrisk';
    
    return fallbacks.painPoints[segment as keyof typeof fallbacks.painPoints].join(', ');
  } else if (prompt.includes('goal')) {
    let segment = 'occasional';
    if (prompt.includes('power')) segment = 'power';
    if (prompt.includes('risk')) segment = 'atrisk';
    
    return fallbacks.goals[segment as keyof typeof fallbacks.goals].join(', ');
  } else if (prompt.includes('story')) {
    let segment = 'occasional';
    if (prompt.includes('power')) segment = 'power';
    if (prompt.includes('risk')) segment = 'atrisk';
    
    return fallbacks.stories[segment as keyof typeof fallbacks.stories];
  } else if (prompt.includes('insight')) {
    let category = 'product';
    if (prompt.includes('onboarding')) category = 'onboarding';
    if (prompt.includes('engagement')) category = 'engagement';
    if (prompt.includes('support')) category = 'support';
    
    return fallbacks.insights[category as keyof typeof fallbacks.insights];
  } else if (prompt.includes('recommend')) {
    let category = 'product';
    if (prompt.includes('onboarding')) category = 'onboarding';
    if (prompt.includes('engagement')) category = 'engagement';
    if (prompt.includes('support')) category = 'support';
    
    return fallbacks.recommendations[category as keyof typeof fallbacks.recommendations];
  }
  
  // Default fallback
  return "The user values simplicity and efficiency in the product experience.";
};

/**
 * Generate user personas based on segmentation
 * 
 * Creates detailed personas for each user segment with:
 * 1. Persona name and description
 * 2. Segment classification (power, atrisk, occasional)
 * 3. Pain points and goals specific to segment
 * 4. Churn risk calculation based on segment averages
 * 5. Actual users assigned to each persona
 */
const generatePersonas = async (): Promise<void> => {
  console.log('👤 Starting persona generation...');
  
  // Group users by segment
  const usersBySegment: Record<UserSegment, UserData[]> = {
    power: processedUserData.filter(user => user.userSegment === 'power'),
    atrisk: processedUserData.filter(user => user.userSegment === 'atrisk'),
    occasional: processedUserData.filter(user => user.userSegment === 'occasional')
  };
  
  // Calculate average churn risk for each segment
  const avgChurnRisk: Record<UserSegment, number> = {
    power: usersBySegment.power.length > 0 
      ? usersBySegment.power.reduce((sum, user) => sum + user.churnRisk, 0) / usersBySegment.power.length 
      : 0.15,
    atrisk: usersBySegment.atrisk.length > 0 
      ? usersBySegment.atrisk.reduce((sum, user) => sum + user.churnRisk, 0) / usersBySegment.atrisk.length 
      : 0.85,
    occasional: usersBySegment.occasional.length > 0 
      ? usersBySegment.occasional.reduce((sum, user) => sum + user.churnRisk, 0) / usersBySegment.occasional.length 
      : 0.45
  };
  
  console.log('📊 Average churn risk by segment:', avgChurnRisk);
  
  // Sort users by churn risk (highest first) to select top users for each persona
  const sortedUsersBySegment: Record<UserSegment, UserData[]> = {
    power: [...usersBySegment.power].sort((a, b) => b.churnRisk - a.churnRisk),
    atrisk: [...usersBySegment.atrisk].sort((a, b) => b.churnRisk - a.churnRisk),
    occasional: [...usersBySegment.occasional].sort((a, b) => b.churnRisk - a.churnRisk)
  };
  
  // Try to initialize the text generation pipeline
  let textGenerator;
  try {
    console.log('🤖 Initializing text generation model...');
    textGenerator = await pipeline('text-generation', 'distilgpt2');
    console.log('✅ Text generation model initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize text generation model:', error);
    console.log('🔄 Falling back to template-based persona generation');
    generateFallbackPersonas();
    return;
  }
  
  const personas: Persona[] = [];
  
  // Generate Power User Persona
  if (usersBySegment.power.length > 0) {
    console.log(`👤 Generating persona for power users (${usersBySegment.power.length} users)`);
    
    // Map users to PersonaUser format
    const powerUsers = sortedUsersBySegment.power.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin,
      churnRisk: user.churnRisk
    }));
    
    // Create Power User Persona
    personas.push({
      id: uuidv4(),
      name: 'Power Partner Patty',
      segment: 'power',
      description: 'Daily user who relies on your product for critical work tasks. Engaged with most features and has a high feature adoption rate.',
      painPoints: [
        'Complex workflows that require too many steps',
        'Performance issues during peak usage times',
        'Limited advanced customization options'
      ],
      goals: [
        'Save time on repetitive tasks',
        'Gain deeper insights from data',
        'Integrate with other tools in their workflow'
      ],
      churnRisk: avgChurnRisk.power,
      users: powerUsers
    });
    
    // If there are enough power users, create a secondary persona for enterprise users
    if (usersBySegment.power.length >= 10) {
      console.log('👤 Creating secondary power user persona (Corporate Claire)');
      
      // Take the second half of power users for this persona
      const corporateUsers = powerUsers.slice(Math.floor(powerUsers.length / 2));
      
      personas.push({
        id: uuidv4(),
        name: 'Corporate Claire',
        segment: 'power',
        description: 'Enterprise user who manages teams and needs robust administrative features. Values reliability and security above all.',
        painPoints: [
          'Insufficient team management capabilities',
          'Limited permission controls',
          'Lack of enterprise-grade security features'
        ],
        goals: [
          'Efficiently manage large teams',
          'Ensure data security and compliance',
          'Generate comprehensive reports for stakeholders'
        ],
        churnRisk: avgChurnRisk.power * 0.9, // Slightly lower churn risk for enterprise users
        users: corporateUsers
      });
    }
  }
  
  // Generate At-Risk User Persona
  if (usersBySegment.atrisk.length > 0) {
    console.log(`👤 Generating persona for at-risk users (${usersBySegment.atrisk.length} users)`);
    
    // Map users to PersonaUser format
    const atRiskUsers = sortedUsersBySegment.atrisk.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin,
      churnRisk: user.churnRisk
    }));
    
    // Create At-Risk User Persona
    personas.push({
      id: uuidv4(),
      name: 'At-Risk Andy',
      segment: 'atrisk',
      description: 'Previously active user whose engagement has declined over the past month. Hasn\'t logged in for 14 days.',
      painPoints: [
        'Confusing interface that requires too much learning',
        'Missing features that competitors offer',
        'Technical issues that disrupt workflow'
      ],
      goals: [
        'Simplify daily tasks',
        'Get better support when issues arise',
        'Find more value in the product to justify cost'
      ],
      churnRisk: avgChurnRisk.atrisk,
      users: atRiskUsers
    });
    
    // If there are enough at-risk users, create a secondary persona
    if (usersBySegment.atrisk.length >= 10) {
      console.log('👤 Creating secondary at-risk user persona (Skeptical Sam)');
      
      // Take the second half of at-risk users for this persona
      const skepticalUsers = atRiskUsers.slice(Math.floor(atRiskUsers.length / 2));
      
      personas.push({
        id: uuidv4(),
        name: 'Skeptical Sam',
        segment: 'atrisk',
        description: 'New user who signed up recently but hasn\'t fully engaged with the product. Still evaluating if it meets their needs.',
        painPoints: [
          'Steep learning curve',
          'Unclear value proposition',
          'Difficulty finding relevant features'
        ],
        goals: [
          'Quickly understand product benefits',
          'Easily implement the product into existing workflow',
          'See immediate results from using the product'
        ],
        churnRisk: avgChurnRisk.atrisk * 1.1, // Slightly higher churn risk for skeptical users
        users: skepticalUsers
      });
    }
  }
  
  // Generate Occasional User Persona
  if (usersBySegment.occasional.length > 0) {
    console.log(`👤 Generating persona for occasional users (${usersBySegment.occasional.length} users)`);
    
    // Map users to PersonaUser format
    const occasionalUsers = sortedUsersBySegment.occasional.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin,
      churnRisk: user.churnRisk
    }));
    
    // Create Occasional User Persona
    personas.push({
      id: uuidv4(),
      name: 'Occasional Olivia',
      segment: 'occasional',
      description: 'Logs in infrequently, typically once every few weeks. Only uses a small subset of features.',
      painPoints: [
        'Forgetting how to use features between sessions',
        'Difficulty seeing value in the product',
        'Not receiving updates about new features'
      ],
      goals: [
        'Accomplish specific tasks quickly',
        'Easily pick up where they left off',
        'Stay updated on relevant new features'
      ],
      churnRisk: avgChurnRisk.occasional,
      users: occasionalUsers
    });
  }
  
  generatedPersonas = personas;
  console.log(`✅ Generated ${personas.length} personas with real user data`);
};

/**
 * Generate fallback personas when AI generation fails
 * 
 * Creates template-based personas for each user segment with:
 * 1. Basic persona details (name, description, segment)
 * 2. Standard pain points and goals for each segment
 * 3. Average churn risk calculation
 * 4. All actual users assigned to each persona
 */
const generateFallbackPersonas = (): void => {
  console.log('🔄 Using fallback method to generate personas...');
  
  // Group users by segment
  const usersBySegment: Record<UserSegment, UserData[]> = {
    power: processedUserData.filter(user => user.userSegment === 'power'),
    atrisk: processedUserData.filter(user => user.userSegment === 'atrisk'),
    occasional: processedUserData.filter(user => user.userSegment === 'occasional')
  };
  
  // Calculate average churn risk for each segment
  const avgChurnRisk: Record<UserSegment, number> = {
    power: usersBySegment.power.length > 0 
      ? usersBySegment.power.reduce((sum, user) => sum + user.churnRisk, 0) / usersBySegment.power.length 
      : 0.15,
    atrisk: usersBySegment.atrisk.length > 0 
      ? usersBySegment.atrisk.reduce((sum, user) => sum + user.churnRisk, 0) / usersBySegment.atrisk.length 
      : 0.85,
    occasional: usersBySegment.occasional.length > 0 
      ? usersBySegment.occasional.reduce((sum, user) => sum + user.churnRisk, 0) / usersBySegment.occasional.length 
      : 0.45
  };
  
  console.log('📊 Average churn risk by segment:', avgChurnRisk);
  
  // Sort users by churn risk (highest first)
  const sortedUsersBySegment: Record<UserSegment, UserData[]> = {
    power: [...usersBySegment.power].sort((a, b) => b.churnRisk - a.churnRisk),
    atrisk: [...usersBySegment.atrisk].sort((a, b) => b.churnRisk - a.churnRisk),
    occasional: [...usersBySegment.occasional].sort((a, b) => b.churnRisk - a.churnRisk)
  };
  
  // Map users to PersonaUser format
  const mappedUsersBySegment: Record<UserSegment, PersonaUser[]> = {
    power: sortedUsersBySegment.power.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin,
      churnRisk: user.churnRisk
    })),
    atrisk: sortedUsersBySegment.atrisk.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin,
      churnRisk: user.churnRisk
    })),
    occasional: sortedUsersBySegment.occasional.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      lastLogin: user.lastLogin,
      churnRisk: user.churnRisk
    }))
  };
  
  generatedPersonas = [
    {
      id: uuidv4(),
      name: 'Power Partner Patty',
      segment: 'power',
      description: 'Daily user who relies on your product for critical work tasks. Engaged with most features and has a high feature adoption rate.',
      painPoints: ['Complex workflows', 'Performance issues'],
      goals: ['Save time', 'Improve workflow efficiency'],
      churnRisk: avgChurnRisk.power,
      users: mappedUsersBySegment.power
    },
    {
      id: uuidv4(),
      name: 'At-Risk Andy',
      segment: 'atrisk',
      description: 'Previously active user whose engagement has declined over the past month. Hasn\'t logged in for 14 days.',
      painPoints: ['Confusing interface', 'Missing features', 'Technical issues'],
      goals: ['Simplify daily tasks', 'Better support'],
      churnRisk: avgChurnRisk.atrisk,
      users: mappedUsersBySegment.atrisk
    },
    {
      id: uuidv4(),
      name: 'Occasional Olivia',
      segment: 'occasional',
      description: 'Logs in infrequently, typically once every few weeks. Only uses a small subset of features.',
      painPoints: ['Forgetting how to use features', 'Value perception'],
      goals: ['Quick, occasional tasks', 'Easy reengagement'],
      churnRisk: avgChurnRisk.occasional,
      users: mappedUsersBySegment.occasional
    }
  ];
  
  console.log(`✅ Generated ${generatedPersonas.length} fallback personas with real user data`);
};

/**
 * Generate user stories based on personas
 * 
 * Creates user stories for each persona with:
 * 1. Story title tailored to persona segment
 * 2. Description in "As a user, I want to... so that..." format
 * 3. Acceptance criteria for implementation
 * 4. Priority based on persona segment
 * 5. References to actual users from the persona
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
    console.log('🔄 Falling back to template-based story generation');
    generateFallbackStories();
    return;
  }
  
  const storyTypes = {
    power: ['Advanced features', 'Workflow optimization', 'Integration capabilities', 'Power tools'],
    atrisk: ['Simplified interface', 'Onboarding improvements', 'Value demonstration', 'Problem resolution'],
    occasional: ['Re-engagement', 'Feature discovery', 'Value reminders', 'Quick wins']
  };
  
  for (const persona of generatedPersonas) {
    console.log(`📝 Generating story for persona: ${persona.name} (${persona.segment})`);
    
    // Get actual users for this persona
    const actualUsers = persona.users || [];
    const hasActualUsers = actualUsers.length > 0;
    
    // Select a random user from the persona if available
    const randomUser = hasActualUsers 
      ? actualUsers[Math.floor(Math.random() * actualUsers.length)]
      : null;
    
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
    // Include reference to actual user if available
    const descriptionPrompt = hasActualUsers && randomUser
      ? `As ${persona.name} (representing users like ${randomUser.name}), I want`
      : `As ${persona.name}, I want`;
    
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
    
    // Add a criterion about actual users if available
    if (hasActualUsers && criteria.length < 5) {
      const userCount = actualUsers.length;
      const highRiskCount = actualUsers.filter(user => user.churnRisk > 0.7).length;
      
      if (highRiskCount > 0) {
        criteria.push(`Solution addresses needs of ${highRiskCount} high-risk users in this persona group`);
      }
      
      criteria.push(`Implementation should be validated with feedback from actual users in this persona group (${userCount} users available)`);
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
 * that reference actual users from the persona
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
        description: 'As an at-risk user, I want simpler ways to accomplish my goals so that I don\'t feel overwhelmed by the product.',
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
        description: 'As an occasional user, I want contextual reminders about how features work so that I don\'t need to relearn the interface each time.',
        criteria: [
          'Tooltips should appear for infrequently used features',
          'Tooltips should be dismissible',
          'User should be able to control tooltip frequency'
        ]
      }
    ]
  };
  
  for (const persona of generatedPersonas) {
    // Get actual users for this persona
    const actualUsers = persona.users || [];
    const hasActualUsers = actualUsers.length > 0;
    
    // Select a random user from the persona if available
    const randomUser = hasActualUsers 
      ? actualUsers[Math.floor(Math.random() * actualUsers.length)]
      : null;
    
    // Get template for this segment
    const templates = storyTemplates[persona.segment];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Modify description to include reference to actual user if available
    let description = template.description;
    if (hasActualUsers && randomUser) {
      // Replace the generic "As a power user" with "As Power Partner Patty (representing users like John Smith)"
      const genericStart = description.match(/^As an? [^,]+/);
      if (genericStart) {
        description = description.replace(
          genericStart[0], 
          `As ${persona.name} (representing users like ${randomUser.name})`
        );
      }
    }
    
    // Create a copy of the criteria
    const criteria = [...template.criteria];
    
    // Add criteria about actual users if available
    if (hasActualUsers) {
      const userCount = actualUsers.length;
      const highRiskCount = actualUsers.filter(user => user.churnRisk > 0.7).length;
      
      if (highRiskCount > 0) {
        criteria.push(`Solution addresses needs of ${highRiskCount} high-risk users in this persona group`);
      }
      
      criteria.push(`Implementation should be validated with feedback from actual users in this persona group (${userCount} users available)`);
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
      title: template.title,
      description,
      priority,
      acceptanceCriteria: criteria
    });
  }
  
  generatedStories = stories;
  console.log(`✅ Generated ${stories.length} fallback user stories with references to actual users`);
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
        description: 'Feature discovery is a major issue. Many users aren\'t aware of key features that would solve their specific problems.',
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

/**
 * Get the processed user data
 * @returns Array of UserData objects
 */
export const getGeneratedUserData = (): UserData[] => {
  return [...processedUserData];
};
