/**
 * OpenAPI specification for Authentication routes
 * This is manually defined because auth routes use regular Hono (not OpenAPIHono) for RPC compatibility
 */

export const authOpenAPISpec = {
  "/api/auth/register": {
    post: {
      tags: ["Authentication"],
      summary: "Register a new user",
      description:
        "Create a new user account with email and password. Automatically creates user profile and report settings. Returns a JWT access token for immediate authentication.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email", "password"],
              properties: {
                name: {
                  type: "string",
                  minLength: 1,
                  maxLength: 255,
                  description: "User's full name",
                  example: "John Doe",
                },
                email: {
                  type: "string",
                  format: "email",
                  minLength: 1,
                  maxLength: 255,
                  description: "User's email address",
                  example: "john.doe@example.com",
                },
                password: {
                  type: "string",
                  minLength: 4,
                  description: "User password (minimum 4 characters)",
                  example: "securePassword123",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "User registered successfully with access token",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "User registered successfully" },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "string", example: "clz1abc123def456ghi789jkl" },
                      name: { type: "string", example: "John Doe" },
                      email: { type: "string", example: "john.doe@example.com" },
                      profilePicture: { type: ["string", "null"], example: null },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                  accessToken: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                  expiresAt: { type: "number", example: 1708531200000 },
                },
              },
            },
          },
        },
        "409": {
          description: "Conflict - User with this email already exists",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "User already exists" },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error during registration",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Registration failed" },
                  message: { type: "string", example: "Database connection error" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/auth/login": {
    post: {
      tags: ["Authentication"],
      summary: "Login with existing credentials",
      description:
        "Authenticate with email and password. Returns user information and a JWT access token for subsequent authenticated requests.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  minLength: 1,
                  maxLength: 255,
                  description: "User's email address",
                  example: "john.doe@example.com",
                },
                password: {
                  type: "string",
                  minLength: 4,
                  description: "User password",
                  example: "securePassword123",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Login successful with access token",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "User logged in successfully" },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "string", example: "clz1abc123def456ghi789jkl" },
                      name: { type: "string", example: "John Doe" },
                      email: { type: "string", example: "john.doe@example.com" },
                      profilePicture: { type: ["string", "null"], example: null },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                  accessToken: {
                    type: "string",
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  },
                  expiresAt: { type: "number", example: 1708531200000 },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized - Invalid email or password",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Invalid email or password" },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error during login",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Login failed" },
                  message: { type: "string", example: "Database connection error" },
                },
              },
            },
          },
        },
      },
    },
  },
}
