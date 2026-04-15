import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import supportMonitoringReducer from './slices/supportMonitoringSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        supportMonitoring: supportMonitoringReducer,
    },
});
