import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSupportMonitoringTabs } from '../../modules/support/support-monitoring/services/support-monitoring.service';
import { CATEGORY_CONFIGS } from '../../modules/support/support-monitoring/constants/support-monitoring-configs';

// --- Helper ---
const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const flattenRowAttributes = (rows) => {
    return rows.map(row => {
        let attrs = {};
        try { if (row.attributes) attrs = JSON.parse(row.attributes); } catch (e) { }
        return { ...row, ...attrs };
    });
};

// --- Async Thunks ---

export const fetchTabs = createAsyncThunk(
    'supportMonitoring/fetchTabs',
    async (_, { getState }) => {
        const { startDate, endDate } = getState().supportMonitoring;
        const payload = {
            pageIndex: 0,
            pageSize: 21,
            startDate,
            endDate,
        };
        const data = await getSupportMonitoringTabs(payload);
        return data;
    }
);

export const fetchSummary = createAsyncThunk(
    'supportMonitoring/fetchSummary',
    async ({ categoryName, pageIndex, searchText, sortColumn, sortOrder }, { getState }) => {
        const { startDate, endDate, summary } = getState().supportMonitoring;
        const config = CATEGORY_CONFIGS[categoryName];

        if (!config || !config.summaryLoaderFn) return null;

        const payload = {
            pageIndex,
            pageSize: summary.pageSize,
            sortColumn: sortColumn ?? summary.sortColumn,
            sortOrder: sortOrder ?? summary.sortOrder,
            searchText: searchText ?? summary.searchInput,
            startDate,
            endDate,
        };

        const res = await config.summaryLoaderFn(payload);

        const dataArr = res.data
            ? (typeof res.data === 'string' ? JSON.parse(res.data) : res.data)
            : (Array.isArray(res) ? res : []);

        const total = res.totalRecords || res.totalRows || (dataArr[0] && dataArr[0].totalRows) || dataArr.length || 0;

        return {
            data: flattenRowAttributes(dataArr),
            total,
            pageIndex,
            sortColumn: sortColumn ?? summary.sortColumn,
            sortOrder: sortOrder ?? summary.sortOrder,
        };
    }
);

export const fetchDetail = createAsyncThunk(
    'supportMonitoring/fetchDetail',
    async ({ categoryName, subCategory, pageIndex, searchText, sortColumn, sortOrder }, { getState }) => {
        const { startDate, endDate, detail } = getState().supportMonitoring;
        const config = CATEGORY_CONFIGS[categoryName];

        if (!config || !config.detailLoaderFn) return null;

        const payload = {
            pageIndex,
            pageSize: detail.pageSize,
            sortColumn: sortColumn ?? detail.sortColumn,
            sortOrder: sortOrder ?? detail.sortOrder,
            searchText: searchText ?? detail.searchInput,
            startDate,
            endDate,
        };

        const res = await config.detailLoaderFn(payload, subCategory);

        const dataArr = res.data
            ? (typeof res.data === 'string' ? JSON.parse(res.data) : res.data)
            : (Array.isArray(res) ? res : []);

        const total = res.totalRecords || res.totalRows || (dataArr[0] && dataArr[0].totalRows) || dataArr.length || 0;

        return {
            data: flattenRowAttributes(dataArr),
            total,
            pageIndex,
            subCategory,
            sortColumn: sortColumn ?? detail.sortColumn,
            sortOrder: sortOrder ?? detail.sortOrder,
        };
    }
);

// --- Slice ---

const supportMonitoringSlice = createSlice({
    name: 'supportMonitoring',
    initialState: {
        // Date filters
        startDate: getTodayString(),
        endDate: getTodayString(),

        // Tabs
        tabs: [],
        activeTab: null,

        // Top-level loading & error (for tabs)
        isLoading: false,
        error: null,

        // Summary table state
        summary: {
            data: [],
            total: 0,
            page: 0,
            pageSize: 10,
            searchInput: '',
            sortColumn: '',
            sortOrder: '',
            isLoading: false,
        },

        // Detail table state
        detail: {
            selectedSubCategory: null,
            data: [],
            total: 0,
            page: 0,
            pageSize: 10,
            searchInput: '',
            sortColumn: '',
            sortOrder: '',
            isLoading: false,
        },
    },
    reducers: {
        setStartDate: (state, action) => {
            state.startDate = action.payload;
        },
        setEndDate: (state, action) => {
            state.endDate = action.payload;
        },
        setToday: (state) => {
            const today = getTodayString();
            state.startDate = today;
            state.endDate = today;
        },
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
            // Reset detail when switching tabs
            state.detail.selectedSubCategory = null;
            state.detail.data = [];
            state.detail.total = 0;
            state.detail.page = 0;
            state.detail.searchInput = '';
            state.detail.sortColumn = '';
            state.detail.sortOrder = '';
        },
        setSummarySearchInput: (state, action) => {
            state.summary.searchInput = action.payload;
        },
        setDetailSearchInput: (state, action) => {
            state.detail.searchInput = action.payload;
        },
        resetSummaryState: (state) => {
            state.summary.data = [];
            state.summary.searchInput = '';
            state.summary.sortColumn = '';
            state.summary.sortOrder = '';
        },
        resetDetailState: (state) => {
            state.detail.selectedSubCategory = null;
            state.detail.data = [];
            state.detail.total = 0;
            state.detail.page = 0;
            state.detail.searchInput = '';
            state.detail.sortColumn = '';
            state.detail.sortOrder = '';
        },
        setSelectedSubCategory: (state, action) => {
            state.detail.selectedSubCategory = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // --- fetchTabs ---
            .addCase(fetchTabs.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTabs.fulfilled, (state, action) => {
                state.tabs = action.payload;
                state.isLoading = false;
            })
            .addCase(fetchTabs.rejected, (state, action) => {
                state.error = action.error.message || 'Failed to load support monitoring tabs.';
                state.isLoading = false;
            })

            // --- fetchSummary ---
            .addCase(fetchSummary.pending, (state) => {
                state.summary.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSummary.fulfilled, (state, action) => {
                if (action.payload) {
                    state.summary.data = action.payload.data;
                    state.summary.total = action.payload.total;
                    state.summary.page = action.payload.pageIndex;
                    state.summary.sortColumn = action.payload.sortColumn;
                    state.summary.sortOrder = action.payload.sortOrder;
                }
                state.summary.isLoading = false;
            })
            .addCase(fetchSummary.rejected, (state, action) => {
                state.error = action.error.message || 'Failed to load data.';
                state.summary.isLoading = false;
            })

            // --- fetchDetail ---
            .addCase(fetchDetail.pending, (state) => {
                state.detail.isLoading = true;
            })
            .addCase(fetchDetail.fulfilled, (state, action) => {
                if (action.payload) {
                    state.detail.data = action.payload.data;
                    state.detail.total = action.payload.total;
                    state.detail.page = action.payload.pageIndex;
                    state.detail.selectedSubCategory = action.payload.subCategory;
                    state.detail.sortColumn = action.payload.sortColumn;
                    state.detail.sortOrder = action.payload.sortOrder;
                }
                state.detail.isLoading = false;
            })
            .addCase(fetchDetail.rejected, (state, action) => {
                console.error('Error fetching detail:', action.error.message);
                state.detail.isLoading = false;
            });
    },
});

export const {
    setStartDate,
    setEndDate,
    setToday,
    setActiveTab,
    setSummarySearchInput,
    setDetailSearchInput,
    resetSummaryState,
    resetDetailState,
    setSelectedSubCategory,
} = supportMonitoringSlice.actions;

export default supportMonitoringSlice.reducer;
