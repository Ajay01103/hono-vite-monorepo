/**
 * OpenAPI specification for User routes
 * This is manually defined because user routes use regular Hono (not OpenAPIHono) for RPC compatibility
 */

export const userOpenAPISpec = {
  "/api/users/current-user": {
    get: {
      tags: ["Users"],
      summary: "Get current authenticated user",
      description:
        "Retrieve the profile information of the currently authenticated user based on the JWT token provided in the Authorization header.",
      security: [{ BearerAuth: [] }],
      responses: {
        "200": {
          description: "User profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  user: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "Unique user identifier (CUID2)",
                        example: "clz1abc123def456ghi789jkl",
                      },
                      name: {
                        type: "string",
                        description: "User's full name",
                        example: "John Doe",
                      },
                      email: {
                        type: "string",
                        format: "email",
                        description: "User's email address",
                        example: "john.doe@example.com",
                      },
                      profilePicture: {
                        type: ["string", "null"],
                        description: "URL to user's profile picture on Cloudinary",
                        example:
                          "https://res.cloudinary.com/demo/image/upload/v1234567890/profile.jpg",
                      },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "Account creation timestamp",
                      },
                      updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "Last update timestamp",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized - Invalid or missing authentication token",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "404": {
          description: "User not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "User not found" },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to fetch current user" },
                  message: { type: "string", example: "Database connection error" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/users/update": {
    put: {
      tags: ["Users"],
      summary: "Update user profile",
      description:
        "Update the authenticated user's profile information including name and profile picture. Profile picture is uploaded to Cloudinary. Supports multipart/form-data for file uploads.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  minLength: 1,
                  maxLength: 255,
                  description: "User's full name (optional)",
                  example: "Jane Doe",
                },
                profilePicture: {
                  type: "string",
                  format: "binary",
                  description:
                    "Profile picture file (optional). Accepts JPG, JPEG, PNG. Max size: 2MB.",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "User profile updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "User updated successfully" },
                  user: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "Unique user identifier (CUID2)",
                        example: "clz1abc123def456ghi789jkl",
                      },
                      name: {
                        type: "string",
                        description: "User's full name",
                        example: "Jane Doe",
                      },
                      email: {
                        type: "string",
                        format: "email",
                        description: "User's email address",
                        example: "john.doe@example.com",
                      },
                      profilePicture: {
                        type: ["string", "null"],
                        description: "URL to user's profile picture on Cloudinary",
                        example:
                          "https://res.cloudinary.com/demo/image/upload/v1234567890/profile.jpg",
                      },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "Account creation timestamp",
                      },
                      updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "Last update timestamp",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "400": {
          description:
            "Bad request - Invalid input (invalid name, unsupported file type, file too large, or no data to update)",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "string",
                    example: "Invalid file type. Only JPG, JPEG, and PNG are allowed",
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized - Invalid or missing authentication token",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        "404": {
          description: "User not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "User not found" },
                },
              },
            },
          },
        },
        "500": {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to update user" },
                  message: { type: "string", example: "Cloudinary upload failed" },
                },
              },
            },
          },
        },
      },
    },
  },
}
