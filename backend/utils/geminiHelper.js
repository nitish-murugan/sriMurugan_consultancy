import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

// Search companies using Gemini AI
export const searchCompaniesWithAI = async (domain, city) => {
  try {
    const model = getGeminiModel();
    
    const prompt = `List 5-8 real companies in ${city}, India that are related to the "${domain}" industry/domain. 
    These companies should be suitable for industrial visits by college students.
    
    Return the response as a JSON array with the following structure:
    [
      {
        "name": "Company Name",
        "address": "Full address in ${city}",
        "description": "Brief description of what the company does (1-2 sentences)",
        "type": "Type of company (e.g., Manufacturing, IT Services, Research, etc.)"
      }
    ]
    
    Only return the JSON array, no additional text or markdown formatting.
    If you cannot find real companies, provide realistic fictional examples that would typically exist in ${city} for the ${domain} industry.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      // Remove any markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const companies = JSON.parse(cleanedText);
      
      return {
        success: true,
        companies: companies.map((company, index) => ({
          id: `ai-${Date.now()}-${index}`,
          name: company.name,
          address: company.address,
          description: company.description,
          type: company.type,
          source: 'ai'
        }))
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return {
        success: false,
        error: 'Failed to parse AI response',
        companies: []
      };
    }
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      error: error.message,
      companies: []
    };
  }
};

// Get tourist spots suggestions using Gemini AI
export const searchSpotsWithAI = async (city) => {
  try {
    const model = getGeminiModel();
    
    const prompt = `List 8-10 popular tourist and educational spots in ${city}, India that would be suitable for college student visits.
    Include a mix of historical monuments, museums, educational institutions, parks, and popular attractions.
    
    Return the response as a JSON array with the following structure:
    [
      {
        "name": "Spot Name",
        "type": "Type (tourist/educational/historical/religious/nature)",
        "description": "Brief description (1-2 sentences)",
        "estimatedTime": "Recommended visit duration (e.g., '1-2 hours')"
      }
    ]
    
    Only return the JSON array, no additional text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const spots = JSON.parse(cleanedText);
      
      return {
        success: true,
        spots: spots.map((spot, index) => ({
          id: `ai-spot-${Date.now()}-${index}`,
          name: spot.name,
          type: spot.type,
          description: spot.description,
          estimatedTime: spot.estimatedTime,
          source: 'ai'
        }))
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return {
        success: false,
        error: 'Failed to parse AI response',
        spots: []
      };
    }
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      error: error.message,
      spots: []
    };
  }
};

// Get nearby restaurants using Gemini AI
export const searchRestaurantsWithAI = async (location, city) => {
  try {
    const model = getGeminiModel();
    
    const prompt = `List 5-6 popular restaurants near ${location} in ${city}, India that would be suitable for group dining (college students).
    Include a variety of cuisines and price ranges.
    
    Return the response as a JSON array with the following structure:
    [
      {
        "name": "Restaurant Name",
        "cuisine": "Type of cuisine",
        "priceRange": "Budget/Moderate/Premium",
        "rating": A number between 3.5 and 5.0,
        "description": "Brief description including specialty dishes"
      }
    ]
    
    Only return the JSON array, no additional text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const restaurants = JSON.parse(cleanedText);
      
      return {
        success: true,
        restaurants: restaurants.map((restaurant, index) => ({
          id: `ai-rest-${Date.now()}-${index}`,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          priceRange: restaurant.priceRange,
          rating: restaurant.rating,
          description: restaurant.description,
          source: 'ai'
        }))
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return {
        success: false,
        error: 'Failed to parse AI response',
        restaurants: []
      };
    }
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      error: error.message,
      restaurants: []
    };
  }
};

// Get AI suggestions for company visits based on institution
export const getCompanyVisitSuggestions = async (city, institutionType, department) => {
  try {
    const model = getGeminiModel();
    
    const institutionTypeMap = {
      'engineering': 'Engineering College',
      'arts_science': 'Arts & Science College',
      'polytechnic': 'Polytechnic',
      'school': 'School',
      'university': 'University',
      'other': 'Educational Institution'
    };

    const institutionName = institutionTypeMap[institutionType] || 'Educational Institution';
    const deptInfo = department ? ` from ${department} department` : '';
    
    const prompt = `As an industrial visit coordinator, suggest the best companies and industries to visit in ${city}, India for students${deptInfo} from a ${institutionName}.

    Consider:
    1. Educational value and learning opportunities
    2. Relevance to the students' field of study
    3. Availability of facilities for student visits
    4. Industry exposure and career insights
    
    Provide a brief recommendation (2-3 paragraphs) explaining:
    - Which types of companies/industries would be most beneficial
    - What students can learn from these visits
    - Any specific companies in ${city} that are known for hosting student visits
    
    Be specific, practical, and focus on real opportunities in ${city}.`;

    console.log('Calling Gemini API for company suggestions...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API response received successfully');
    
    return {
      success: true,
      suggestion: text.trim()
    };
  } catch (error) {
    console.error('Gemini AI Error in getCompanyVisitSuggestions:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message || 'Failed to generate AI suggestions',
      suggestion: ''
    };
  }
};
