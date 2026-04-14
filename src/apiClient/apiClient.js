import axios from 'axios';
import { environment } from '../environments/environment';

const apiClient = axios.create({
    baseURL: environment.API_BASE_URL_BASE,
});

let msalInstance;

export const setMsalInstance = (instance) => {
    msalInstance = instance;
};

apiClient.interceptors.request.use(
    async (config) => {
        const myCustomKey = environment.OCM_API_KEY;
        config.headers['ocp-apim-subscription-key'] = myCustomKey;

        if (msalInstance) {
            const activeAccount = msalInstance.getActiveAccount();
            const accounts = msalInstance.getAllAccounts();
            const account = activeAccount || accounts[0];

            if (account) {
                try {
                    const response = await msalInstance.acquireTokenSilent({
                        scopes: environment.apiConfig.scopes
                    });
                    const accessToken = response.accessToken;
                    config.headers.Authorization = `Bearer ${accessToken}`;
                } catch (error) {
                    console.error("Error acquiring token:", error);
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;