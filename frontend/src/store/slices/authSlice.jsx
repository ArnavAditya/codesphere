import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: { jwtToken: "", isLogged: false, user: null },
  reducers: {
    login(state, actions) {
      state.isLogged = true;
      try {
        state.user = actions.payload.user;
        state.jwtToken = localStorage.getItem("token");
      } catch (error) {
        console.log("Error in login:", error);
      }
    },
    logout(state, actions) {
      state.isLogged = false;
      localStorage.removeItem("token");
      state.user = null;
      state.jwtToken = "";
    },
    updateLoggedInUserFriends(state, actions) {
      state.user.friends = actions.payload.updatedFriends;
    },
  },
});

export { authSlice };
export const authActions = authSlice.actions;
