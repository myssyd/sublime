import type { ZodType } from "zod"
import { internal } from "../_generated/api"
import type { ActionCtx } from "../_generated/server"

export const TERRA_MODEL = "openai/gpt-5.6-terra"

export type TerraContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

type TerraUsageOperation = "character_intent" | "picture_intent"

type OpenRouterStructuredCompletion = {
  id?: string
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

function completionText(completion: OpenRouterStructuredCompletion) {
  const content = completion.choices?.[0]?.message?.content
  if (typeof content === "string") return content.trim()
  if (!Array.isArray(content)) return ""
  return content
    .flatMap((part) =>
      part.type === "text" && typeof part.text === "string" ? [part.text] : []
    )
    .join("\n")
    .trim()
}

function stripJsonFence(raw: string) {
  return raw
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
}

export async function callTerraStructured<T>(
  ctx: ActionCtx,
  args: {
    userId: string
    operation: TerraUsageOperation
    systemPrompt: string
    userContent: string | TerraContentPart[]
    responseFormat: Record<string, unknown>
    schema: ZodType<T>
    maxCompletionTokens: number
    errorLabel: string
  }
): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured")

  const startedAt = Date.now()
  let providerRecorded = false
  let responseId: string | undefined
  try {
    const providerResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: TERRA_MODEL,
          messages: [
            { role: "system", content: args.systemPrompt },
            { role: "user", content: args.userContent },
          ],
          reasoning: { effort: "low", exclude: true },
          max_completion_tokens: args.maxCompletionTokens,
          response_format: args.responseFormat,
          usage: { include: true },
        }),
      }
    )
    if (!providerResponse.ok) {
      const detail = await providerResponse.text()
      throw new Error(
        `${args.errorLabel} error: ${providerResponse.status} ${detail.slice(0, 400)}`
      )
    }

    const completion =
      (await providerResponse.json()) as OpenRouterStructuredCompletion
    responseId = completion.id
    const raw = completionText(completion)
    if (!raw) throw new Error(`${args.errorLabel} returned no result`)
    const value = args.schema.parse(JSON.parse(stripJsonFence(raw)))

    await ctx.runMutation(internal.credits.recordUnbilledProviderUsage, {
      userId: args.userId,
      operation: args.operation,
      provider: "openrouter",
      model: TERRA_MODEL,
      status: "completed",
      providerRequestId: completion.id,
      inputTokens: completion.usage?.prompt_tokens,
      outputTokens: completion.usage?.completion_tokens,
      elapsedMs: Date.now() - startedAt,
    })
    providerRecorded = true
    return value
  } catch (error) {
    if (!providerRecorded) {
      await ctx
        .runMutation(internal.credits.recordUnbilledProviderUsage, {
          userId: args.userId,
          operation: args.operation,
          provider: "openrouter",
          model: TERRA_MODEL,
          status: "failed",
          providerRequestId: responseId,
          elapsedMs: Date.now() - startedAt,
        })
        .catch(() => undefined)
    }
    throw error
  }
}
