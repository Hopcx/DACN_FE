import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  status: 'idle',
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.status = action.payload
    },
  },
})

export const { setStatus } = appSlice.actions
export default appSlice.reducer
