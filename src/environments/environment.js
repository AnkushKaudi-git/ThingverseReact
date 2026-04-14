const API_BASE_URL = 'https://localhost:'
export const environment={
    production: false,
    name: 'Local',
    API_BASE_URL_ALARMS : API_BASE_URL+'2443/',
    API_BASE_URL_ASSETS : API_BASE_URL+'7004/', // asset url need to confirm
    API_BASE_URL_CARRIERS : API_BASE_URL+'5443/',
    API_BASE_URL_BASE : API_BASE_URL+'6443/',
    API_BASE_URL_CUSTOMERACCOUNTS : API_BASE_URL+'7443/',
    API_BASE_URL_DEVICEMANAGEMENT : API_BASE_URL+'9443/',
    API_BASE_URL_INVENTORY : API_BASE_URL+'8443/',
    API_BASE_URL_OEM : API_BASE_URL+'10443/',
    API_BASE_URL_REPORTS : API_BASE_URL+'11443/',
    API_BASE_URL_SERVICEACCOUNTS : API_BASE_URL+'13443/',
    API_BASE_URL_SIM : API_BASE_URL+'14443/',
    API_BASE_URL_USERMANAGEMENT : API_BASE_URL+'15443/',
    API_BASE_URL_SSO : API_BASE_URL + '7079/',
    CLIENT_CODE: 'BackOfficeUI',
    OCM_API_KEY: '9ce610d6358b48a6895c687a24d41a27',
    msalConfig: {
        auth: {
            clientId: '9f7c2186-7432-47d8-b604-155ae66baed4',
            authority: 'https://login.microsoftonline.com/8687cbf4-7b4c-473e-9eaf-6e2e98d329cf',
            redirectUri : 'https://localhost:4200/',
            postLogoutRedirectUri:'https://localhost:4200'
        }
    },
    apiConfig: {
        scopes: ['openid', 'profile', 'email', 'api://24b9de4c-527b-4ef8-991f-6aa6162248fc/dev-backoffice'],
        uri: 'https://graph.microsoft.com/v1.0/me'
        
    },
};