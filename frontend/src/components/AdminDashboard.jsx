import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Bar } from 'react-chartjs-2';
import API_BASE_URL from "../api.js";
import "../styles/GlobalDesignSystem.css";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalOtherIncome: 0, // ✅ NEW
    totalSupplierExpenses: 0,
    totalBills: 0,
    totalSalaries: 0,
    totalOtherExpenses: 0, // ✅ NEW
    totalCost: 0,
    netProfit: 0,
    totalOrders: 0,
    totaldeliveryOrders: 0,
    totaldeliveryOrdersIncome: 0,
    totalOrdersIncome: 0,
    totalOrdersNetIncome: 0,
    statusCounts: {},
    delayedOrders: 0,
    nextDayStatusUpdates: 0,
    paymentBreakdown: { cash: 0, cashdue: 0, card: 0, bank: 0 },
    topMenus: []
  });

  const [filterType, setFilterType] = useState("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);

  const symbol = localStorage.getItem("currencySymbol") || "$";

  // Load dashboard data
  useEffect(() => {
    fetchSummary();
  }, [filterType, customStart, customEnd]);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");

      let payload = {};

      switch (filterType) {
        case "today":
          const today = new Date();
          payload.startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
          payload.endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString();
          break;

        case "thisWeek":
          const now = new Date();
          const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          payload.startDate = firstDayOfWeek.toISOString();
          payload.endDate = new Date().toISOString();
          break;

        case "thisMonth":
          const todayMonth = new Date();
          const firstOfMonth = new Date(todayMonth.getFullYear(), todayMonth.getMonth(), 1);
          const lastOfMonth = new Date(todayMonth.getFullYear(), todayMonth.getMonth() + 1, 0);
          payload.startDate = firstOfMonth.toISOString();
          payload.endDate = lastOfMonth.toISOString();
          break;

        case "custom":
          if (!customStart || !customEnd) return;
          payload.startDate = new Date(customStart).toISOString();
          payload.endDate = new Date(customEnd).toISOString();
          break;

        default:
          break;
      }

      const res = await axios.get(`${API_BASE_URL}/api/auth/admin/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: payload
      });

      setSummary(res.data);
    } catch (err) {
      console.error("Failed to load dashboard summary:", err.message);
      alert("Failed to load admin summary");
    } finally {
      setLoading(false);
    }
  };

  // // Prepare chart data for Order Type + Delivery Places
  // const orderTypeLabels = [];
  // const orderTypeCounts = [];
  // const orderTypeTotals = [];

  // // Add Dine-In and Takeaway
  // ["Dine-In", "Takeaway"].forEach(type => {
  //   const data = summary.orderTypeBreakdown?.[type] || { count: 0, total: 0 };
  //   orderTypeLabels.push(type);
  //   orderTypeCounts.push(data.count);
  //   orderTypeTotals.push(data.total);
  // });

  // // Add Delivery as a group, but expand by place
  // const deliveryData = summary.orderTypeBreakdown?.Delivery || { byPlace: {} };
  // const deliveryPlaces = Object.keys(deliveryData.byPlace);

  // if (deliveryPlaces.length > 0) {
  //   deliveryPlaces.forEach(place => {
  //     const placeData = deliveryData.byPlace[place];
  //     orderTypeLabels.push(`Delivery: ${place}`);
  //     orderTypeCounts.push(placeData.count);
  //     orderTypeTotals.push(placeData.total);
  //   });
  // } else {
  //   // Fallback if no delivery places
  //   orderTypeLabels.push("Delivery");
  //   orderTypeCounts.push(deliveryData.count);
  //   orderTypeTotals.push(deliveryData.total);
  // }

  // const orderTypeChartData = {
  //   labels: orderTypeLabels,
  //   datasets: [
  //     {
  //       label: 'Number of Orders',
  //       data: orderTypeCounts,
  //       backgroundColor: 'rgba(54, 162, 235, 0.6)',
  //       yAxisID: 'y'
  //     },
  //     {
  //       label: 'Total Income ($)',
  //       data: orderTypeTotals,
  //       backgroundColor: 'rgba(255, 99, 132, 0.6)',
  //       yAxisID: 'y1'
  //     }
  //   ]
  // };

  // const orderTypeChartOptions = {
  //   responsive: true,
  //   scales: {
  //     y: {
  //       type: 'linear',
  //       display: true,
  //       position: 'left',
  //       title: {
  //         display: true,
  //         text: 'Number of Orders'
  //       }
  //     },
  //     y1: {
  //       type: 'linear',
  //       display: true,
  //       position: 'right',
  //       title: {
  //         display: true,
  //         text: 'Total Income ($)'
  //       },
  //       grid: {
  //         drawOnChartArea: false
  //       }
  //     }
  //   }
  // };

  const orderTypeData = summary.orderTypeSummary || {
    dineIn: { count: 0, total: 0 },
    takeaway: { count: 0, total: 0 },
    delivery: { count: 0, total: 0 }
  };

  const orderTypeLabels = ["Dine-In", "Takeaway - Customer Pickup", "Takeaway - Delivery Service"];
  const orderCounts = [
    orderTypeData.dineIn.count,
    orderTypeData.takeaway.count,
    orderTypeData.delivery.count
  ];
  const orderTotals = [
    orderTypeData.dineIn.total,
    orderTypeData.takeaway.total,
    orderTypeData.delivery.total
  ];

  const orderTypeChartData = {
    labels: orderTypeLabels,
    datasets: [
      {
        label: 'Number of Orders',
        data: orderCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.7)', // Blue
        yAxisID: 'y'
      },
      {
        label: 'Total Income',
        data: orderTotals,
        backgroundColor: 'rgba(255, 99, 132, 0.7)', // Red
        yAxisID: 'y1'
      }
    ]
  };

  const orderTypeChartOptions = {
    responsive: true,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Order Count'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: `Total Income (${symbol})`
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // ✅ Cost Breakdown Chart Data
  const costChartData = {
    labels: ["Supplier Expenses", "Utility Bills", "Staff Salaries", "Other Expenses"], // ✅ UPDATED
    datasets: [{
      label: "Expenses",
      data: [
        summary.totalSupplierExpenses,
        summary.totalBills,
        summary.totalSalaries,
        summary.totalOtherExpenses // ✅ NEW
      ],
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#FF9F40"] // ✅ ADDED Orange for Other Expenses
    }]
  };

  // ✅ Order Status Pie Chart
  const statusChartData = {
    labels: Object.keys(summary.statusCounts),
    datasets: [{
      label: "Order Status",
      data: Object.values(summary.statusCounts),
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      hoverOffset: 4
    }]
  };

  // ✅ Payment Method Doughnut Chart
  const paymentChartData = {
    labels: ["Cash", "Card", "Bank Transfer"],
    datasets: [{
      label: "Payment Methods",
      data: [
        (summary.paymentBreakdown.cash - summary.paymentBreakdown.cashdue),
        summary.paymentBreakdown.card,
        summary.paymentBreakdown.bank
      ],
      backgroundColor: ["#4CAF50", "#2196F3", "#FF9800"]
    }]
  };

  // ✅ Top Menus Bar Chart Data
  const topMenuData = {
    labels: summary.topMenus.map(m => m.name),
    datasets: [{
      label: "Units Sold",
      data: summary.topMenus.map(m => m.count),
      backgroundColor: "#4CAF50"
    }]
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-primary fw-bold">Admin Dashboard</h2>
          <p className="text-muted mb-0">Overview of your restaurant performance</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Time Period Filter</h6>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Select Timeframe</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-select"
              >
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {filterType === "custom" && (
              <>
                <div className="col-md-3">
                  <label className="form-label">From</label>
                  <input
                    type="date"
                    className="form-control"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">To</label>
                  <input
                    type="date"
                    className="form-control"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="col-md-3">
              <button onClick={fetchSummary} className="btn btn-primary w-100">
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-5">
        {[
          {
            label: "Total Orders",
            value: `${summary.totalOrders}`,
            bg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            icon: "🛒"
          },
          {
            label: "Orders Income",
            sub: `Net: ${symbol}${formatCurrency(summary.totalOrdersNetIncome)}`,
            value: `${symbol}${formatCurrency(summary.totalOrdersIncome)}`,
            bg: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
            icon: "💳"
          },
          {
            label: "Delivery Orders",
            sub: `Charges: ${symbol}${formatCurrency(summary.totaldeliveryOrdersIncome)}`,
            value: `${summary.totaldeliveryOrders}`,
            bg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            icon: "🚚"
          },
          {
            label: "Dine-In Orders",
            sub: `Service: ${symbol}${formatCurrency(summary.totalServiceChargeIncome)}`,
            value: `${summary.totalTableOrders}`,
            bg: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
            icon: "🍽️"
          },
          {
            label: "Other Income",
            value: `${symbol}${formatCurrency(summary.totalOtherIncome)}`,
            bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            icon: "🎁"
          },
          {
            label: "Total Income",
            value: `${symbol}${formatCurrency(summary.totalIncome)}`,
            bg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            icon: "💰"
          },
          {
            label: "Other Expenses",
            value: `${symbol}${formatCurrency(summary.totalOtherExpenses)}`,
            bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            icon: "🔧"
          },
          {
            label: "Total Cost",
            value: `${symbol}${formatCurrency(summary.totalCost)}`,
            bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            icon: "📉"
          },
          {
            label: "Net Profit",
            value: `${summary.netProfit >= 0 ? "+" : "-"}${symbol}${formatCurrency(Math.abs(summary.netProfit))}`,
            bg: summary.netProfit >= 0 ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            icon: summary.netProfit >= 0 ? "📈" : "⚠️",
          }
        ].map((card, idx) => (
          <div className="col-6 col-md-3" key={idx}>
            <div
              className="card stat-card text-white h-100"
              style={{
                background: card.bg,
                border: "none",
              }}
            >
              <div className="card-body text-center py-3 px-2">
                <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>{card.icon}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.9, marginBottom: "6px" }}>{card.label}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{card.value}</div>
                {card.sub && <div style={{ fontSize: "0.7rem", opacity: 0.85, marginTop: "4px" }}>{card.sub}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="mb-0">Orders by Type & Delivery Place</h6>
            </div>
            <div className="card-body">
              <Bar data={orderTypeChartData} options={orderTypeChartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="mb-0">Order Status</h6>
            </div>
            <div className="card-body">
              <Doughnut data={statusChartData} />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="mb-0">Payment Methods</h6>
            </div>
            <div className="card-body">
              <Doughnut data={paymentChartData} />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="mb-0">Cost Breakdown</h6>
            </div>
            <div className="card-body">
              <Doughnut data={costChartData} options={{ plugins: { legend: { position: "bottom" } } }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tables Section */}
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="mb-0">Top Ordered Menu Items</h6>
            </div>
            <div className="card-body">
              <ul className="list-group">
                {summary.topMenus.length === 0 && (
                  <li className="list-group-item text-muted">No data</li>
                )}
                {summary.topMenus.slice(0, 10).map((item, idx) => (
                  <li
                    key={idx}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    {item.name}
                    <span className="badge badge-primary">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="mb-0">Order Summary</h6>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.statusCounts).map(([status, count], idx) => (
                    <tr key={idx}>
                      <td>{status}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Delayed Completed</td>
                    <td>{summary.delayedOrders}</td>
                  </tr>
                  <tr>
                    <td>Delayed Completed (Day After)</td>
                    <td>{summary.nextDayStatusUpdates}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="mb-0">Payment Summary</h6>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Cash", (summary.paymentBreakdown.cash - summary.paymentBreakdown.cashdue)],
                    ["Card", summary.paymentBreakdown.card],
                    ["Bank Transfer", summary.paymentBreakdown.bank],
                  ].map(([label, val], idx) => (
                    <tr key={idx}>
                      <td>{label}</td>
                      <td>{symbol}{formatCurrency(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Waiter Service Charge Earnings */}
      <div className="row g-4 mt-2">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Waiters – Total Service Charge Earned</h6>
            </div>
            <div className="card-body">
              {summary.waiterServiceEarnings?.length > 0 ? (
                <ul className="list-group">
                  {summary.waiterServiceEarnings.slice(0, 10).map((entry, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span>{entry.waiterName || "Unknown Waiter"}</span>
                      <span className="badge badge-success">
                        {symbol}{formatCurrency(entry.totalServiceCharge)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No waiter service charge data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Places Breakdown */}
      <div className="row g-4 mt-2">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Delivery Places – Order Count & Revenue</h6>
            </div>
            <div className="card-body">
              {summary.deliveryPlacesBreakdown?.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Place</th>
                      <th>Orders</th>
                      <th>Revenue ({symbol})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.deliveryPlacesBreakdown.map((place, idx) => (
                      <tr key={idx}>
                        <td>{place.placeName}</td>
                        <td>{place.count}</td>
                        <td>{formatCurrency(place.totalCharge)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">No delivery place data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default AdminDashboard;