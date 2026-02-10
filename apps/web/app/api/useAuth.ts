import { useMutation, useQuery } from "@tanstack/react-query"
import { client } from "../lib/client"
import { useAppDispatch } from "~/store/hooks"
import { setCredentials } from "~/store/slices/authSlice"
import { toast } from "sonner"

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export const useLogin = () => {
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await client.api.auth.login.$post({
        json: credentials,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Login failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
          expiresAt: data.expiresAt ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
        }),
      )
    },
    onError: (error) => {
      toast.error(error.name, { description: error.message })
    },
  })
}

export const useRegister = () => {
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await client.api.auth.register.$post({
        json: credentials,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Registration failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
          expiresAt: data.expiresAt as number,
        }),
      )
    },
    onError: (error) => {
      toast.error(error.name, { description: error.message })
    },
  })
}

export const getServerAuthSession = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await client.api.users["current-user"].$get()

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Login failed")
      }

      return response.json()
    },
  })
}
