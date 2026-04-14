import apiClient from '../../../../apiClient/apiClient';

// Summary API call to fetch summary as per category
export const getApplicationErrorsSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForApplicationError`, { params });
    return response.data;
};

export const GetATTSIMUsageImportSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForSIMUsageImportProcessor`, { params });
    return response.data;
}

export const getB2BApiPerformanceSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForB2B`, { params });
    return response.data;
}

export const getB2BApiErrorsSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForB2BErrors`, { params });
    return response.data;
}

export const getBackgroundProcessorSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForProcessor`, { params });
    return response.data;
}

export const getCarrierUsageSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForUsage`, { params });
    return response.data;
}

export const getChannelConfigurationMissingSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForChannelConfigurationMissing`, { params });
    return response.data;
}

export const getConfigurationMissingSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForSIMMapping`, { params });
    return response.data;
}

export const getDeviceActionsSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForDeviceActions`, { params });
    return response.data;
}

export const getDeviceActivitiesSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForDeviceActivity`, { params });
    return response.data;
}

export const getDeviceAlertsSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForDeviceAlert`, { params });
    return response.data;
}

export const getDisabledBackgroundProcessorsSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForMissingProcessorMapping`, { params });
    return response.data;
}

export const getDisabledBackgroundProcessorsForCarriersSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForMissingCarrierProcessorMapping`, { params });
    return response.data;
}

export const getIndexMaintenanceLogSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForIndexMaintenance`, { params });
    return response.data;
}

export const getRMASummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForRMATransaction`, { params });
    return response.data;
}

export const getSchedulerLogsSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForSchedulerLog`, { params });
    return response.data;
}

export const getSchedulersSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForScheduler`, { params });
    return response.data;
}

export const getTicketsSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForTicket`, { params });
    return response.data;
};

export const getVerizonUsageImportSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForVerizonUsage`, { params });
    return response.data;
};

export const getWebhooksSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForWebhooks`, { params });
    return response.data;
};

export const getWorkflowsSummary = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringDataForWorkflow`, { params });
    return response.data;
};

// Detail API call to fetch details as per category and sub-category
export const getApplicationErrorsDetails = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetApplicationErrorDetailsByCategoryForSupportMonitoring`, { params });
    return response.data;
};

export const getB2BErrorsDetails = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetB2BErrorDetailsByAPINameForSupportMonitoring`, { params });
    return response.data;
};

export const getBackgroundProcessorDetails = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetBackgroundProcessorDetailsByNameForSupportMonitoring`, { params });
    return response.data;
};

export const getTicketDetails = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetTicketsDetailsByCategoryForSupportMonitoring`, { params });
    return response.data;
};

export const getWorkflowDetails = async (params) => {
    const response = await apiClient.get(`SupportMonitoring/GetWorkflowDetailsByCategoryForSupportMonitoring`, { params });
    return response.data;
};

// API call to fetch support monitoring tabs with pagination, sorting, searching, and date filtering
export const getSupportMonitoringTabs = async (request) => {
    const params = {
        PageIndex: String(request.pageIndex),
        PageSize: String(request.pageSize),
        SortColumn: request.sortColumn ?? '',
        SortOrder: request.sortOrder ?? '',
        SearchText: request.searchText ?? '',

        // Apply start date or fallback to 30 days ago
        StartDate: request.startDate
            ? new Date(request.startDate).toISOString() : new Date().toISOString(),

        // Apply end date or fallback to right now
        EndDate: request.endDate
            ? new Date(request.endDate).toISOString()
            : new Date().toISOString()
    };

    try {
        const response = await apiClient.get(`SupportMonitoring/GetSupportMonitoringTabs`, { params });

        return response.data;

    } catch (error) {
        console.error("Error fetching support monitoring tabs:", error);
        throw error;
    }
};