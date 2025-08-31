/**
 * 🚀 Vercel Edge Function Integration
 * Deploy .faf-engine to Vercel's global edge network
 */

import { FafEngine } from '../core/FafEngine';
import { VercelAdapter } from '../adapters/VercelAdapter';
import type { FafData } from '../types';

// Vercel types - can be installed separately if needed
interface VercelRequest {
  method?: string;
  query: Record<string, string | string[]>;
  body: any;
  headers: Record<string, string>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): VercelResponse;
  end(): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
}

/**
 * Vercel Edge Function Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for web access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const engine = new FafEngine({
      platform: 'vercel',
      adapter: new VercelAdapter({ request: req })
    });
    
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, engine);
      case 'POST':
        return handlePost(req, res, engine);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Vercel handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/faf-engine
 * Returns engine info and capabilities
 */
async function handleGet(req: VercelRequest, res: VercelResponse, engine: FafEngine) {
  const { action } = req.query;
  
  switch (action) {
    case 'version':
      return res.json({
        version: engine.getVersion(),
        platform: engine.getPlatform(),
        capabilities: [
          'context-on-demand',
          'fab-formats',
          'scoring',
          'validation',
          'yaml-generation'
        ]
      });
      
    case 'health':
      return res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
      
    default:
      return res.json({
        name: '.faf-engine Mk-1',
        version: engine.getVersion(),
        platform: 'vercel',
        endpoints: {
          'GET /api/faf-engine?action=version': 'Get engine version and capabilities',
          'GET /api/faf-engine?action=health': 'Health check',
          'POST /api/faf-engine/generate': 'Generate Context-On-Demand',
          'POST /api/faf-engine/validate': 'Validate .faf data',
          'POST /api/faf-engine/score': 'Calculate .faf score'
        }
      });
  }
}

/**
 * POST /api/faf-engine
 * Process .faf operations
 */
async function handlePost(req: VercelRequest, res: VercelResponse, engine: FafEngine) {
  const { action } = req.query;
  const body = req.body;
  
  switch (action) {
    case 'generate':
      return handleGenerate(body, res, engine);
      
    case 'validate':
      return handleValidate(body, res, engine);
      
    case 'score':
      return handleScore(body, res, engine);
      
    case 'enhance':
      return handleEnhance(body, res, engine);
      
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

/**
 * Generate Context-On-Demand from project structure
 */
async function handleGenerate(
  _body: { projectData?: any; files?: any[] },
  res: VercelResponse,
  engine: FafEngine
): Promise<VercelResponse> {
  try {
    // Generate context from provided data
    const result = await engine.generateContext();
    
    return res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed'
    });
  }
}

/**
 * Validate .faf data structure
 */
function handleValidate(
  body: { fafData: FafData },
  res: VercelResponse,
  engine: FafEngine
): VercelResponse {
  if (!body.fafData) {
    return res.status(400).json({ error: 'Missing fafData in request body' });
  }
  
  const validation = engine.validate(body.fafData);
  
  return res.json({
    success: validation.valid,
    validation,
    timestamp: new Date().toISOString()
  });
}

/**
 * Calculate .faf score
 */
function handleScore(
  body: { fafData: FafData },
  res: VercelResponse,
  engine: FafEngine
): VercelResponse {
  if (!body.fafData) {
    return res.status(400).json({ error: 'Missing fafData in request body' });
  }
  
  const score = engine.score(body.fafData);
  
  return res.json({
    success: true,
    score,
    timestamp: new Date().toISOString()
  });
}

/**
 * Enhance existing .faf with AI
 */
async function handleEnhance(
  body: { fafData: FafData; apiKey?: string },
  res: VercelResponse,
  engine: FafEngine
): Promise<VercelResponse> {
  if (!body.fafData) {
    return res.status(400).json({ error: 'Missing fafData in request body' });
  }
  
  // This would integrate with OpenAI if API key provided
  // For now, return enhanced version with recommendations
  const validation = engine.validate(body.fafData);
  const score = engine.score(body.fafData);
  
  return res.json({
    success: true,
    original: body.fafData,
    score,
    recommendations: validation.suggestions,
    enhancements: {
      available: !!body.apiKey,
      message: body.apiKey 
        ? 'AI enhancement available with provided API key'
        : 'Provide OpenAI API key for AI-powered enhancements'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Export for Vercel configuration
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  },
  runtime: 'edge',
  regions: ['iad1'] // Start with US East, expand globally
};