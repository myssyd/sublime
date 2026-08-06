export function parseInstagramReelUrl(value: string) {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error("Enter a valid Instagram Reel link")
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "")
  if (
    url.protocol !== "https:" ||
    !["instagram.com", "m.instagram.com"].includes(hostname)
  ) {
    throw new Error("Enter a valid Instagram Reel link")
  }

  const match = url.pathname.match(/^\/reels?\/([a-zA-Z0-9_-]+)\/?$/)
  if (!match) throw new Error("Enter a valid Instagram Reel link")

  return {
    shortcode: match[1],
    url: `https://www.instagram.com/reel/${match[1]}/`,
  }
}

