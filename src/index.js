import React from 'react'; // Don't forget to import React
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { environment } from "../src/environments/environment";
import { setMsalInstance } from './apiClient/apiClient';

const msalInstance = new PublicClientApplication(environment.msalConfig);

// 1. Initialize first!
msalInstance.initialize().then(() => {
  setMsalInstance(msalInstance);

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  // 3. Register the callback
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
      const account = event.payload.account;
      msalInstance.setActiveAccount(account);
    }

    // Clear the active account when they sign out
    if (event.eventType === EventType.LOGOUT_SUCCESS) {
      msalInstance.setActiveAccount(null);
    }
  });

  // 4. Finally, render the app
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  );
}).catch(e => {
  console.error("MSAL initialization failed: ", e);
});

reportWebVitals();