import React from 'react'; // Don't forget to import React
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { environment } from "../src/environments/environment";
import { setMsalInstance } from './apiClient/apiClient';

// Redux imports
import { Provider } from 'react-redux';
import { store } from './store/store';
import { setUser, clearUser } from './store/slices/authSlice';

const msalInstance = new PublicClientApplication(environment.msalConfig);

// 1. Initialize first!
msalInstance.initialize().then(() => {
  setMsalInstance(msalInstance);

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);

    // Dispatch user info to Redux store
    store.dispatch(setUser({
      name: accounts[0].name,
      email: accounts[0].username,
    }));
  }

  // 3. Register the callback
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
      const account = event.payload.account;
      msalInstance.setActiveAccount(account);

      // Dispatch user info to Redux store on login
      store.dispatch(setUser({
        name: account.name,
        email: account.username,
      }));
    }

    // Clear the active account when they sign out
    if (event.eventType === EventType.LOGOUT_SUCCESS) {
      msalInstance.setActiveAccount(null);

      // Clear user from Redux store on logout
      store.dispatch(clearUser());
    }
  });

  // 4. Finally, render the app
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <Provider store={store}>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </Provider>
  );
}).catch(e => {
  console.error("MSAL initialization failed: ", e);
});

reportWebVitals();