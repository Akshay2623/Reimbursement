import apiClient from "./apiClient";

export const authApi = {
  login: ({ userName, password }) =>
    apiClient.post("/autovynwebsite/weblogin", { userName, password }),
};

export default authApi;
