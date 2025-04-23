// Types of API errors
export enum ApiErrorType {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  RATE_LIMIT = "rate_limit",
  SERVER = "server",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

// API error class
export class ApiError extends Error {
  type: ApiErrorType
  status?: number
  retryable: boolean

  constructor(message: string, type: ApiErrorType = ApiErrorType.UNKNOWN, status?: number, retryable = false) {
    super(message)
    this.name = "ApiError"
    this.type = type
    this.status = status
    this.retryable = retryable
  }
}

// Function to handle API errors
export function handleApiError(error: any): ApiError {
  // Network error
  if (error.message === "Failed to fetch" || error instanceof TypeError) {
    return new ApiError("Network error. Please check your internet connection.", ApiErrorType.NETWORK, undefined, true)
  }

  // If it's already an ApiError, return it
  if (error instanceof ApiError) {
    return error
  }

  // If it's a response with status code
  if (error.status) {
    const status = error.status

    // Authentication error
    if (status === 401) {
      return new ApiError("Authentication failed. Please sign in again.", ApiErrorType.AUTHENTICATION, status, false)
    }

    // Authorization error
    if (status === 403) {
      return new ApiError(
        "You do not have permission to perform this action.",
        ApiErrorType.AUTHORIZATION,
        status,
        false,
      )
    }

    // Validation error
    if (status === 400 || status === 422) {
      return new ApiError("Invalid request. Please check your input.", ApiErrorType.VALIDATION, status, false)
    }

    // Rate limit error
    if (status === 429) {
      return new ApiError("Rate limit exceeded. Please try again later.", ApiErrorType.RATE_LIMIT, status, true)
    }

    // Server error
    if (status >= 500) {
      return new ApiError("Server error. Please try again later.", ApiErrorType.SERVER, status, true)
    }
  }

  // Timeout error
  if (error.name === "TimeoutError" || error.message.includes("timeout")) {
    return new ApiError("Request timed out. Please try again.", ApiErrorType.TIMEOUT, undefined, true)
  }

  // Unknown error
  return new ApiError(error.message || "An unknown error occurred.", ApiErrorType.UNKNOWN, undefined, false)
}

// Function to create a fetch with timeout
export function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      reject(new ApiError("Request timed out", ApiErrorType.TIMEOUT, undefined, true))
    }, timeout)

    fetch(url, {
      ...options,
      signal: controller.signal,
    })
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId))
  })
}

// Function to handle API requests with retries
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  timeout = 30000,
): Promise<T> {
  let retries = 0

  while (true) {
    try {
      const response = await fetchWithTimeout(url, options, timeout)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage: string

        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.error || errorText
        } catch {
          errorMessage = errorText
        }

        throw new ApiError(
          errorMessage,
          response.status === 401
            ? ApiErrorType.AUTHENTICATION
            : response.status === 403
              ? ApiErrorType.AUTHORIZATION
              : response.status === 429
                ? ApiErrorType.RATE_LIMIT
                : response.status >= 500
                  ? ApiErrorType.SERVER
                  : ApiErrorType.UNKNOWN,
          response.status,
          response.status === 429 || response.status >= 500,
        )
      }

      return await response.json()
    } catch (error) {
      const apiError = handleApiError(error)

      if (apiError.retryable && retries < maxRetries) {
        retries++

        // Exponential backoff
        const delay = Math.min(1000 * 2 ** retries, 10000)
        await new Promise((resolve) => setTimeout(resolve, delay))

        continue
      }

      throw apiError
    }
  }
}
