import Company from '../models/Company.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseHelper.js';
import { searchCompaniesWithAI, getCompanyVisitSuggestions } from '../utils/geminiHelper.js';

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
export const getCompanies = async (req, res) => {
  try {
    const { domain, city, search, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };
    
    if (domain) query.domain = new RegExp(domain, 'i');
    if (city) query.city = new RegExp(city, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { domain: new RegExp(search, 'i') }
      ];
    }

    const companies = await Company.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(query);

    sendSuccess(res, 'Companies fetched', {
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Search companies with AI
// @route   POST /api/companies/search
// @access  Public
export const searchCompanies = async (req, res) => {
  try {
    const { domain, city } = req.body;

    if (!domain || !city) {
      return sendError(res, 'Domain and city are required');
    }

    // First, get companies from database
    const dbCompanies = await Company.find({
      domain: new RegExp(domain, 'i'),
      city: new RegExp(city, 'i'),
      isActive: true
    }).limit(10);

    // Then, try to get AI suggestions
    let aiCompanies = [];
    try {
      const aiResult = await searchCompaniesWithAI(domain, city);
      if (aiResult.success) {
        aiCompanies = aiResult.companies;
      }
    } catch (aiError) {
      console.error('AI search failed:', aiError);
      // Continue with DB results only
    }

    // Combine results, DB companies first
    const allCompanies = [
      ...dbCompanies.map(c => ({
        id: c._id,
        name: c.name,
        address: c.address,
        description: c.description,
        domain: c.domain,
        source: 'database'
      })),
      ...aiCompanies
    ];

    sendSuccess(res, 'Companies search results', {
      companies: allCompanies,
      sources: {
        database: dbCompanies.length,
        ai: aiCompanies.length
      }
    });
  } catch (error) {
    console.error('Search companies error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Public
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return sendNotFound(res, 'Company not found');
    }

    sendSuccess(res, 'Company fetched', company);
  } catch (error) {
    console.error('Get company error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Create company (Admin)
// @route   POST /api/companies
// @access  Private (Admin)
export const createCompany = async (req, res) => {
  try {
    const { name, domain, city, address, description, contactEmail, contactPhone, website } = req.body;

    const company = await Company.create({
      name,
      domain: domain.toLowerCase(),
      city,
      address,
      description,
      contactEmail,
      contactPhone,
      website,
      source: 'manual'
    });

    sendCreated(res, 'Company created successfully', company);
  } catch (error) {
    console.error('Create company error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Update company (Admin)
// @route   PUT /api/companies/:id
// @access  Private (Admin)
export const updateCompany = async (req, res) => {
  try {
    const { name, domain, city, address, description, contactEmail, contactPhone, website, isActive } = req.body;

    let company = await Company.findById(req.params.id);
    if (!company) {
      return sendNotFound(res, 'Company not found');
    }

    company = await Company.findByIdAndUpdate(
      req.params.id,
      { name, domain: domain?.toLowerCase(), city, address, description, contactEmail, contactPhone, website, isActive },
      { new: true, runValidators: true }
    );

    sendSuccess(res, 'Company updated successfully', company);
  } catch (error) {
    console.error('Update company error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Delete company (Admin)
// @route   DELETE /api/companies/:id
// @access  Private (Admin)
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return sendNotFound(res, 'Company not found');
    }

    await Company.findByIdAndDelete(req.params.id);

    sendSuccess(res, 'Company deleted successfully');
  } catch (error) {
    console.error('Delete company error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get unique domains
// @route   GET /api/companies/domains
// @access  Public
export const getDomains = async (req, res) => {
  try {
    const domains = await Company.distinct('domain', { isActive: true });
    sendSuccess(res, 'Domains fetched', domains.sort());
  } catch (error) {
    console.error('Get domains error:', error);
    sendError(res, error.message, 500);
  }
};

// @desc    Get AI suggestions for company visits
// @route   POST /api/companies/ai-suggest
// @access  Private
export const getAISuggestions = async (req, res) => {
  try {
    const { city, institutionType, department } = req.body;

    console.log('AI Suggest Request:', { city, institutionType, department });

    if (!city || !institutionType) {
      return sendError(res, 'City and institution type are required', 400);
    }

    const result = await getCompanyVisitSuggestions(city, institutionType, department);

    console.log('AI Suggest Result:', { success: result.success, hasError: !!result.error });

    if (!result.success) {
      console.error('AI suggestion failed:', result.error);
      return sendError(res, result.error || 'Failed to get AI suggestions', 500);
    }

    sendSuccess(res, 'AI suggestions generated', { suggestion: result.suggestion });
  } catch (error) {
    console.error('AI suggestions error:', error.message, error.stack);
    sendError(res, error.message, 500);
  }
};
