export type DeploymentMethod = "api" | "iframe" | "docker" | "kubernetes"

export interface DeploymentConfig {
  basic: {
    name: string
    version: string
    region: string
    description: string
  }
  api: {
    rateLimit: string
    timeout: string
    authMethod: string
    corsOrigins: string
  }
  env: Array<{
    name: string
    value: string
    type: "normal" | "sensitive"
  }>
  advanced: {
    logLevel: string
    cacheTtl: string
    features?: string[]
  }
}
