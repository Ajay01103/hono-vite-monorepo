import { configureStore, combineReducers } from "@reduxjs/toolkit"
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  type WebStorage,
} from "redux-persist"
import storage from "redux-persist/lib/storage"
import authReducer from "./slices/authSlice"

// Create a noop storage for SSR that satisfies redux-persist's sync check
const createNoopStorage = (): WebStorage => {
  return {
    getItem: (_key: string) => Promise.resolve(null),
    setItem: (_key: string, _value: string) => Promise.resolve(),
    removeItem: (_key: string) => Promise.resolve(),
  }
}

// Safe check for localStorage availability
const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === "undefined") return false
    const test = "__redux_persist_test__"
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

const isClient = typeof window !== "undefined"
const persistConfig = {
  key: "hono-redux-auth",
  version: 1,
  storage: isClient && isLocalStorageAvailable() ? storage : createNoopStorage(),
  whitelist: ["auth"], // Only persist auth state
  keyPrefix: "hono:", // Add prefix to avoid collisions
}

const rootReducer = combineReducers({
  auth: authReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

let persistor: ReturnType<typeof persistStore> | undefined = undefined
if (isClient) {
  persistor = persistStore(store)
}
export { persistor }

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
