export type DeploymentMethod = "api" | "iframe" | "docker" | "kubernetes"

export interface BasicConfig {
  name: string
  version: string
  region: string
  description: string
}

export interface ApiConfig {
  rateLimit: string
  timeout: string
  authMethod: string
  corsOrigins: string
  apiUrl?: string
  apiKey?: string
  docUrl?: string
}

export interface EnvVar {
  name: string
  value: string
  type: "text" | "sensitive"
}

export interface AdvancedConfig {
  cacheTtl: string
  features: string[]
}

export interface DeploymentConfig {
  basic: BasicConfig
  api?: ApiConfig
  iframe?: IframeConfig
  docker?: DockerConfig
  kubernetes?: KubernetesConfig
  env: EnvVar[]
  advanced: AdvancedConfig
}

export interface IframeConfig {
  width: string
  height: string
  allowFullscreen: boolean
  sandbox?: string[]
}

export interface DockerConfig {
  image: string
  ports: string[]
  volumes: string[]
  environment: Record<string, string>
}

export interface KubernetesConfig {
  namespace: string
  replicas: number
  resources: {
    cpu: string
    memory: string
  }
  storage: {
    type: string
    size: string
  }
}

export interface WebhookConfig {
  endpoint: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  headers: Record<string, string>
  retryPolicy: {
    maxAttempts: number
    backoff: "linear" | "exponential"
  }
}

export interface ScheduledConfig {
  schedule: string
  timezone: string
  concurrency: number
  retryPolicy: {
    maxAttempts: number
    backoff: "linear" | "exponential"
  }
} 