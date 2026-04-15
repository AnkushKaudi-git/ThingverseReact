import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import './support-monitoring.css'
import { CATEGORY_CONFIGS } from '../constants/support-monitoring-configs';
import { Chart } from "chart.js/auto";
import { formatUtcToLocal } from "../../../../services/datetime/datetime.service";
import Spinner from "../../../../components/spinner/spinner";

// Redux actions and thunks
import {
    setStartDate,
    setEndDate,
    setToday,
    setActiveTab,
    setSummarySearchInput,
    setDetailSearchInput,
    resetSummaryState,
    resetDetailState,
    setSelectedSubCategory,
    fetchTabs,
    fetchSummary,
    fetchDetail,
} from '../../../../store/slices/supportMonitoringSlice';

const formatCellValue = (value) => {
    if (value === undefined || value === null) return '-';

    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        return formatUtcToLocal(value);
    }

    return String(value);
};

const Pagination = ({ pageIndex, pageSize, totalRecords, onPageChange }) => {
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    return (
        <div className="pagination-controls">
            <button disabled={pageIndex === 0} onClick={() => onPageChange(0)}>{"<<"}</button>
            <button disabled={pageIndex === 0} onClick={() => onPageChange(pageIndex - 1)}>{"<"}</button>
            <span className="current-page">{pageIndex + 1}</span>
            <button disabled={pageIndex >= totalPages - 1} onClick={() => onPageChange(pageIndex + 1)}>{">"}</button>
            <button disabled={pageIndex >= totalPages - 1} onClick={() => onPageChange(totalPages - 1)}>{">>"}</button>
        </div>
    );
};

const CategoryChart = ({ data, config }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // --- COLOR DICTIONARY ---
    // Map specific field names from your config to hex colors
    const STATUS_COLORS = {
        'Succeeded': '#4CAF50',        // Green
        'Completed': '#4CAF50',        // Green
        'Ready': '#8BC34A',            // Light Green
        'ProcessedDevices': '#4CAF50', // Green
        
        'Failed': '#F44336',           // Red
        'FailedDevices': '#F44336',    // Red
        'Error': '#D32F2F',            // Dark Red
        
        'Pending': '#FFC107',          // Amber/Yellow
        'InProgress': '#FFC107',       // Blue
        'Open': '#D32F2F',             // Light Blue
        
        'Unprocessable': '#9E9E9E',    // Grey
        
        'LitePortal': '#00BCD4',       // Cyan
        'BackOfficePortal': '#9C27B0'  // Purple
    };

    // A fallback array of colors just in case a field isn't in the dictionary
    const FALLBACK_COLORS = ['#5d4e99', '#FF9800', '#009688', '#E91E63', '#795548'];

    useEffect(() => {
        if (!chartRef.current || !data || data.length === 0) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        const labels = data.map(row => row[config.labelField] || "Unknown");
        let datasets = [];
        const MAX_BAR_WIDTH = 50;

        if (config.stackedFields) {
            datasets = config.stackedFields.map((field, idx) => ({
                label: field,
                data: data.map(row => Number(row[field] || 0)),
                // Look up the color in the dictionary, use fallback if not found
                backgroundColor: STATUS_COLORS[field] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length], 
                borderWidth: 1,
                maxBarThickness: MAX_BAR_WIDTH
            }));
        } else if (config.valueFromAttributes) {
            datasets = [{
                label: config.legendLabel || config.yLabel,
                data: data.map(row => Number(row[config.valueFromAttributes] || 0)),
                backgroundColor: "#5d4e99", // App primary color for single-bar charts
                maxBarThickness: MAX_BAR_WIDTH
            }];
        }

        chartInstance.current = new Chart(ctx, {
            type: config.type || 'bar',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: !!config.stackedFields, title: { display: true, text: config.xLabel }, ticks: {
                            callback: function (value) {
                                const label = this.getLabelForValue(value);
                                if (typeof label === 'string' && label.length > 10) {
                                    return label.substring(0, 10) + '...';
                                }
                                return label;
                            }
                        }
                    },
                    y: { stacked: !!config.stackedFields, title: { display: true, text: config.yLabel }, beginAtZero: true }
                }
            }
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, config]); // STATUS_COLORS and FALLBACK_COLORS are defined inside, no need to add to deps

    return (
        <div style={{ height: '300px', marginBottom: '20px' }}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

// --- HELPER COMPONENT FOR SORT ICON ---
const SortIcon = ({ sortColumn, sortOrder, field }) => {
    if (sortColumn !== field || !sortOrder) {
        return <span style={{ color: '#ccc', marginLeft: '6px', fontSize: '13px' }}>⇅</span>;
    }
    return (
        <span style={{ color: '#5d4e99', marginLeft: '6px', fontSize: '14px', fontWeight: 'bold' }}>
            {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
    );
};

function SupportMonitoring() {
    const dispatch = useDispatch();

    // --- Read all state from Redux store ---
    const {
        startDate,
        endDate,
        tabs,
        activeTab,
        isLoading,
        summary,
        detail,
    } = useSelector((state) => state.supportMonitoring);

    // Derived values
    const activeCategoryName = activeTab !== null && tabs[activeTab] ? tabs[activeTab].category : null;
    const activeConfig = activeCategoryName ? CATEGORY_CONFIGS[activeCategoryName] : null;

    // --- Tab click handler ---
    const handleTabClick = async (categoryName, index) => {
        dispatch(setActiveTab(index));
        dispatch(resetSummaryState());

        dispatch(fetchSummary({
            categoryName,
            pageIndex: 0,
            searchText: '',
            sortColumn: '',
            sortOrder: '',
        }));
    };

    // --- Master row click handler (for master-detail views) ---
    const handleMasterRowClick = (row) => {
        const categoryName = tabs[activeTab].category;
        const config = CATEGORY_CONFIGS[categoryName];

        if (!config || config.viewType !== 'master-detail' || !config.detailLoaderFn) return;

        dispatch(resetDetailState());
        dispatch(setSelectedSubCategory(row.metricName));

        dispatch(fetchDetail({
            categoryName,
            subCategory: row.metricName,
            pageIndex: 0,
            searchText: '',
            sortColumn: '',
            sortOrder: '',
        }));
    };

    // --- Apply Filter (re-fetch tabs and current category) ---
    const handleApplyFilter = async () => {
        const resultAction = await dispatch(fetchTabs());

        if (fetchTabs.fulfilled.match(resultAction)) {
            const data = resultAction.payload;
            if (data && data.length > 0) {
                const currentCategory = activeTab !== null && tabs[activeTab] ? tabs[activeTab].category : null;

                if (currentCategory) {
                    const newIndex = data.findIndex(t => t.category === currentCategory);
                    const indexToSelect = newIndex !== -1 ? newIndex : 0;
                    handleTabClick(data[indexToSelect].category, indexToSelect);
                } else {
                    const defaultIndex = data.findIndex(t => t.category === "Application Errors");
                    const indexToSelect = defaultIndex !== -1 ? defaultIndex : 0;
                    handleTabClick(data[indexToSelect].category, indexToSelect);
                }
            }
        }
    };

    // --- Initial load ---
    useEffect(() => {
        const loadInitialData = async () => {
            const resultAction = await dispatch(fetchTabs());

            if (fetchTabs.fulfilled.match(resultAction)) {
                const data = resultAction.payload;
                if (data && data.length > 0) {
                    const defaultIndex = data.findIndex(t => t.category === "Application Errors");
                    const indexToSelect = defaultIndex !== -1 ? defaultIndex : 0;
                    handleTabClick(data[indexToSelect].category, indexToSelect);
                }
            }
        };

        loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Summary sort handler ---
    const handleSummarySort = (field) => {
        let newOrder = 'asc';
        if (summary.sortColumn === field) {
            if (summary.sortOrder === 'asc') newOrder = 'desc';
            else if (summary.sortOrder === 'desc') newOrder = '';
        }
        dispatch(fetchSummary({
            categoryName: activeCategoryName,
            pageIndex: 0,
            searchText: summary.searchInput,
            sortColumn: field,
            sortOrder: newOrder,
        }));
    };

    // --- Detail sort handler ---
    const handleDetailSort = (field) => {
        let newOrder = 'asc';
        if (detail.sortColumn === field) {
            if (detail.sortOrder === 'asc') newOrder = 'desc';
            else if (detail.sortOrder === 'desc') newOrder = '';
        }
        dispatch(fetchDetail({
            categoryName: activeCategoryName,
            subCategory: detail.selectedSubCategory,
            pageIndex: 0,
            searchText: detail.searchInput,
            sortColumn: field,
            sortOrder: newOrder,
        }));
    };


    return (
        <div className="page-container">
            <div className="filter-bar">
                <button className="btn-outline" onClick={() => dispatch(setToday())}>Today</button>

                <div className="date-input-group">
                    <label>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => dispatch(setStartDate(e.target.value))} />
                </div>

                <div className="date-input-group">
                    <label>End Date</label>
                    <input type="date" value={endDate} onChange={(e) => dispatch(setEndDate(e.target.value))} />
                </div>

                <button className="btn-solid" onClick={handleApplyFilter} disabled={isLoading}>
                    Apply Filter
                </button>
            </div>

            <div className="main-layout">
                <Spinner isLoading={isLoading}>
                    <div className="tabs-grid">
                        {tabs.map((tab, index) => (
                            <button
                                key={index}
                                className={`status-tab ${activeTab === index ? 'active' : ''}`}
                                style={{ '--legend-color': tab.legend }}
                                onClick={() => handleTabClick(tab.category, index)}
                                title={tab.category}
                            >
                                <span className="tab-text">{tab.category}</span>
                            </button>
                        ))}
                    </div>
                </Spinner>
                <div className="content-area" style={{ padding: '0 20px', width: '100%' }}>

                    {!activeConfig && !isLoading && activeCategoryName && (
                        <p>No configuration defined for <strong>{activeCategoryName}</strong>.</p>
                    )}

                    {activeConfig && (
                        <div className="category-view">
                            {(() => {
                                const isStackedLayout = activeConfig.viewType !== 'master-detail' && activeConfig.hasChart;
                                const chartNode = (activeConfig.hasChart && summary.data.length > 0) ? (
                                    <div className="chart-container" style={isStackedLayout ? { width: '100%', flex: 'none', marginBottom: '40px' } : {}}>
                                        <h3 className="chart-title">{activeConfig.title || activeCategoryName}</h3>
                                        <CategoryChart config={activeConfig.chart} data={summary.data} />
                                    </div>
                                ) : null;

                                return (
                                    <div className={isStackedLayout ? "layout-stacked" : "layout-side-by-side"} style={isStackedLayout ? { display: 'flex', flexDirection: 'column' } : {}}>

                                        {isStackedLayout && chartNode}

                                        <div className="table-container" style={isStackedLayout ? { width: '100%', flex: 'none' } : {}}>
                                            <div className="table-controls">
                                                <span className="record-count">Total Record(s): {summary.total}</span>
                                                <div className="search-bar">
                                                    <input
                                                        type="text"
                                                        placeholder="Search..."
                                                        value={summary.searchInput}
                                                        onChange={(e) => dispatch(setSummarySearchInput(e.target.value))}
                                                        onKeyDown={(e) => e.key === 'Enter' && dispatch(fetchSummary({
                                                            categoryName: activeCategoryName,
                                                            pageIndex: 0,
                                                            searchText: summary.searchInput,
                                                            sortColumn: summary.sortColumn,
                                                            sortOrder: summary.sortOrder,
                                                        }))}
                                                    />
                                                    <i className="search-icon">🔍</i>
                                                </div>
                                            </div>

                                            {summary.data.length > 0 ? (
                                                <>
                                                    <div className="table-responsive">
                                                        <table className="custom-data-table">
                                                            <thead>
                                                                <tr>
                                                                    {activeConfig.summaryColumns.map(col => (
                                                                        <th 
                                                                            key={col.field}
                                                                            onClick={() => col.sortable ? handleSummarySort(col.field) : null}
                                                                            style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                                                                        >
                                                                            {col.header}
                                                                            {col.sortable && <SortIcon sortColumn={summary.sortColumn} sortOrder={summary.sortOrder} field={col.field} />}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {summary.data.map((row, idx) => (
                                                                    <tr
                                                                        key={idx}
                                                                        onClick={() => handleMasterRowClick(row)}
                                                                        className={activeConfig.viewType === 'master-detail' ? 'clickable-row' : ''}
                                                                    >
                                                                        {activeConfig.summaryColumns.map(col => (
                                                                            <td key={col.field}>
                                                                                {formatCellValue(row[col.field])}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <Pagination
                                                        pageIndex={summary.page}
                                                        pageSize={summary.pageSize}
                                                        totalRecords={summary.total}
                                                        onPageChange={(newPage) => dispatch(fetchSummary({
                                                            categoryName: activeCategoryName,
                                                            pageIndex: newPage,
                                                            searchText: summary.searchInput,
                                                            sortColumn: summary.sortColumn,
                                                            sortOrder: summary.sortOrder,
                                                        }))}
                                                    />
                                                </>
                                            ) : (
                                                !isLoading && <p style={{ marginTop: '20px', color: '#666' }}>No data available.</p>
                                            )}
                                        </div>

                                        {!isStackedLayout && chartNode}
                                    </div>
                                );
                            })()}

                            {/* --- DETAIL TABLE BELOW --- */}
                            {activeConfig.viewType === 'master-detail' && detail.selectedSubCategory && (
                                <div className="detail-section" style={{ marginTop: '50px' }}>
                                    <div className="table-controls">
                                        <span className="record-count">Total Record(s): {detail.total}</span>
                                        <div className="search-bar">
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={detail.searchInput}
                                                onChange={(e) => dispatch(setDetailSearchInput(e.target.value))}
                                                onKeyDown={(e) => e.key === 'Enter' && dispatch(fetchDetail({
                                                    categoryName: activeCategoryName,
                                                    subCategory: detail.selectedSubCategory,
                                                    pageIndex: 0,
                                                    searchText: detail.searchInput,
                                                    sortColumn: detail.sortColumn,
                                                    sortOrder: detail.sortOrder,
                                                }))}
                                            />
                                            <i className="search-icon">🔍</i>
                                        </div>
                                    </div>

                                    {detail.isLoading ? (
                                        <p style={{ marginTop: '20px', color: '#666' }}>Loading details...</p>
                                    ) : detail.data.length > 0 ? (
                                        <>
                                            <div className="table-responsive">
                                                <table className="custom-data-table">
                                                    <thead>
                                                        <tr>
                                                            {activeConfig.detailColumns.map(col => (
                                                                <th 
                                                                    key={col.field}
                                                                    onClick={() => col.sortable ? handleDetailSort(col.field) : null}
                                                                    style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                                                                >
                                                                    {col.header}
                                                                    {col.sortable && <SortIcon sortColumn={detail.sortColumn} sortOrder={detail.sortOrder} field={col.field} />}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detail.data.map((row, idx) => (
                                                            <tr key={idx}>
                                                                {activeConfig.detailColumns.map(col => (
                                                                    <td key={col.field}>
                                                                        {formatCellValue(row[col.field])}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <Pagination
                                                pageIndex={detail.page}
                                                pageSize={detail.pageSize}
                                                totalRecords={detail.total}
                                                onPageChange={(newPage) => dispatch(fetchDetail({
                                                    categoryName: activeCategoryName,
                                                    subCategory: detail.selectedSubCategory,
                                                    pageIndex: newPage,
                                                    searchText: detail.searchInput,
                                                    sortColumn: detail.sortColumn,
                                                    sortOrder: detail.sortOrder,
                                                }))}
                                            />
                                        </>
                                    ) : (
                                        <p style={{ marginTop: '20px', color: '#666' }}>No detail records found.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default SupportMonitoring;