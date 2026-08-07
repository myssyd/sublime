import { httpRouter } from "convex/server"
import { registerRoutes as registerStripeRoutes } from "@convex-dev/stripe"
import { authComponent, createAuth } from "./auth"
import { components } from "./_generated/api"
import { stripeEventHandlers } from "./stripe"

const http = httpRouter()
authComponent.registerRoutes(http, createAuth)

registerStripeRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
  events: stripeEventHandlers,
})

export default http
