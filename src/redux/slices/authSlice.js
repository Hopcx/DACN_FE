import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  accessToken: null,
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
    },
    updateTokens: (state, action) => {
      state.accessToken = action.payload.accessToken
    },
    setUser: (state, action) => {
      state.user = action.payload
    },
    clearSession: () => initialState,
  },
})

export const { setSession, updateTokens, setUser, clearSession } = authSlice.actions
export default authSlice.reducer
