import { generateObject } from 'ai'
import { z } from 'zod'

const extractionSchema = z.object({
  scope_summary: z.string().describe('A concise 1-3 sentence summary of the contract scope/object in French'),
  contact: z.string().nullable().describe('Contact name, email, phone, or service mentioned for this tender, or null if none found'),
  submission_method: z.string().nullable().describe('How/where to submit a response (platform name, URL, postal address), or null if none found'),
})

export const DEFAULT_LLM_MODEL = 'openai/gpt-4o-mini'

export interface ExtractedFields {
  scope_summary: string | null
  contact: string | null
  submission_method: string | null
}

// US-5.2: derive scope_summary/contact/submission_method from the raw BOAMP
// payload via LLM. `model` is the org's chosen AI Gateway model string.
// Returns nulls on any failure so sync isn't blocked.
export async function extractTenderInfo(rawData: Record<string, unknown>, model: string): Promise<ExtractedFields> {
  try {
    const { object } = await generateObject({
      model,
      schema: extractionSchema,
      prompt: `Voici les données brutes d'un avis de marché public français (JSON). Extrait un résumé de l'objet du marché, les informations de contact, et les modalités de soumission des candidatures.\n\n${JSON.stringify(rawData).slice(0, 8000)}`,
    })

    return object
  } catch (error) {
    console.error('[boamp/extract] extraction failed', error)
    return { scope_summary: null, contact: null, submission_method: null }
  }
}
