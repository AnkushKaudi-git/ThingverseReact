import { useState, useEffect, useRef } from "react";
import './support-monitoring.css'
import { getSupportMonitoringTabs } from "../services/support-monitoring.service";
import { CATEGORY_CONFIGS } from '../constants/support-monitoring-configs';
import { Chart } from "chart.js/auto";
import { formatUtcToLocal } from "../../../../services/datetime/datetime.service";
import Spinner from "../../../../components/spinner/spinner";

const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

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
                backgroundColor: idx === 0 ? "#F44336" : "#FFC107",
                borderWidth: 1,
                maxBarThickness: MAX_BAR_WIDTH
            }));
        } else if (config.valueFromAttributes) {
            datasets = [{
                label: config.yLabel,
                data: data.map(row => Number(row[config.valueFromAttributes] || 0)),
                backgroundColor: "#5d4e99",
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
                            // Truncate long labels to 15 chars + '...'
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
    }, [data, config]);

    return (
        <div style={{ height: '300px', marginBottom: '20px' }}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

function SupportMonitoring() {
    // Date filter states
    const [startDate, setStartDate] = useState(getTodayString());
    const [endDate, setEndDate] = useState(getTodayString());

    // Support Monitoring Tabs and active tab state
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    // Loading state
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- SUMMARY STATE ---
    const [summaryData, setSummaryData] = useState([]);
    const [summaryTotal, setSummaryTotal] = useState(0);
    const [summaryPage, setSummaryPage] = useState(0);
    const [summaryPageSize] = useState(10); // Smaller size for side-by-side as per image
    const [summarySearchInput, setSummarySearchInput] = useState('');

    // --- DETAIL STATE ---
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [detailTotal, setDetailTotal] = useState(0);
    const [detailPage, setDetailPage] = useState(0);
    const [detailPageSize] = useState(10);
    const [detailSearchInput, setDetailSearchInput] = useState('');

    const flattenRowAttributes = (rows) => {
        return rows.map(row => {
            let attrs = {};
            try { if (row.attributes) attrs = JSON.parse(row.attributes); } catch (e) { }
            return { ...row, ...attrs };
        });
    };

    const fetchSupportMonitoringTabs = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const payload = {
                pageIndex: 0,
                pageSize: 21,
                startDate: startDate,
                endDate: endDate
            }

            const data = await getSupportMonitoringTabs(payload);
            setTabs(data);
            return data; // Return data so callers can use it to set the active tab
        } catch (err) {
            console.error("Error fetching support monitoring tabs: ", err);
            setError("Failed to load support monitoring tabs. Please try again.");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabClick = async (categoryName, index) => {
        setActiveTab(index);
        setSelectedSubCategory(null);
        setSummaryData([]);
        setSummarySearchInput('');

        await fetchSummary(categoryName, 0, '');
    };

    const handleMasterRowClick = async (row) => {
        const categoryName = tabs[activeTab].category;
        const config = CATEGORY_CONFIGS[categoryName];

        if (!config || config.viewType !== 'master-detail' || !config.detailLoaderFn) return;

        setSelectedSubCategory(row.metricName);
        setDetailSearchInput(''); // Clear out any old search terms when opening a new detail view

        // Let fetchDetail handle the API call, payload formatting, and all pagination states
        await fetchDetail(row.metricName, 0, '');
    };

    const activeCategoryName = activeTab !== null ? tabs[activeTab].category : null;
    const activeConfig = activeCategoryName ? CATEGORY_CONFIGS[activeCategoryName] : null;

    const fetchData = async () => {
        const data = await fetchSupportMonitoringTabs();

        // Capture the currently selected category name before the state updates
        const currentCategory = activeTab !== null && tabs[activeTab] ? tabs[activeTab].category : null;

        if (data && data.length > 0) {
            if (currentCategory) {
                // If a tab was already selected, find its index in the newly fetched tabs and reload it
                const newIndex = data.findIndex(t => t.category === currentCategory);
                const indexToSelect = newIndex !== -1 ? newIndex : 0; // Fallback to 0 if missing
                handleTabClick(data[indexToSelect].category, indexToSelect);
            } else {
                // If no tab was selected (edge case), default to Application Errors
                const defaultIndex = data.findIndex(t => t.category === "Application Errors");
                const indexToSelect = defaultIndex !== -1 ? defaultIndex : 0;
                handleTabClick(data[indexToSelect].category, indexToSelect);
            }
        }
    }

    useEffect(() => {
        const loadInitialData = async () => {
            const data = await fetchSupportMonitoringTabs();

            if (data && data.length > 0) {
                // Find "Application Errors" to set as default, fallback to 0 if it doesn't exist
                const defaultIndex = data.findIndex(t => t.category === "Application Errors");
                const indexToSelect = defaultIndex !== -1 ? defaultIndex : 0;

                handleTabClick(data[indexToSelect].category, indexToSelect);
            }
        };

        loadInitialData();
    }, []);

    const onStartDateChange = (date) => {
        setStartDate(date);
    }

    const onEndDateChange = (date) => {
        setEndDate(date);
    }

    const setToday = () => {
        const todayStr = getTodayString();
        setStartDate(todayStr);
        setEndDate(todayStr);
    }

    const fetchSummary = async (categoryName, pageIdx, searchTxt) => {
        setIsLoading(true);
        setError(null);
        const config = CATEGORY_CONFIGS[categoryName];

        if (!config || !config.summaryLoaderFn) {
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                pageIndex: pageIdx,
                pageSize: summaryPageSize,
                sortColumn: '',
                sortOrder: '',
                searchText: searchTxt,
                startDate,
                endDate
            };
            const res = await config.summaryLoaderFn(payload);

            // Safely parse data and total count depending on your specific API response shape
            const dataArr = res.data ? (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) : (Array.isArray(res) ? res : []);
            const total = res.totalRecords || res.totalRows || (dataArr[0] && dataArr[0].totalRows) || dataArr.length || 0;

            setSummaryData(flattenRowAttributes(dataArr));
            setSummaryTotal(total);
            setSummaryPage(pageIdx);
        } catch (err) {
            console.error(`Error fetching summary for ${categoryName}: `, err);
            setError(`Failed to load data.`);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDetail = async (subCategory, pageIdx, searchTxt) => {
        const categoryName = tabs[activeTab].category;
        const config = CATEGORY_CONFIGS[categoryName];
        if (!config || !config.detailLoaderFn) return;

        setIsDetailLoading(true);
        try {
            const payload = {
                pageIndex: pageIdx,
                pageSize: detailPageSize,
                sortColumn: '',
                sortOrder: '',
                searchText: searchTxt,
                startDate,
                endDate
            };
            const res = await config.detailLoaderFn(payload, subCategory);

            const dataArr = res.data ? (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) : (Array.isArray(res) ? res : []);
            const total = res.totalRecords || res.totalRows || (dataArr[0] && dataArr[0].totalRows) || dataArr.length || 0;

            setDetailData(flattenRowAttributes(dataArr));
            setDetailTotal(total);
            setDetailPage(pageIdx);
        } catch (err) {
            console.error(`Error fetching detail for ${subCategory}: `, err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="filter-bar">
                <button className="btn-outline" onClick={setToday}>Today</button>

                <div className="date-input-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                    />
                </div>

                <div className="date-input-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                    />
                </div>

                <button className="btn-solid" onClick={fetchData} disabled={isLoading}>
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
                            >
                                <span className="tab-text">{tab.category}</span>
                            </button>
                        ))}
                    </div>
                </Spinner>
                <div className="content-area" style={{ padding: '0 20px', width: '100%' }}>
                    {/* {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>} */}

                    {!activeConfig && !isLoading && activeCategoryName && (
                        <p>No configuration defined for <strong>{activeCategoryName}</strong>.</p>
                    )}

                    {activeConfig && (
                        <div className="category-view">

                            {/* --- SIDE BY SIDE LAYOUT FOR SUMMARY AND CHART --- */}
                            <div className="layout-side-by-side">
                                {/* SUMMARY TABLE */}
                                <div className="table-container">
                                    <div className="table-controls">
                                        <span className="record-count">Total Record(s): {summaryTotal}</span>
                                        <div className="search-bar">
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={summarySearchInput}
                                                onChange={(e) => setSummarySearchInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && fetchSummary(activeCategoryName, 0, summarySearchInput)}
                                            />
                                            <i className="search-icon">🔍</i>
                                        </div>
                                    </div>

                                    {summaryData.length > 0 ? (
                                        <>
                                            <div className="table-responsive">
                                                <table className="custom-data-table">
                                                    <thead>
                                                        <tr>
                                                            {activeConfig.summaryColumns.map(col => (
                                                                <th key={col.field}>{col.header}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {summaryData.map((row, idx) => (
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
                                                pageIndex={summaryPage}
                                                pageSize={summaryPageSize}
                                                totalRecords={summaryTotal}
                                                onPageChange={(newPage) => fetchSummary(activeCategoryName, newPage, summarySearchInput)}
                                            />
                                        </>
                                    ) : (
                                        !isLoading && <p style={{ marginTop: '20px', color: '#666' }}>No data available.</p>
                                    )}
                                </div>

                                {/* CHART */}
                                {activeConfig.hasChart && (
                                    <div className="chart-container">
                                        {summaryData.length > 0 ? (
                                            <div>
                                                <h3 className="chart-title">{activeConfig.title || activeCategoryName}</h3>
                                                <CategoryChart config={activeConfig.chart} data={summaryData} />
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            {/* --- DETAIL TABLE BELOW --- */}
                            {activeConfig.viewType === 'master-detail' && selectedSubCategory && (
                                <div className="detail-section" style={{ marginTop: '50px' }}>
                                    <div className="table-controls">
                                        <span className="record-count">Total Record(s): {detailTotal}</span>
                                        <div className="search-bar">
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={detailSearchInput}
                                                onChange={(e) => setDetailSearchInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && fetchDetail(selectedSubCategory, 0, detailSearchInput)}
                                            />
                                            <i className="search-icon">🔍</i>
                                        </div>
                                    </div>

                                    {isDetailLoading ? (
                                        <p style={{ marginTop: '20px', color: '#666' }}>Loading details...</p>
                                    ) : detailData.length > 0 ? (
                                        <>
                                            <div className="table-responsive">
                                                <table className="custom-data-table">
                                                    <thead>
                                                        <tr>
                                                            {activeConfig.detailColumns.map(col => (
                                                                <th key={col.field}>
                                                                    {col.header} <span style={{ color: '#999', fontSize: '10px', marginLeft: '5px' }}>↓↑</span>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailData.map((row, idx) => (
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
                                                pageIndex={detailPage}
                                                pageSize={detailPageSize}
                                                totalRecords={detailTotal}
                                                onPageChange={(newPage) => fetchDetail(selectedSubCategory, newPage, detailSearchInput)}
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