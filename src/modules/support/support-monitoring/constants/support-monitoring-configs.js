import * as supportMonitoringService from "../services/support-monitoring.service";

export const CATEGORY_CONFIGS = {
    "Application Errors": {
        title: "Errors by Application Modules",
        viewType: "master-detail",
        hasChart: true,
        summaryLoaderFn: (req) => supportMonitoringService.getApplicationErrorsSummary(req),
        detailLoaderFn: (req, subCategory) => supportMonitoringService.getApplicationErrorsDetails({ ...req, applicationModuleName: subCategory }),
        chart: { type: "bar", labelField: "metricName", valueFromAttributes: "TotalErrors", xLabel: "Module", yLabel: "Total Errors", legendLabel: "Errors by Application Modules" },
        summaryColumns: [
            { field: 'metricName', header: 'Module' },
            { field: 'TotalErrors', header: 'Total Errors' },
            { field: 'LastErrorOccurredOn', header: 'Last Error Occurred On' },
            { field: 'LastErrorMessage', header: 'Last Error Message' }
        ],
        detailColumns: [
            { field: 'Module', header: 'Module' },
            { field: 'ErrorId', header: 'Error Log Id' },
            { field: 'ErrorOccuredOn', header: 'Error Occurred On' },
            { field: 'ErrorMessage', header: 'Error Message' }
        ]
    },
    "ATT SIM usage import": {
        title: "ATT SIM usage import",
        hasChart: false,
        summaryLoaderFn: (req) => supportMonitoringService.GetATTSIMUsageImportSummary(req),
        summaryColumns: [
            { field: 'metricName', header: 'File Name' },
            { field: 'ProcessingStatus', header: 'Processing Status' },
            { field: 'TotalUsageBeforeProcess', header: 'Total Usage Before Process' },
            { field: 'TotalSIMBeforeProcess', header: 'Total SIM Before Process' },
            { field: 'TotalUsageAfterProcess', header: 'Total Usage After Process' },
            { field: 'TotalSIMAfterProcess', header: 'Total SIM After Process' }
        ],
    },
    "B2B API Performance": {
        title: "Performance by B2B APIs (In ms)",
        hasChart: true,
        summaryLoaderFn: (req) => supportMonitoringService.getB2BApiPerformanceSummary(req),
        chart: { type: "bar", labelField: "metricName", valueFromAttributes: "AvgDurationInMs", xLabel: "API Name", yLabel: "Average Duration" },
        summaryColumns: [
            { field: 'metricName', header: 'API Name' },
            { field: 'TotalRequests', header: 'Total Requests' },
            { field: 'AvgDurationInMs', header: 'Avg Duration (ms)' },
            { field: 'MinExecutionInMs', header: 'Min Execution (ms)' },
            { field: 'MaxExecutionInMs', header: 'Max Execution (ms)' },
            { field: 'MaxExecutionOccurredOn', header: 'Max Execution Occurred On' }
        ],
    },
    "B2B Errors": {
        title: "Errors by B2B APIs",
        viewType: "master-detail",
        hasChart: true,
        summaryLoaderFn: (req) => supportMonitoringService.getB2BErrorsDetails(req),
        chart: { type: "bar", labelField: "metricName", valueFromAttributes: "TotalErrors", xLabel: "B2B API Name", yLabel: "Total Errors" },
        summaryColumns: [
            { field: 'metricName', header: 'B2B API Name' },
            { field: 'TotalErrors', header: 'Total Errors' },
            { field: 'LastErrorOccurredOn', header: 'Last Error Occurred On' },
            { field: 'LastErrorMessage', header: 'Last Error Message' },
        ],
        detailColumns: [
            { field: 'APIName', header: 'B2B API Name', sortable: false, sortOrder: 0 },
            { field: 'ErrorId', header: 'Error Log ID', sortable: true, sortOrder: 0 },
            { field: 'CreatedOn', header: 'Created On', sortable: true, sortOrder: 0 },
            { field: 'ErrorMessage', header: 'Error Message', sortable: false, sortOrder: 0 },
        ]
    },
    "Background Processors": {
        title: "Errors by Background Processors",
        viewType: "master-detail",
        hasChart: true,
        summaryLoaderFn: (req) => supportMonitoringService.getBackgroundProcessorSummary(req),
        chart: { type: "bar", labelField: "metricName", valueFromAttributes: "TotalErrors", xLabel: "Processor Name", yLabel: "Total Errors" },
        summaryColumns: [
            { field: 'metricName', header: 'Processor Name', sortable: true, sortOrder: 0 },
            { field: 'TotalErrors', header: 'Total Errors', sortable: true, sortOrder: 0 },
            { field: 'LastErrorOccurredOn', header: 'Last Error Occurred On', sortable: true, sortOrder: 0 },
            { field: 'LastErrorMessage', header: 'Last Error Message', sortable: true, sortOrder: 0 },
        ],
        detailColumns: [
            { field: 'ProcessorName', header: 'Processor Name', sortable: false, sortOrder: 0 },
            { field: 'ErrorId', header: 'Error Log ID', sortable: true, sortOrder: 0 },
            { field: 'CreatedOn', header: 'Created On', sortable: true, sortOrder: 0 },
            { field: 'ErrorMessage', header: 'Error Message', sortable: false, sortOrder: 0 },
        ]
    },
    "Carrier Usage": {
        title: "Usage by Carriers (In GB)",
        hasChart: true,
        summaryLoaderFn: (req) => supportMonitoringService.getCarrierUsageSummary(req),
        chart: { dynamicDateAttributes: true, xLabel: "Date", yLabel: "Usage" },
        summaryColumns: [
            { field: 'metricName', header: 'Carrier', sortable: true, sortOrder: 0 },
        ]
    },
    "Channel Configuration Missing": {
        summaryLoaderFn: (req) => supportMonitoringService.getChannelConfigurationMissingSummary(req),
        hasChart: false,
        summaryColumns: [
            { field: 'metricName', header: 'Product', sortable: true, sortOrder: 0 },
            { field: 'SubProduct', header: 'Sub Product', sortable: true, sortOrder: 0 },
            { field: 'OEMProvider', header: 'OEM Provider', sortable: true, sortOrder: 0 },

        ]
    },
    "Configuration missing": {
        summaryLoaderFn: (req) => supportMonitoringService.getConfigurationMissingSummary(req),
        hasChart: false,
        summaryColumns: [
            { field: 'metricName', header: 'Description', sortable: true, sortOrder: 0 },
            { field: 'Count', header: 'Count', sortable: true, sortOrder: 0 }
        ]
    },
    "Device Actions": {
        title: "Device Count by Actions",
        summaryLoaderFn: (req) => supportMonitoringService.getDeviceActionsSummary(req),
        chart: { type: "bar", labelField: "metricName", stackedFields: ["LitePortal", "BackOfficePortal"], xLabel: "API Name", yLabel: "Count by Portals" },
        hasChart: true,
        summaryColumns: [
            { field: 'metricName', header: 'API Name', sortable: true, sortOrder: 0 },
            { field: 'LitePortal', header: 'Lite Portal', sortable: true, sortOrder: 0 },
            { field: 'BackOfficePortal', header: 'Back Office Portal', sortable: true, sortOrder: 0 },
            { field: 'TotalCount', header: 'Total Count', sortable: true, sortOrder: 0 }
        ]
    },
    "Device Activities": {
        title: "Device Activities by Status",
        summaryLoaderFn: (req) => supportMonitoringService.getDeviceActivitiesSummary(req),
        chart: { type: "bar", labelField: "metricName", stackedFields: ["Ready", "Inprogress", "Completed", "Failed"], xLabel: "Device Activity", yLabel: "Count by Status" },
        hasChart: true,
        summaryColumns: [
            { field: 'metricName', header: 'Device Activity', sortable: true, sortOrder: 0 },
            { field: 'Ready', header: 'Ready', sortable: true, sortOrder: 0 },
            { field: 'InProgress', header: 'In Progress', sortable: true, sortOrder: 0 },
            { field: 'Completed', header: 'Completed', sortable: true, sortOrder: 0 },
            { field: 'Failed', header: 'Failed', sortable: true, sortOrder: 0 }
        ]
    },
    "Device Alerts": {
        title: "Alert Status by Devices",
        summaryLoaderFn: (req) => supportMonitoringService.getDeviceAlertsSummary(req),
        chart: { type: "bar", labelField: "metricName", stackedFields: ["Pending", "Completed", "Error", "Unprocessable"], xLabel: "Device Alert", yLabel: "Count by Status" },
        hasChart: true,
        summaryColumns: [
            { field: 'metricName', header: 'Device Alert', sortable: true, sortOrder: 0 },
            { field: 'Total', header: 'Total', sortable: true, sortOrder: 0 },
            { field: 'Pending', header: 'Pending', sortable: true, sortOrder: 0 },
            { field: 'Completed', header: 'Completed', sortable: true, sortOrder: 0 },
            { field: 'Error', header: 'Error', sortable: true, sortOrder: 0 },
            { field: 'Unprocessable', header: 'Unprocessable', sortable: true, sortOrder: 0 },
            { field: 'Today', header: 'Today', sortable: true, sortOrder: 0 },
            { field: 'LatestCreatedDate', header: 'Latest Created Date', sortable: true, sortOrder: 0 }
        ]
    },
    "Disabled Background Processors": {
        summaryLoaderFn: (req) => supportMonitoringService.getDisabledBackgroundProcessorsSummary(req),
        hasChart: false,
        summaryColumns: [
            { field: 'metricName', header: 'Product', sortable: true, sortOrder: 0 },
            { field: 'SubProduct', header: 'Sub Product', sortable: true, sortOrder: 0 },
            { field: 'Processor', header: 'Processor', sortable: true, sortOrder: 0 },
        ]
    },
    "Disabled Background Processors for Carriers": {
        summaryLoaderFn: (req) => supportMonitoringService.getDisabledBackgroundProcessorsForCarriersSummary(req),
        hasChart: false,
        summaryColumns: [
            { field: 'metricName', header: 'Product', sortable: true, sortOrder: 0 },
            { field: 'Processor', header: 'Processor', sortable: true, sortOrder: 0 },
        ]
    },
    "Index Maintenance Log": {
        summaryLoaderFn: (req) => supportMonitoringService.getIndexMaintenanceLogSummary(req),
        hasChart: false,
        summaryColumns: [
            { field: 'metricName', header: 'Table Name', sortable: true, sortOrder: 0 },
            { field: 'IndexName', header: 'Index Name', sortable: true, sortOrder: 0 },
            { field: 'Threshold', header: 'Threshold', sortable: true, sortOrder: 0 },
            { field: 'LastExecutedOn', header: 'Last Executed On', sortable: true, sortOrder: 0 },
            { field: 'MaintenanceType', header: 'Maintenance Type', sortable: true, sortOrder: 0 },
            { field: 'FragmentationBefore', header: 'Fragmentation Before', sortable: true, sortOrder: 0 },
            { field: 'FragmentationAfter', header: 'Fragmentation After', sortable: true, sortOrder: 0 },
        ]
    },
    "RMA": {
        title: "Process Status of Devices by RMA Types",
        summaryLoaderFn: (req) => supportMonitoringService.getRMASummary(req),
        chart: { type: "bar", labelField: "metricName", stackedFields: ["ProcessedDevices", "FailedDevices"], xLabel: "RMA Batch Transaction ID", yLabel: "Count by Status" },
        hasChart: false,
        summaryColumns: [
            { field: 'metricName', header: 'RMA Batch Transaction Id', sortable: true, sortOrder: 0 },
            { field: 'TotalDevices', header: 'Total Devices', sortable: true, sortOrder: 0 },
            { field: 'ProcessedDevices', header: 'Processed Devices', sortable: true, sortOrder: 0 },
            { field: 'FailedDevices', header: 'Failed Devices', sortable: true, sortOrder: 0 },
            { field: 'RequestReceivedOn', header: 'Request Received On', sortable: true, sortOrder: 0 },
            { field: 'ProcessCompletedOn', header: 'Process Completed On', sortable: true, sortOrder: 0 },
            { field: 'ErrorMessages', header: 'Error Messages', sortable: true, sortOrder: 0 },
        ]
    },
    "Scheduler Logs": {
        title: "Schedulers Logs by Status",
        summaryLoaderFn: (req) => supportMonitoringService.getSchedulerLogsSummary(req),
        chart: { type: "bar", labelField: "metricName", stackedFields: ["Succeeded", "Failed"], xLabel: "Scheduler", yLabel: "Count by Status" },
        hasChart: true,
        summaryColumns: [
            { field: 'metricName', header: 'Scheduler', sortable: true, sortOrder: 0 },
            { field: 'Succeeded', header: 'Succeeded', sortable: true, sortOrder: 0 },
            { field: 'Failed', header: 'Failed', sortable: true, sortOrder: 0 },
            { field: 'LastStatus', header: 'Last Status', sortable: true, sortOrder: 0 },
            { field: 'LastExecutedOn', header: 'Last Executed On', sortable: true, sortOrder: 0 },
            { field: 'Message', header: 'Message', sortable: true, sortOrder: 0 },
        ]
    },
    "Schedulers": {
        summaryLoaderFn: (req) => supportMonitoringService.getSchedulersSummary(req),
        hasChart: false,
        summaryColumns: [
            { field: 'metricName', header: 'Scheduler', sortable: true, sortOrder: 0 },
            { field: 'Schedule', header: 'Schedule', sortable: true, sortOrder: 0 },
            { field: 'LastExecutionTime', header: 'Last Execution Time', sortable: true, sortOrder: 0 },
            { field: 'Message', header: 'Message', sortable: true, sortOrder: 0 }
        ]
    },
    "Tickets": {
        title: "Tickets by Category",
        viewType: "master-detail",
        hasChart: true,
        summaryLoaderFn: (req) => supportMonitoringService.getTicketsSummary(req),
        detailLoaderFn: (req, subCategory) => supportMonitoringService.getTicketDetails({ ...req, ticketCategoryName: subCategory }),
        chart: { type: "bar", labelField: "metricName", stackedFields: ["Open", "InProgress"], xLabel: "Ticket Type", yLabel: "Count by Status", legendLabel: "Tickets By Category" },
        summaryColumns: [
            { field: 'metricName', header: 'Ticket Type' },
            { field: 'Total', header: 'Total' },
            { field: 'Open', header: 'Open' },
            { field: 'InProgress', header: 'In Progress' }
        ],
        detailColumns: [
            { field: 'TicketId', header: 'Ticket Id' },
            { field: 'TicketStatusName', header: 'Status' },
            { field: 'TicketCategory', header: 'Category' },
            { field: 'CreatedOn', header: 'Created On' }
        ]
    },
    "Verizon SIM Usage Import": {
        summaryLoaderFn: (req) => supportMonitoringService.getVerizonUsageImportSummary(req),
        hasChart: false,
        summaryColumns: [
            { field: 'metricName', header: 'Callback Request Id' },
            { field: 'StartDate', header: 'Start Date' },
            { field: 'EndDate', header: 'End Date' },
            { field: 'ProcessingStatus', header: 'Processing Status' },
            { field: 'TotalCallbackResponseCount', header: 'Total Callback Responses' },
            { field: 'TotalUsageBeforeProcessing', header: 'Total Usage Before Processing' },
            { field: 'TotalUsageAfterProcessing', header: 'Total Usage After Processing' },
            { field: 'TotalSIMBeforeProcessing', header: 'Total SIMs Before Processing' },
            { field: 'TotalSIMAfterProcessing', header: 'Total SIMs After Processing' }
        ],
    },
    "Webhooks": {
        title: "Errors by Webhooks",
        summaryLoaderFn: (req) => supportMonitoringService.getWebhooksSummary(req),
        chart: { type: "bar", labelField: "metricName", valueFromAttributes: "TotalErrors", xLabel: "Webhook Name", yLabel: "Total Errors" },
        hasChart: true,
        summaryColumns: [
            { field: 'metricName', header: 'Webhook Name' },
            { field: 'TotalErrors', header: 'Total Errors' },
            { field: 'LastErrorOccurredOn', header: 'Last Error Occurred On' },
            { field: 'LastErrorMessage', header: 'Last Error Message' },
        ],
    },
    "Workflows": {
        title: "Status by Workflows",
        viewType: "master-detail",
        hasChart: true,
        summaryLoaderFn: (req) => supportMonitoringService.getWorkflowsSummary(req),
        detailLoaderFn: (req, subCategory) => supportMonitoringService.getWorkflowDetails({ ...req, workflowCategoryName: subCategory }),
        chart: { type: "bar", labelField: "metricName", stackedFields: ["Pending", "Failed"], xLabel: "Workflow", yLabel: "Count by Status" },
        summaryColumns: [
            { field: 'metricName', header: 'Workflow' },
            { field: 'Total', header: 'Total' },
            { field: 'Pending', header: 'Pending' },
            { field: 'Failed', header: 'Failed' }
        ],
        detailColumns: [
            { field: 'Workflow', header: 'Workflow', sortable: false, sortOrder: 0 },
            { field: 'RequestUrl', header: 'Request URL', sortable: false, sortOrder: 0 },
            { field: 'RequestBody', header: 'Request Body', sortable: false, sortOrder: 0 },
            { field: 'ResponseBody', header: 'Response Body', sortable: false, sortOrder: 0 },
            { field: 'Status', header: 'Status', sortable: true, sortOrder: 0 },
            { field: 'ErrorMessage', header: 'Workflow Error Message', sortable: false, sortOrder: 0 },
            { field: 'CreatedOn', header: 'Created On', sortable: true, sortOrder: 0 },
            { field: 'LastUpdatedOn', header: 'Last Updated On', sortable: true, sortOrder: 0 },
        ]
    },
}