import { describe, expect, test } from "bun:test"
import {
  buildCharacterIntentUserMessage,
  CHARACTER_INTENT_SYSTEM_PROMPT,
  renderFullBodyCharacterIntent,
  renderHeroCharacterIntent,
  renderStoredIdentityPrompt,
  type CharacterIntent,
} from "./characterIntent"

const intent: CharacterIntent = {
  adultStatus: "adult",
  characterConcept: "retired competitive swimmer",
  identityDescription:
    "Woman in her late twenties with warm olive skin, dark curls, and brown eyes.",
  bodyDescription: "Athletic build with broad swimmer's shoulders.",
  stablePresentation: "Shoulder-length natural curls.",
  canonicalWardrobe: "Faded navy crew-neck sweatshirt.",
  nonNegotiableTraits: ["warm olive skin", "soft angular jaw"],
  exclusions: ["no straightened hair"],
}

describe("character intent prompt contract", () => {
  test("makes explicit user intent authoritative without demographic inference", () => {
    expect(CHARACTER_INTENT_SYSTEM_PROMPT).toContain(
      "Explicit user intent is authoritative"
    )
    expect(CHARACTER_INTENT_SYSTEM_PROMPT).toContain(
      "Never infer ethnicity, nationality, religion, disability"
    )
    expect(CHARACTER_INTENT_SYSTEM_PROMPT).toContain(
      "Never invent fashion-forward clothing"
    )
  })

  test("presents revisions after the current contract", () => {
    const message = buildCharacterIntentUserMessage({
      sourceKind: "prompt",
      sourcePrompt: "A woman with shoulder-length dark curls",
      previousIntent: intent,
      adjustment: "Make the curls chin-length; keep everything else.",
    })
    expect(message.indexOf("CURRENT IDENTITY CONTRACT")).toBeLessThan(
      message.indexOf("REVISION REQUEST")
    )
    expect(message).toContain("Make the curls chin-length")
  })

  test("builds a provider brief from semantic sections", () => {
    const prompt = renderHeroCharacterIntent(intent)
    expect(prompt).toContain("CHARACTER CONCEPT: retired competitive swimmer")
    expect(prompt).toContain("BODY: Athletic build")
    expect(prompt).toContain("CANONICAL WARDROBE: Faded navy")
    expect(prompt).not.toContain("fashion-forward")
  })

  test("keeps the full-body direction focused on body and styling continuity", () => {
    const prompt = renderFullBodyCharacterIntent(intent)
    expect(prompt).toContain("Body continuity")
    expect(prompt).toContain("Canonical wardrobe")
    expect(prompt).not.toContain("warm olive skin")
    expect(prompt).not.toContain("soft angular jaw")
  })

  test("stores identity without locking the canonical wardrobe downstream", () => {
    const prompt = renderStoredIdentityPrompt(intent)
    expect(prompt).toContain("Identity: Woman in her late twenties")
    expect(prompt).toContain("Body: Athletic build")
    expect(prompt).not.toContain("Faded navy crew-neck sweatshirt")
  })
})
