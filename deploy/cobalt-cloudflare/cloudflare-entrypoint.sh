#!/bin/sh
set -eu

node -e '
  const { writeFileSync } = require("node:fs");
  const key = process.env.COBALT_API_KEY;
  if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw new Error("COBALT_API_KEY must be a UUIDv4");
  }
  writeFileSync("/tmp/keys.json", JSON.stringify({
    [key]: {
      name: "sublime-convex",
      limit: 60,
      allowedServices: ["instagram"]
    }
  }));
'

export API_KEY_URL="file:///tmp/keys.json"
export API_AUTH_REQUIRED="1"

exec node src/cobalt
