/**
 * Request payload for admin authentication.
 */
export interface LoginDto {
  email: string;
  password?: string; // marked as optional if needed, but required in API schema
  rememberMe?: boolean;
}

/**
 * Response returned upon successful authentication.
 */
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Token lifespan in seconds (e.g. 900)
}

/**
 * Request payload for initiating a password reset.
 */
export interface ForgotPasswordDto {
  email: string;
}

/**
 * Response for password reset request.
 */
export interface ForgotPasswordResponseDto {
  message: string;
}
