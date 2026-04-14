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
    const [startDate, setStartDate] = useState(getTodayString());
    const [endDate, setEndDate] = useState(getTodayString());

    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- SUMMARY STATE ---
    const [summaryData, setSummaryData] = useState([]);
    const [summaryTotal, setSummaryTotal] = useState(0);
    const [summaryPage, setSummaryPage] = useState(0);
    const [summaryPageSize] = useState(10); 
    const [summarySearchInput, setSummarySearchInput] = useState('');
    const [summarySortCol, setSummarySortCol] = useState('');
    const [summarySortOrder, setSummarySortOrder] = useState('');

    // --- DETAIL STATE ---
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [detailTotal, setDetailTotal] = useState(0);
    const [detailPage, setDetailPage] = useState(0);
    const [detailPageSize] = useState(10);
    const [detailSearchInput, setDetailSearchInput] = useState('');
    const [detailSortCol, setDetailSortCol] = useState('');
    const [detailSortOrder, setDetailSortOrder] = useState('');

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
            return data;
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
        setSummarySortCol('');
        setSummarySortOrder('');

        await fetchSummary(categoryName, 0, '', '', '');
    };

    const handleMasterRowClick = async (row) => {
        const categoryName = tabs[activeTab].category;
        const config = CATEGORY_CONFIGS[categoryName];

        if (!config || config.viewType !== 'master-detail' || !config.detailLoaderFn) return;

        setSelectedSubCategory(row.metricName);
        setDetailSearchInput(''); 
        setDetailSortCol('');
        setDetailSortOrder('');

        await fetchDetail(row.metricName, 0, '', '', '');
    };

    const activeCategoryName = activeTab !== null ? tabs[activeTab].category : null;
    const activeConfig = activeCategoryName ? CATEGORY_CONFIGS[activeCategoryName] : null;

    const fetchData = async () => {
        const data = await fetchSupportMonitoringTabs();
        const currentCategory = activeTab !== null && tabs[activeTab] ? tabs[activeTab].category : null;

        if (data && data.length > 0) {
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

    useEffect(() => {
        const loadInitialData = async () => {
            const data = await fetchSupportMonitoringTabs();

            if (data && data.length > 0) {
                const defaultIndex = data.findIndex(t => t.category === "Application Errors");
                const indexToSelect = defaultIndex !== -1 ? defaultIndex : 0;
                handleTabClick(data[indexToSelect].category, indexToSelect);
            }
        };

        loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onStartDateChange = (date) => setStartDate(date);
    const onEndDateChange = (date) => setEndDate(date);
    
    const setToday = () => {
        const todayStr = getTodayString();
        setStartDate(todayStr);
        setEndDate(todayStr);
    }

    // --- SUMMARY FETCH & SORT ---
    const fetchSummary = async (categoryName, pageIdx, searchTxt, sortCol = summarySortCol, sortOrd = summarySortOrder) => {
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
                sortColumn: sortCol,
                sortOrder: sortOrd,
                searchText: searchTxt,
                startDate,
                endDate
            };
            const res = await config.summaryLoaderFn(payload);

            const dataArr = res.data ? (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) : (Array.isArray(res) ? res : []);
            const total = res.totalRecords || res.totalRows || (dataArr[0] && dataArr[0].totalRows) || dataArr.length || 0;

            setSummaryData(flattenRowAttributes(dataArr));
            setSummaryTotal(total);
            setSummaryPage(pageIdx);
            setSummarySortCol(sortCol);
            setSummarySortOrder(sortOrd);
        } catch (err) {
            console.error(`Error fetching summary for ${categoryName}: `, err);
            setError(`Failed to load data.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSummarySort = (field) => {
        let newOrder = 'asc';
        if (summarySortCol === field) {
            if (summarySortOrder === 'asc') newOrder = 'desc';
            else if (summarySortOrder === 'desc') newOrder = '';
        }
        fetchSummary(activeCategoryName, 0, summarySearchInput, field, newOrder);
    };

    // --- DETAIL FETCH & SORT ---
    const fetchDetail = async (subCategory, pageIdx, searchTxt, sortCol = detailSortCol, sortOrd = detailSortOrder) => {
        const categoryName = tabs[activeTab].category;
        const config = CATEGORY_CONFIGS[categoryName];
        if (!config || !config.detailLoaderFn) return;

        setIsDetailLoading(true);
        try {
            const payload = {
                pageIndex: pageIdx,
                pageSize: detailPageSize,
                sortColumn: sortCol,
                sortOrder: sortOrd,
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
            setDetailSortCol(sortCol);
            setDetailSortOrder(sortOrd);
        } catch (err) {
            console.error(`Error fetching detail for ${subCategory}: `, err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleDetailSort = (field) => {
        let newOrder = 'asc';
        if (detailSortCol === field) {
            if (detailSortOrder === 'asc') newOrder = 'desc';
            else if (detailSortOrder === 'desc') newOrder = '';
        }
        fetchDetail(selectedSubCategory, 0, detailSearchInput, field, newOrder);
    };


    return (
        <div className="page-container">
            <div className="filter-bar">
                <button className="btn-outline" onClick={setToday}>Today</button>

                <div className="date-input-group">
                    <label>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
                </div>

                <div className="date-input-group">
                    <label>End Date</label>
                    <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
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
                                const chartNode = (activeConfig.hasChart && summaryData.length > 0) ? (
                                    <div className="chart-container" style={isStackedLayout ? { width: '100%', flex: 'none', marginBottom: '40px' } : {}}>
                                        <h3 className="chart-title">{activeConfig.title || activeCategoryName}</h3>
                                        <CategoryChart config={activeConfig.chart} data={summaryData} />
                                    </div>
                                ) : null;

                                return (
                                    <div className={isStackedLayout ? "layout-stacked" : "layout-side-by-side"} style={isStackedLayout ? { display: 'flex', flexDirection: 'column' } : {}}>

                                        {isStackedLayout && chartNode}

                                        <div className="table-container" style={isStackedLayout ? { width: '100%', flex: 'none' } : {}}>
                                            <div className="table-controls">
                                                <span className="record-count">Total Record(s): {summaryTotal}</span>
                                                <div className="search-bar">
                                                    <input
                                                        type="text"
                                                        placeholder="Search..."
                                                        value={summarySearchInput}
                                                        onChange={(e) => setSummarySearchInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && fetchSummary(activeCategoryName, 0, summarySearchInput, summarySortCol, summarySortOrder)}
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
                                                                        <th 
                                                                            key={col.field}
                                                                            onClick={() => col.sortable ? handleSummarySort(col.field) : null}
                                                                            style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                                                                        >
                                                                            {col.header}
                                                                            {col.sortable && <SortIcon sortColumn={summarySortCol} sortOrder={summarySortOrder} field={col.field} />}
                                                                        </th>
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
                                                        onPageChange={(newPage) => fetchSummary(activeCategoryName, newPage, summarySearchInput, summarySortCol, summarySortOrder)}
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
                                                onKeyDown={(e) => e.key === 'Enter' && fetchDetail(selectedSubCategory, 0, detailSearchInput, detailSortCol, detailSortOrder)}
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
                                                                <th 
                                                                    key={col.field}
                                                                    onClick={() => col.sortable ? handleDetailSort(col.field) : null}
                                                                    style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                                                                >
                                                                    {col.header}
                                                                    {col.sortable && <SortIcon sortColumn={detailSortCol} sortOrder={detailSortOrder} field={col.field} />}
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
                                                onPageChange={(newPage) => fetchDetail(selectedSubCategory, newPage, detailSearchInput, detailSortCol, detailSortOrder)}
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