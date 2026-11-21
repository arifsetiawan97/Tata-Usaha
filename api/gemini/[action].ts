import { applyCorsHeaders } from '../../src/server/cloudDb.mjs';
import {
  handleAnalyzeAnnual,
  handleAnalyzeInventory,
  handleAnalyzeMonthly,
  handleAssistant,
  handleAuditDocument,
  handleDraftTask,
  handleGenerateTaskDescription,
  handleSuggestCategories
} from '../../src/server/geminiHandlers.mjs';

function parseBody(raw: any): any {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const queryAction = Array.isArray(req.query?.action) ? req.query.action[0] : req.query?.action;
  const fallbackAction =
    typeof req.url === 'string' ? req.url.split('?')[0].split('/').pop() || '' : '';
  const action = (queryAction || fallbackAction || '').trim();
  const body = parseBody(req.body);

  try {
    if (action === 'analyze-monthly') {
      return res.status(200).json(await handleAnalyzeMonthly(body));
    }
    if (action === 'analyze-annual') {
      return res.status(200).json(await handleAnalyzeAnnual(body));
    }
    if (action === 'draft-task') {
      return res.status(200).json(await handleDraftTask(body));
    }
    if (action === 'suggest-categories') {
      return res.status(200).json(await handleSuggestCategories(body));
    }
    if (action === 'analyze-inventory') {
      return res.status(200).json(await handleAnalyzeInventory(body));
    }
    if (action === 'generate-task-description') {
      const result = await handleGenerateTaskDescription(body);
      return res.status(result.status).json(result.payload);
    }
    if (action === 'audit-document') {
      return res.status(200).json(await handleAuditDocument(body));
    }
    if (action === 'assistant') {
      return res.status(200).json(await handleAssistant(body));
    }
    return res.status(404).json({ error: `Endpoint AI tidak ditemukan: ${action}` });
  } catch (err) {
    console.error(`POST /api/gemini/${action} error:`, err);
    return res.status(500).json({ error: 'Terjadi kesalahan pemrosesan AI' });
  }
}
