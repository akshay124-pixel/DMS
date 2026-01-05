import { useState, useEffect } from "react";
import api, { getAuthData, setNavigationFunction, clearNavigationFunction } from "../../api/api";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import {
  PlayArrow,
  GetApp,
  Refresh,
  ArrowBack,
  Phone,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import RecordingPlayerModal from "./RecordingPlayerModal";

const CallHistoryPage = () => {
  const navigate = useNavigate();
  
  // Set navigation function for API interceptors
  useEffect(() => {
    setNavigationFunction(navigate);
    return () => {
      clearNavigationFunction();
    };
  }, [navigate]);
  
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCalls, setTotalCalls] = useState(0);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: "",
    direction: "",
    startDate: "",
    endDate: "",
    destinationNumber: "",
    virtualNumber: "", // NEW: Virtual number filter
    hasRecording: "",
  });
  
  // Recording player
  const [selectedCall, setSelectedCall] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  
  // User info
  const [userRole, setUserRole] = useState("");
  
  useEffect(() => {
    // Get user role from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role || "");
      } catch (error) {
        console.error("Token decode error:", error);
        // If token is invalid, redirect to login
        navigate("/login");
        return;
      }
    } else {
      // No token, redirect to login
      navigate("/login");
      return;
    }
    
    // Only fetch data if we have a valid token
    fetchCallHistory();
    fetchStats();
  }, [page, rowsPerPage, navigate]);
  
  const fetchCallHistory = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === "" || params[key] === undefined) {
          delete params[key];
        }
      });
      
      console.log("📞 Fetching call history with params:", params);
      
      const response = await api.get("/api/calls", {
        params,
      });
      
      // Call history response logged only in development
      if (process.env.NODE_ENV === 'development') {
        console.log("📞 Call history response:", response.data);
      }
      
      if (response.data.success) {
        setCalls(response.data.data);
        setTotalCalls(response.data.pagination.total);
      } else {
        throw new Error(response.data.message || "Failed to fetch call history");
      }
    } catch (error) {
      console.error("Fetch call history error:", error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      toast.error(error.response?.data?.message || "Failed to fetch call history");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      console.log("📊 Fetching call stats with params:", params);
      
      const response = await api.get("/api/calls/stats", {
        params,
      });
      
      // Call stats response logged only in development
      if (process.env.NODE_ENV === 'development') {
        console.log("📊 Call stats response:", response.data);
      }
      
      if (response.data.success) {
        const statsData = response.data.data;
        
        // Ensure completionRate is a number
        if (statsData.completionRate) {
          statsData.completionRate = parseFloat(statsData.completionRate);
        }
        
        console.log("📊 Processed stats data:", statsData);
        setStats(statsData);
      } else {
        throw new Error(response.data.message || "Failed to fetch stats");
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      // Set default stats to prevent UI issues
      setStats({
        totalCalls: 0,
        inboundCalls: 0,
        outboundCalls: 0,
        completedCalls: 0,
        answeredCalls: 0,
        failedCalls: 0,
        noAnswerCalls: 0,
        completionRate: 0
      });
      console.warn("Stats fetch failed, using default stats");
    }
  };
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const handleApplyFilters = () => {
    if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
      toast.error("Start date must be before end date");
      return;
    }
    setPage(0);
    fetchCallHistory();
    fetchStats();
  };
  
  const handleRefreshData = async () => {
    try {
      setLoading(true);
      
      // Smart cache refresh - only refresh call-related data
      await api.post("/api/calls/refresh-cache", {
        dataType: 'calls',
        userId: null // Refresh for current user
      });
      
      // Immediately fetch fresh data
      await Promise.all([
        fetchCallHistory(),
        fetchStats()
      ]);
      
      toast.success("Fresh data loaded!");
    } catch (error) {
      console.error("Smart refresh error:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: "",
      direction: "",
      startDate: "",
      endDate: "",
      destinationNumber: "",
      virtualNumber: "", // NEW: Clear virtual number filter
      hasRecording: "",
    };
    setFilters(clearedFilters);
    setPage(0);
    
    // Fetch immediately with cleared filters
    const fetchWithClearedFilters = async () => {
      setLoading(true);
      try {
        const params = {
          page: 1,
          limit: rowsPerPage,
        };
        
        const response = await api.get("/api/calls", {
          params,
        });
        
        if (response.data.success) {
          setCalls(response.data.data);
          setTotalCalls(response.data.pagination.total);
        }
        
        // Fetch stats without date filters
        const statsResponse = await api.get("/api/calls/stats");
        if (statsResponse.data.success) {
          const statsData = statsResponse.data.data;
          
          // Ensure completionRate is a number
          if (statsData.completionRate) {
            statsData.completionRate = parseFloat(statsData.completionRate);
          }
          
          setStats(statsData);
        }
        
        toast.success("Filters reset successfully!");
      } catch (error) {
        console.error("Reset filters error:", error);
        toast.error("Failed to reset filters");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWithClearedFilters();
  };
  
  const handleExport = async () => {
    try {
      const payload = {
        ...filters,
        format: "csv",
      };
      
      const response = await api.post("/api/calls/export", payload, {
        responseType: "blob",
      });
      
      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `call-history-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Call history exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export call history");
    }
  };
  
  const handlePlayRecording = (call) => {
    setSelectedCall(call);
    setPlayerOpen(true);
  };
  
  const getStatusColor = (status) => {
    const colors = {
      completed: "success",
      answered: "info",
      failed: "error",
      no_answer: "warning",
      busy: "warning",
      cancelled: "default",
      initiated: "default",
      ringing: "info",
    };
    return colors[status] || "default";
  };
  
  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading && calls.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box p={3} sx={{ background: "#f5f7fa", minHeight: "100vh" }}>
      {/* Date Range Filter Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: "15px",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
          border: "none",
          background: "white"
        }}
      > 
        <Box 
          display="flex" 
          alignItems="center" 
          gap={2} 
          flexWrap="wrap"
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" }
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/dashboard")}
            sx={{
              background: "white",
              color: "#2575fc",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              px: 2,
              "&:hover": {
                background: "#f0f0f0",
              }
            }}
          >
            Back to Dashboard
          </Button>
      
          <Button
            variant="contained"
            startIcon={<GetApp />}
            onClick={handleExport}
            sx={{
              background: "linear-gradient(90deg, #10b981, #059669)",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: "12px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              width: { xs: "100%", sm: "auto" },
              ml: { xs: 0, sm: "auto" },
              "&:hover": {
                background: "linear-gradient(90deg, #059669, #047857)",
                transform: "translateY(-2px)",
                boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
              },
              transition: "all 0.2s ease"
            }}
          >
            Export CSV
          </Button>

          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 120 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange("status", e.target.value)}
              sx={{
                borderRadius: "10px",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2575fc",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2575fc",
                }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="answered">Answered</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="no_answer">No Answer</MenuItem>
              <MenuItem value="busy">Busy</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 120 } }}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={filters.direction}
              label="Direction"
              onChange={(e) => handleFilterChange("direction", e.target.value)}
              sx={{
                borderRadius: "10px",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2575fc",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2575fc",
                }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="outbound">Outbound</MenuItem>
              <MenuItem value="inbound">Inbound</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ 
              minWidth: { xs: "100%", sm: 150 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                "&:hover fieldset": {
                  borderColor: "#2575fc",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#2575fc",
                }
              }
            }}
          />

          <TextField
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ 
              minWidth: { xs: "100%", sm: 150 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                "&:hover fieldset": {
                  borderColor: "#2575fc",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#2575fc",
                }
              }
            }}
          />

          <TextField
            label="Virtual Number"
            value={filters.virtualNumber}
            onChange={(e) => handleFilterChange("virtualNumber", e.target.value)}
            placeholder="Filter by virtual number"
            size="small"
            sx={{ 
              minWidth: { xs: "100%", sm: 150 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                "&:hover fieldset": {
                  borderColor: "#10b981",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#10b981",
                }
              }
            }}
          />

          <Button
            variant="contained"
            onClick={handleApplyFilters}
            sx={{
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: "12px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                background: "linear-gradient(90deg, #2575fc, #6a11cb)",
                transform: "translateY(-2px)",
                boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
              },
              transition: "all 0.2s ease"
            }}
          >
            Apply Filter
          </Button>

          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRefreshData}
            disabled={loading}
            sx={{
              background: "linear-gradient(90deg, #10b981, #059669)",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: "12px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                background: "linear-gradient(90deg, #059669, #047857)",
                transform: "translateY(-2px)",
                boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
              },
              "&:disabled": {
                background: "#e0e0e0",
                color: "#9e9e9e",
              },
              transition: "all 0.2s ease"
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="outlined"
            onClick={handleClearFilters}
            sx={{
              borderColor: "#2575fc",
              color: "#2575fc",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: "12px",
              borderWidth: "2px",
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                borderColor: "#2575fc",
                borderWidth: "2px",
                background: "rgba(37, 117, 252, 0.08)",
                transform: "translateY(-2px)",
              },
              transition: "all 0.2s ease"
            }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {/* Essential Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        {/* Total Calls */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: "15px",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              "&:hover": { 
                transform: "translateY(-4px)", 
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)" 
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom fontWeight={600} fontSize="0.9rem">
                    Total Calls
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="#2575fc">
                    {stats?.totalCalls || 0}
                  </Typography>
                </Box>
                <Box sx={{ 
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                  borderRadius: "50%", 
                  p: 1.5,
                  backdropFilter: "blur(10px)"
                }}>
                  <Phone sx={{ fontSize: 32, color: "white" }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Calls */}
      
        {/* Inbound Calls */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: "15px",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              background: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
              "&:hover": { 
                transform: "translateY(-4px)", 
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)" 
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom fontWeight={600} fontSize="0.9rem">
                    Inbound Calls
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="#f57c00">
                    {stats?.inboundCalls || 0}
                  </Typography>
                </Box>
                <Box sx={{ 
                  background: "linear-gradient(135deg, #f57c00, #ef6c00)", 
                  borderRadius: "50%", 
                  p: 1.5,
                  backdropFilter: "blur(10px)"
                }}>
                  <Phone sx={{ fontSize: 32, color: "white", transform: "rotate(180deg)" }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Outbound Calls */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
           sx={{ 
  borderRadius: "15px",
  boxShadow: "0 6px 18px rgba(46, 125, 50, 0.18)", // 🌿 green shadow
  transition: "all 0.3s ease",
  background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)", // 🍃 light green gradient
  "&:hover": { 
    transform: "translateY(-4px)", 
    boxShadow: "0 10px 28px rgba(46, 125, 50, 0.28)" // stronger green glow
  }
}}

          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom fontWeight={600} fontSize="0.9rem">
                    Outbound Calls
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="#2e7d32">
                    {stats?.outboundCalls || 0}
                  </Typography>
                </Box>
                <Box sx={{ 
                  background:"linear-gradient(135deg, #43cea2, #185a9d)", 
                  borderRadius: "50%", 
                  p: 1.5,
                  backdropFilter: "blur(10px)"
                }}>
                  <Phone sx={{ fontSize: 32, color: "white" }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Success Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: "15px",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              background: "linear-gradient(135deg, #f3e5f5, #e1bee7)",
              "&:hover": { 
                transform: "translateY(-4px)", 
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)" 
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom fontWeight={600} fontSize="0.9rem">
                    Success Rate
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="#8e24aa">
                    {stats?.completionRate ? `${stats.completionRate}%` : '0%'}
                  </Typography>
                </Box>
                <Box sx={{ 
                  background: "linear-gradient(135deg, #8e24aa, #7b1fa2)", 
                  borderRadius: "50%", 
                  p: 1.5,
                  backdropFilter: "blur(10px)"
                }}>
                  <TrendingUp sx={{ fontSize: 32, color: "white" }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Call History Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0"
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight={600} color="#2575fc">
          📞 Call History
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          View and manage your call history with detailed information
        </Typography>

        {loading && calls.length === 0 ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress sx={{ color: "#2575fc" }} />
          </Box>
        ) : (
          <TableContainer sx={{
            maxHeight: "680px",
            borderRadius: "12px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": {
              background: "#c5c5c5",
              borderRadius: "8px",
            },
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{
                  background: "linear-gradient(135deg, #2575fc, #6a11cb)",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Virtual Number</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Agent</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Direction</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "white" }}>Recording</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <CircularProgress size={40} sx={{ color: "#2575fc" }} />
                        <Typography variant="body2" color="textSecondary" fontWeight={600}>
                          Loading call history...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <Typography variant="h6" color="textSecondary" fontWeight={600}>
                          📵 No Call History Available
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          No calls found matching your criteria
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call, index) => (
                    <TableRow 
                      key={call._id}
                      sx={{ 
                        "&:hover": { background: "#f5f7fa" },
                        "&:nth-of-type(odd)": { background: "#fafbfc" }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(call.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(call.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="#2575fc">
                          {call.leadId?.contactName || call.leadId?.customerName || "N/A"}
                        </Typography>
                        {call.leadId?.organization && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {call.leadId.organization}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {call.callDirection === "inbound" ? call.callerId || call.destinationNumber : call.destinationNumber}
                        </Typography>
                        {call.callDirection === "inbound" && (
                          <Typography variant="caption" color="primary" display="block">
                            📞 Incoming Call
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="#10b981">
                          {call.virtualNumber || call.agentNumber || "N/A"}
                        </Typography>
                        {call.queueId && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            Queue: {call.queueId}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {call.userId?.username || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={call.callDirection === "inbound" ? "📞 Inbound" : "📱 Outbound"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            background: call.callDirection === "outbound" 
                              ? "linear-gradient(135deg, #2575fc, #6a11cb)" 
                              : "linear-gradient(135deg, #10b981, #059669)",
                            color: "white"
                          }}
                        />
                        {call.routingReason && call.routingReason !== "outbound" && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            via {call.routingReason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={call.callStatus}
                          size="small"
                          color={getStatusColor(call.callStatus)}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatDuration(call.duration)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {call.recordingUrl ? (
                          <Tooltip title="Play Recording" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handlePlayRecording(call)}
                              sx={{
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                color: "white",
                                width: 32,
                                height: 32,
                                "&:hover": {
                                  background: "linear-gradient(135deg, #059669, #047857)",
                                },
                              }}
                            >
                              <PlayArrow sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Chip 
                            label="No Recording" 
                            size="small" 
                            sx={{ 
                              fontSize: "0.7rem",
                              background: "#f5f5f5",
                              color: "#666"
                            }} 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
  
<TablePagination
  component="div"
  count={totalCalls}
  page={page}
  onPageChange={(e, newPage) => setPage(newPage)}
  rowsPerPage={rowsPerPage}
  onRowsPerPageChange={(e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }}
  rowsPerPageOptions={[25, 50, 100]}
  sx={{
    "& .MuiTablePagination-toolbar": {
      display: "flex",
      alignItems: "center",
      padding: 0,
    },

    /* 🔥 ROWS PER PAGE BLOCK FIX */
    "& .MuiTablePagination-selectLabel": {
      margin: 0,
      marginRight: "6px",
      fontWeight: 600,
      color: "#6b7280",
      lineHeight: "32px",      // ✅ SAME HEIGHT
    },

    "& .MuiTablePagination-select": {
      margin: 0,
      padding: "4px 28px 4px 10px",
      height: "32px",          // ✅ SAME HEIGHT
      display: "flex",
      alignItems: "center",
      fontWeight: 600,
      borderRadius: "8px",
      background: "#f9fafb",
    },

    /* dropdown icon center */
    "& .MuiSelect-icon": {
      top: "50%",
      transform: "translateY(-50%)",
    },

    /* CENTER TEXT */
    "& .MuiTablePagination-displayedRows": {
      flexGrow: 1,
      textAlign: "center",
      fontWeight: 600,
      color: "#6b7280",
      margin: 0,
    },

    /* RIGHT ARROWS */
    "& .MuiTablePagination-actions": {
      marginLeft: "auto",
    },

    "& .MuiIconButton-root": {
      color: "#2575fc",
      borderRadius: "8px",
      "&:hover": {
        background: "rgba(37,117,252,0.1)",
      },
    },
  }}
/>



      </Paper>
      
      {/* Recording Player Modal */}
      <RecordingPlayerModal
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        call={selectedCall}
      />
    </Box>
  );
};

export default CallHistoryPage;
