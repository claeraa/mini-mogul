import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { AiError } from './director.ts'
import type { Provider } from './director.ts'

/**
 * The one real LLM provider: Claude through the Anthropic API.
 *
 * The API key is read from the server's environment only. It is never sent
 * to the browser and never included in the built site.
 */

export type AiEnv = {
  ANTHROPIC_API_KEY?: string
  /** Optional override, e.g. a smaller, cheaper model. */
  AI_MODEL?: string
}

const DEFAULT_MODEL = 'claude-opus-5-5'

/** How long one attempt may take, and how many times the SDK may retry. */
const TIMEOUT_MS = 20_000
const MAX_RETRIES = 1

/** Returns null when no key is set, which switches the game to its fallback. */
export function createAnthropicProvider(env: AiEnv): Provider | null {
  const apiKey = env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) return null

  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: MAX_RETRIES })
  const model = env.AI_MODEL?.trim() || DEFAULT_MODEL

  return {
    name: 'anthropic',
    model,
    async complete({ system, user, schema }) {
      try {
        const response = await client.messages.parse({
          model,
          // Room for the model's thinking as well as its short JSON reply.
          max_tokens: 4096,
          system,
          messages: [{ role: 'user', content: user }],
          output_config: {
            // These are small, quick creative choices; a child is waiting.
            effort: 'low',
            format: zodOutputFormat(schema),
          },
        })
        if (response.stop_reason === 'refusal') throw new AiError('refused')
        if (response.stop_reason === 'max_tokens' || response.parsed_output == null) {
          throw new AiError('invalid_reply')
        }
        return response.parsed_output
      } catch (error) {
        if (error instanceof AiError) throw error
        if (
          error instanceof Anthropic.AuthenticationError ||
          error instanceof Anthropic.PermissionDeniedError
        ) {
          throw new AiError('auth')
        }
        if (error instanceof Anthropic.RateLimitError) throw new AiError('rate_limited')
        if (error instanceof Anthropic.APIConnectionTimeoutError) throw new AiError('timeout')
        if (error instanceof Anthropic.APIConnectionError) throw new AiError('unavailable')
        if (error instanceof Anthropic.APIError) throw new AiError('unavailable')
        // The SDK could not parse or validate the reply against the schema.
        throw new AiError('invalid_reply')
      }
    },
  }
}
