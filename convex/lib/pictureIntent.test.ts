import { describe, expect, test } from "bun:test"
import {
  buildPictureDirectorContent,
  buildPictureProviderPrompt,
  hasCompleteReferencePlan,
  PICTURE_DIRECTOR_SYSTEM_PROMPT,
  type PictureIntent,
} from "./pictureIntent"

const intent: PictureIntent = {
  explicitLocks: ["sunlit café", "candid expression"],
  creativeBiases: ["warm editorial photography"],
  concept: "A quiet pause beside the café window.",
  subjects: "Lena alone in the foreground.",
  moment: "She glances past camera while setting down a coffee cup.",
  subjectDirection:
    "Waist turned toward the table, right hand releasing the cup, relaxed mouth and off-axis gaze.",
  wardrobeStyling: "Soft oatmeal knit with minimal jewelry.",
  setting: "Intimate neighborhood café with warm plaster and dark wood.",
  camera: "Natural eye-level environmental portrait with a normal lens.",
  composition: "Vertical waist-up frame, Lena offset left, chair edge in foreground.",
  lighting: "Late-morning window light softened by sheer curtains.",
  atmosphere: "Quiet late-morning café with restrained background activity.",
  finish: "Warm restrained editorial color and natural skin texture.",
  referencePlan: [
    {
      referenceIndex: 1,
      contributes: ["outfit", "style"],
      strength: "primary",
    },
    {
      referenceIndex: 2,
      contributes: ["composition"],
      strength: "supporting",
    },
  ],
  exclusions: ["no direct gaze", "no visible logos"],
}

describe("picture director contract", () => {
  test("keeps user locks above references and creative judgment", () => {
    expect(PICTURE_DIRECTOR_SYSTEM_PROMPT).toContain(
      "USER INTENT — every explicit outcome and visual detail is authoritative"
    )
    expect(PICTURE_DIRECTOR_SYSTEM_PROMPT).toContain(
      "Never adopt another person's face or body identity"
    )
    expect(PICTURE_DIRECTOR_SYSTEM_PROMPT).toContain(
      "include each exactly once in referencePlan"
    )
  })

  test("labels each creative image and keeps the raw request in the final text part", () => {
    const content = buildPictureDirectorContent({
      rawPrompt: "Put Lena in a sunlit café, candid expression.",
      characterName: "Lena",
      characterIdentityPrompt: "Identity locked by approved references.",
      model: "seedream-5",
      aspectRatio: "9:16",
      attachmentUrls: ["https://example.com/one.jpg", "https://example.com/two.jpg"],
    })
    expect(content).toHaveLength(5)
    expect(content[0]).toEqual(
      expect.objectContaining({ type: "text", text: expect.stringContaining("CREATIVE REFERENCE 1") })
    )
    expect(content[1]).toEqual({
      type: "image_url",
      image_url: { url: "https://example.com/one.jpg" },
    })
    expect(content.at(-1)).toEqual(
      expect.objectContaining({
        type: "text",
        text: expect.stringContaining("Put Lena in a sunlit café"),
      })
    )
  })

  test("requires one unique plan entry per attachment", () => {
    expect(hasCompleteReferencePlan(intent, 2)).toBe(true)
    expect(hasCompleteReferencePlan({ ...intent, referencePlan: [] }, 2)).toBe(
      false
    )
    expect(
      hasCompleteReferencePlan(
        {
          ...intent,
          referencePlan: [intent.referencePlan[0], intent.referencePlan[0]],
        },
        2
      )
    ).toBe(false)
    expect(hasCompleteReferencePlan({ ...intent, referencePlan: [] }, 0)).toBe(
      true
    )
  })

  test("assembles an identity-safe provider prompt without generic Instagram bias", () => {
    const prompt = buildPictureProviderPrompt({
      rawPrompt: "Put Lena in a sunlit café, candid expression.",
      aspectRatio: "9:16",
      identityReferenceCount: 2,
      intent,
    })
    expect(prompt).toContain("first 2 supplied identity reference images")
    expect(prompt).toContain("ORIGINAL USER INTENT — AUTHORITATIVE")
    expect(prompt).toContain("Put Lena in a sunlit café")
    expect(prompt).toContain(
      "Creative reference 1: primary; contributes outfit, style."
    )
    expect(prompt).not.toContain("Instagram")
    expect(prompt).not.toContain("adopt another person's identity")
  })
})
