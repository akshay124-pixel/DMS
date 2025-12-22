import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import {
  FaEye,
  FaUpload,
  FaPlus,
  FaFileExport,
  FaChartBar,
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Popover } from "@mui/material";
import * as XLSX from "xlsx";
import api from "../api/api";
import { toast } from "react-toastify";
import DisableCopy from "./DisableCopy";
import AddEntry from "./AddEntry";
import EditEntry from "./EditEntry";
import DeleteModal from "./Delete";
import ViewEntry from "./ViewEntry";
import { AutoSizer, List } from "react-virtualized";
import debounce from "lodash/debounce";
import ValueAnalyticsDrawer from "./Anylitics/ValueAnalyticsDrawer";
import AdminDrawer from "./Anylitics/AdminDrawer";
import { statesAndCities } from "./Options";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import { normalizeId } from "./Anylitics/sharedUtilities";
import { motion } from "framer-motion";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

// Separate Call Tracking Dashboard Component
const CallTrackingDashboard = ({
  filteredEntriesWithoutTracker,
  onFilterClick,
  selectedCategory,
}) => {
  const callStats = useMemo(() => {
    const stats = {
      cold: 0,
      warm: 0,
      hot: 0,
      closedWon: 0,
      closedLost: 0,
      Not: 0,
      Service: 0,
      total: filteredEntriesWithoutTracker.length,
    };

    filteredEntriesWithoutTracker.forEach((entry) => {
      switch (entry.status) {
        case "Not Interested":
          stats.cold += 1;
          break;
        case "Not":
          stats.Not += 1;
          break;
        case "Service":
          stats.Service += 1;
          break;
        case "Maybe":
          stats.warm += 1;
          break;
        case "Interested":
          stats.hot += 1;
          break;
        default:
          break;
      }
      switch (entry.closetype) {
        case "Closed Won":
          stats.closedWon += 1;
          break;
        case "Closed Lost":
          stats.closedLost += 1;
          break;
        default:
          break;
      }
    });

    stats.total =
      stats.total -
      (stats.cold +
        stats.Not +
        stats.warm +
        stats.hot +
        stats.Service +
        stats.closedWon +
        stats.closedLost);

    return stats;
  }, [filteredEntriesWithoutTracker]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: { xs: 1, sm: 2 } }}>
        <Divider sx={{ mb: { xs: 1, sm: 2 } }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr", // 1 column on mobile
              sm: "repeat(auto-fit, minmax(200px, 1fr))", // 2-3 columns on tablet
              md: "repeat(auto-fit, minmax(160px, 1fr))", // 4-7 columns on desktop
            },
            gap: { xs: 1, sm: 2 },
            justifyItems: "center", // Center cards horizontally
            px: { xs: 1, sm: 0 }, // Add padding on mobile to avoid edge clipping
          }}
        >
          {[
            {
              title: "Hot Calls",
              value: callStats.hot,
              label: "Interested",
              color: "#00897b",
              bg: "#e0f2f1",
              border: "#00695c",
              category: "Interested",
              chipBg: "#26a69a",
            },
            {
              title: "Warm Calls",
              value: callStats.warm,
              label: "Maybe",
              color: "#ef6c00",
              bg: "#fff8e1",
              border: "#e65100",
              category: "Maybe",
              chipBg: "#fb8c00",
            },
            {
              title: "Cold Calls",
              value: callStats.cold,
              label: "Not Interested",
              color: "#00838f",
              bg: "#e0f7fa",
              border: "#006064",
              category: "Not Interested",
              chipBg: "#00acc1",
            },
            {
              title: "No Response",
              value: callStats.Not,
              label: "Not Connected",
              color: "#d32f2f",
              bg: "#ffebee",
              border: "#c62828",
              category: "Not",
              chipBg: "#ef5350",
            },
            {
              title: "Service Calls",
              value: callStats.Service,
              label: "Service Calls",
              color: "#1976d2",
              bg: "#e3f2fd",
              border: "#1565c0",
              category: "Service",
              chipBg: "#1e88e5",
            },
            {
              title: "Closed Won",
              value: callStats.closedWon,
              label: "Closed Won",
              color: "#388e3c",
              bg: "#e8f5e9",
              border: "#2e7d32",
              category: "Closed Won",
              chipBg: "#4caf50",
            },
            {
              title: "Closed Lost",
              value: callStats.closedLost,
              label: "Closed Lost",
              color: "#7b1fa2",
              bg: "#f3e5f5",
              border: "#6a1b9a",
              category: "Closed Lost",
              chipBg: "#ab47bc",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              style={{
                width: "100%",
                maxWidth: { xs: "300px", sm: "none" }, // Cap card width on mobile
              }}
            >
              <Card
                sx={{
                  backgroundColor: item.bg,
                  boxShadow: 2,
                  border:
                    selectedCategory === item.category
                      ? `2px solid ${item.border}`
                      : "none",
                  padding: { xs: 1, sm: 2 },
                  minHeight: { xs: "120px", sm: "160px" },
                  width: "100%",
                }}
                onClick={() => onFilterClick(item.category)}
              >
                <CardContent
                  sx={{
                    padding: { xs: "8px !important", sm: "16px !important" },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    color="textSecondary"
                    sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      color: item.color,
                      fontSize: { xs: "1.5rem", sm: "2rem" },
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Chip
                    label={item.label}
                    size="medium"
                    sx={{
                      mt: { xs: 1, sm: 2 },
                      backgroundColor: item.chipBg,
                      color: "#fff",
                      fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                      height: { xs: "24px", sm: "32px" },
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};

// Main Dashboard Component
function DashBoard() {
  const isMobile = useIsMobile();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [itemIdToDelete, setItemIdToDelete] = useState(null);
  const [itemIdsToDelete, setItemIdsToDelete] = useState([]);
  const [selectedStateA, setSelectedStateA] = useState("");
  const [selectedCityA, setSelectedCityA] = useState("");
  const [selectedCreatedBy, setSelectedCreatedBy] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isValueAnalyticsOpen, setIsValueAnalyticsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [doubleClickInitiated, setDoubleClickInitiated] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState("total");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  ]);
  const [listKey, setListKey] = useState(Date.now());
  const listRef = useRef(null);
  const callStats = useMemo(() => {
    const stats = {
      cold: 0,
      warm: 0,
      hot: 0,
      Not: 0,
      Service: 0,
      closedWon: 0,
      closedLost: 0,
      total: entries.length,
    };

    entries.forEach((entry) => {
      switch (entry.status) {
        case "Not Interested":
          stats.cold += 1;
          break;
        case "Maybe":
          stats.warm += 1;
          break;
        case "Interested":
          stats.hot += 1;
          break;
        case "Not":
          stats.Not += 1;
          break;
        case "Service":
          stats.Service += 1;
          break;
        case "Closed":
          stats.closedWon += 1;
          break;

        default:
          break;
      }
      switch (entry.closetype) {
        case "Closed Won":
          stats.closedWon += 1;
          break;
        case "Closed Lost":
          stats.closedLost += 1;
          break;
        default:
          break;
      }
    });

    stats.total =
      stats.total -
      (stats.cold +
        stats.warm +
        stats.hot +
        stats.Not +
        stats.Service +
        stats.closedWon +
        stats.closedLost);

    return stats;
  }, [entries]);
  const navigate = useNavigate();

  const handleClosed = () => setShowDetails(false);

  const debouncedSearchChange = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  const filteredDataWithoutTracker = useMemo(() => {
    return entries.filter((row) => {
      const createdAt = new Date(row.createdAt);
      const updatedAt = new Date(row.updatedAt);
      const matchesSearch =
        !searchTerm ||
        row.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.mobileNumber.includes(searchTerm);

      const matchesOrganization =
        !selectedOrganization || row.organization === selectedOrganization;

      const matchesState = !selectedStateA || row.state === selectedStateA;
      const matchesCity = !selectedCityA || row.city === selectedCityA;

      const matchesDate =
        (!dateRange[0]?.startDate && !dateRange[0]?.endDate) ||
        (dateRange[0]?.startDate &&
          dateRange[0]?.endDate &&
          (() => {
            const start = new Date(dateRange[0].startDate);
            const end = new Date(dateRange[0].endDate);
            end.setHours(23, 59, 59, 999);
            return (
              (createdAt >= start && createdAt <= end) ||
              (updatedAt >= start && updatedAt <= end)
            );
          })());

      const matchesCreatedBy =
        !selectedCreatedBy || row.createdBy?.username === selectedCreatedBy;

      return (
        matchesSearch &&
        matchesOrganization &&
        matchesState &&
        matchesCity &&
        matchesDate &&
        matchesCreatedBy
      );
    });
  }, [
    entries,
    searchTerm,
    selectedOrganization,
    selectedStateA,
    selectedCityA,
    dateRange,
    selectedCreatedBy,
  ]);

  // Update filteredData to use filteredDataWithoutTracker
  const filteredData = useMemo(() => {
    return filteredDataWithoutTracker
      .filter((row) => {
        const createdAt = new Date(row.createdAt);
        const updatedAt = new Date(row.updatedAt);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Handle different filter types
        if (dashboardFilter === "total") {
          return true;
        } else if (dashboardFilter === "leads") {
          return row.status === "Not Found";
        } else if (dashboardFilter === "results") {
          return true;
        } else if (dashboardFilter === "monthly") {
          // Filter for current month's created or updated entries
          return (
            (createdAt.getMonth() === currentMonth &&
              createdAt.getFullYear() === currentYear) ||
            (updatedAt.getMonth() === currentMonth &&
              updatedAt.getFullYear() === currentYear)
          );
        } else {
          // Existing category filters (e.g., "Interested", "Closed Won", etc.)
          return (
            (dashboardFilter === "Closed Won" &&
              row.closetype === "Closed Won") ||
            (dashboardFilter === "Closed Lost" &&
              row.closetype === "Closed Lost") ||
            row.status === dashboardFilter
          );
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [filteredDataWithoutTracker, dashboardFilter]);

  const handleCounterClick = (filterType) => {
    setDashboardFilter(filterType);
    setListKey(Date.now());
    if (listRef.current) {
      listRef.current.scrollToPosition(0);
      listRef.current.recomputeRowHeights();
      listRef.current.forceUpdateGrid();
    }
  };

  const monthlyCalls = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return filteredDataWithoutTracker.reduce((count, entry) => {
      const createdAt = new Date(entry.createdAt);
      const updatedAt = new Date(entry.updatedAt);

      // Check if entry was created or updated in the current month
      const isCreatedThisMonth =
        createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear;
      const isUpdatedThisMonth =
        updatedAt.getMonth() === currentMonth &&
        updatedAt.getFullYear() === currentYear;

      // Count 1 for creation if created this month
      let entryCount = isCreatedThisMonth ? 1 : 0;

      // Add history length if entry was created or updated this month
      if ((isCreatedThisMonth || isUpdatedThisMonth) && entry.history) {
        entryCount += entry.history.length;
      }

      return count + entryCount;
    }, 0);
  }, [filteredDataWithoutTracker]);
  const handleSearchChange = (e) => debouncedSearchChange(e.target.value);

  const handleCreatedByChange = (e) => {
    setSelectedCreatedBy(e.target.value);
  };

  const handleOrganizationChange = (e) => {
    setSelectedOrganization(e.target.value);
  };

  const handleStateChangeA = (e) => {
    const state = e.target.value;
    setSelectedStateA(state);
    setSelectedCityA("");
  };

  const handleCityChangeA = (e) => setSelectedCityA(e.target.value);

  const handleDashboardFilterClick = (category) => {
    setDashboardFilter(category);
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedOrganization("");
    setSelectedStateA("");
    setSelectedCityA("");
    setSelectedEntries([]);
    setIsSelectionMode(false);
    setDoubleClickInitiated(false);
    setDashboardFilter("total");
    setSelectedCreatedBy("");
    setDateRange([
      {
        startDate: null,
        endDate: null,
        key: "selection",
      },
    ]);
    setListKey(Date.now());
    if (listRef.current) {
      listRef.current.recomputeRowHeights();
      listRef.current.forceUpdateGrid();
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const uniqueCreatedBy = [
    ...new Set(
      entries.map((entry) => entry.createdBy?.username).filter(Boolean)
    ),
  ];

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Inside fetchEntries
  const fetchEntries = useCallback(async (currentRole, currentUserId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      // ✅ api instance use karo - token automatically add hoga
      const response = await api.get("/api/fetch-entry");

      if (!Array.isArray(response.data.data)) {
        console.error("Invalid entries data:", response.data);
        toast.error("Invalid data received from server.");
        setEntries([]);
        return;
      }

      let fetchedEntries = response.data.data;

      // Use passed role/userId instead of state (which might be stale)
      const effectiveRole = currentRole || role;
      const effectiveUserId = currentUserId || userId;

      if (effectiveRole !== "Superadmin" && effectiveRole !== "Admin") {
        fetchedEntries = fetchedEntries.filter(
          (entry) => normalizeId(entry.createdBy?._id) === effectiveUserId
        );
      }

      setEntries(fetchedEntries);
      console.log(`Fetched ${fetchedEntries.length} entries for role: ${effectiveRole}`);
    } catch (error) {
      console.error("Error fetching data:", {
        message: error.message,
        response: error.response?.data,
      });
      const friendlyMessage =
        error.response?.data?.message ||
        "Sorry, we couldn't load the entries right now. Please check your internet connection or try again later.";
      toast.error(friendlyMessage);
      setEntries([]);
    } finally {
      setLoading(false);
      setListKey(Date.now());
      if (listRef.current) {
        listRef.current.recomputeRowHeights();
        listRef.current.forceUpdateGrid();
      }
    }
  }, [role, userId]);

  const fetchAdmin = useCallback(async () => {
    setAuthLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAdmin(false);
        setIsSuperadmin(false);
        setRole("Others");
        setUserId("");
        toast.error("Please log in to continue.");
        navigate("/login");
        return null;
      }

      const decoded = jwtDecode(token);
      const userRole = decoded.role || "Others";
      const currentUserId = decoded.id;

      // ✅ api instance use karo
      const response = await api.get("/api/user-role");

      setIsAdmin(response.data.isAdmin || false);
      setIsSuperadmin(response.data.isSuperadmin || false);
      setRole(userRole);
      setUserId(currentUserId);

      console.log("Fetched user info:", { userId: currentUserId, role: userRole });
      localStorage.setItem("userId", currentUserId);
      localStorage.setItem("role", userRole);
      
      // Return the values so fetchEntries can use them immediately
      return { role: userRole, userId: currentUserId };
    } catch (error) {
      console.error("Error fetching admin status:", error.message);
      setIsAdmin(false);
      setIsSuperadmin(false);
      setRole("Others");
      setUserId("");
      toast.error(
        "Your session has expired or there was a problem. Please log in again to continue."
      );
      navigate("/login");
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const authData = await fetchAdmin();
      if (isMounted && authData) {
        // Pass the fresh role and userId to fetchEntries
        await fetchEntries(authData.role, authData.userId);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [fetchAdmin, fetchEntries]);

  useEffect(() => {
    return () => {
      debouncedSearchChange.cancel();
    };
  }, [debouncedSearchChange]);

  const handleShowDetails = useCallback((entry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  }, []);

  const handleEdit = useCallback((entry) => {
    setEntryToEdit(entry);
    setEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id) => {
    setItemIdToDelete(id);
    setItemIdsToDelete([]);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemIdToDelete(null);
    setItemIdsToDelete([]);
  };

  const handleDelete = useCallback((deletedIds) => {
    setEntries((prev) =>
      prev.filter((entry) => !deletedIds.includes(entry._id))
    );
    setSelectedEntry((prev) =>
      prev && deletedIds.includes(prev._id) ? null : prev
    );
    setSelectedEntries((prev) => prev.filter((id) => !deletedIds.includes(id)));
    setListKey(Date.now());
    if (listRef.current) {
      listRef.current.recomputeRowHeights();
      listRef.current.forceUpdateGrid();
    }
  }, []);

  const handleEntryAdded = useCallback((newEntry) => {
    const completeEntry = {
      _id: newEntry._id || Date.now().toString(),
      customerName: newEntry.customerName || "",
      mobileNumber: newEntry.mobileNumber || "",
      product: newEntry.product || "",
      address: newEntry.address || "",
      state: newEntry.state || "",
      city: newEntry.city || "",
      organization: newEntry.organization || "",
      category: newEntry.category || "",
      createdAt: newEntry.createdAt || new Date().toISOString(),
      updatedAt: newEntry.updatedAt || new Date().toISOString(),
      status: newEntry.status || "Not Found",
      expectedClosingDate: newEntry.expectedClosingDate || "",
      followUpDate: newEntry.followUpDate || "",
      remarks: newEntry.remarks || "",
      email: newEntry.email || "",
      AlterNumber: newEntry.AlterNumber || "",
      createdBy: {
        _id: localStorage.getItem("userId"),
        username:
          newEntry.createdBy?.username ||
          localStorage.getItem("username") ||
          "Unknown",
      },
    };
    setEntries((prev) => [completeEntry, ...prev]);
    setListKey(Date.now());
    if (listRef.current) {
      listRef.current.scrollToPosition(0);
      listRef.current.recomputeRowHeights();
      listRef.current.forceUpdateGrid();
    }
  }, []);

  const handleEntryUpdated = useCallback(
    (updatedEntry) => {
      const index = entries.findIndex(
        (entry) => entry._id === updatedEntry._id
      );
      if (index !== -1) {
        setEntries((prev) =>
          prev.map((entry) =>
            entry._id === updatedEntry._id ? { ...updatedEntry } : entry
          )
        );
        setSelectedEntry((prev) =>
          prev && prev._id === updatedEntry._id ? { ...updatedEntry } : prev
        );
        setEntryToEdit((prev) =>
          prev && prev._id === updatedEntry._id ? { ...updatedEntry } : prev
        );
        setEditModalOpen(false);
        setListKey(Date.now());
        if (listRef.current) {
          const scrollIndex = filteredData.findIndex(
            (entry) => entry._id === updatedEntry._id
          );
          if (scrollIndex !== -1) {
            const scrollPosition = listRef.current.getOffsetForRow({
              alignment: "start",
              index: scrollIndex,
            });
            listRef.current.scrollToPosition(scrollPosition);
          }
          listRef.current.recomputeRowHeights();
          listRef.current.forceUpdateGrid();
        }
      }
    },
    [entries, filteredData]
  );
  useEffect(() => {
    if (listRef.current && scrollPosition > 0) {
      listRef.current.scrollToPosition(scrollPosition);
      listRef.current.recomputeRowHeights();
      listRef.current.forceUpdateGrid();
    }
  }, [listKey, scrollPosition]);

  const handleDoubleClick = (id) => {
    if (!doubleClickInitiated && (isAdmin || isSuperadmin)) {
      setIsSelectionMode(true);
      setDoubleClickInitiated(true);
      setSelectedEntries([id]);
    }
  };

  const handleSingleClick = (id) => {
    if (isSelectionMode && (isAdmin || isSuperadmin)) {
      setSelectedEntries((prev) =>
        prev.includes(id)
          ? prev.filter((entryId) => entryId !== id)
          : [...prev, id]
      );
    }
  };

  const handleSelectAll = () => {
    if (isSelectionMode && (isAdmin || isSuperadmin)) {
      const allFilteredIds = filteredData.map((entry) => entry._id);
      setSelectedEntries(allFilteredIds);
    }
  };

  const handleCopySelected = () => {
    const selectedData = entries.filter((entry) =>
      selectedEntries.includes(entry._id)
    );
    const textToCopy = selectedData
      .map((entry) =>
        [
          entry.customerName,
          entry.mobileNumber,
          entry.product,
          entry.address,
          entry.state,
          entry.city,
          entry.organization,
          entry.category,
          new Date(entry.createdAt).toLocaleDateString(),
        ].join("\t")
      )
      .join("\n");
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => toast.success("Selected entries copied to clipboard!"))
      .catch((err) => toast.error("Failed to copy: " + err.message));
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedEntries.length === 0) {
      toast.error("No entries selected!");
      return;
    }
    setItemIdsToDelete(selectedEntries);
    setItemIdToDelete(null);
    setIsDeleteModalOpen(true);
  }, [selectedEntries]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("No file selected!");
      return;
    }

    // Reset file input so same file can be uploaded again
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet);

        const newEntries = parsedData
          .map((item) => ({
            "Customer Name": String(item["Customer Name"] || "").trim(),
            "Contact Person": String(item["Contact Person"] || "").trim(),
            Email: String(item["Email"] || "").trim(),
            "Contact Number": String(item["Contact Number"] || "").trim(),
            "Alternate Number": String(item["Alternate Number"] || "").trim(),
            Product: String(item["Product"] || "").trim(),
            Address: String(item["Address"] || "").trim(),
            Organization: String(item["Organization"] || "").trim(),
            Category: String(item["Category"] || "").trim(),
            District: String(item["District"] || "").trim(),
            State: String(item["State"] || "").trim(),
            Status: item["Status"] || "Not Found",
            Remarks: String(item["Remarks"] || "").trim(),
          }))
          .filter((entry) =>
            Object.values(entry).some(
              (val) => val && val.toString().trim() !== ""
            )
          );
        if (newEntries.length === 0) {
          toast.error("No valid entries found in the Excel file!");
          return;
        }

        toast.info(`Processing ${newEntries.length} entries...`);

        const chunkSize = 500; // Match server batch size
        const chunks = [];
        for (let i = 0; i < newEntries.length; i += chunkSize) {
          chunks.push(newEntries.slice(i, i + chunkSize));
        }

        let uploadedCount = 0;
        const errors = [];

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          try {
            const response = await api.post("/api/entries", chunk, {
              timeout: 120000, // 2 minutes timeout for large batches
            });

            if (response.status === 201 || response.status === 200) {
              uploadedCount += response.data.insertedCount || chunk.length;
              toast.success(
                `Batch ${i + 1}/${chunks.length}: Uploaded ${uploadedCount} entries`
              );
            } else if (response.status === 207) {
              const chunkUploaded = response.data.insertedCount || 0;
              uploadedCount += chunkUploaded;
              errors.push(...(response.data.errors || []));
              toast.warn(
                `Batch ${i + 1}/${chunks.length}: Partially uploaded (${chunkUploaded} entries)`
              );
            }
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              `Batch ${i + 1}: Failed to upload`;
            errors.push(errorMessage);
            toast.error(errorMessage);
          }
        }

        // Always fetch fresh data from server after upload
        if (uploadedCount > 0) {
          toast.success(`Upload complete! ${uploadedCount} entries added.`);
          await fetchEntries(role, userId); // Fetch fresh data from server
        } else {
          toast.error(`Failed to upload entries. ${errors.join("; ")}`);
        }
      } catch (error) {
        console.error("Error processing Excel file:", error.message);
        toast.error(`Invalid Excel file: ${error.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  // Mail Start
  const handleSendEmail = async (entryId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to send emails.");
        navigate("/login");
        return;
      }

      // ✅ api instance use karo
      const response = await api.post("/api/send-email", { entryId });

      toast.success(response.data.message);
    } catch (error) {
      console.error("Error sending email:", error.message);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send email. Please try again later.";
      toast.error(errorMessage);
    }
  };
  //Mail End

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error("No entries to export!");
      return;
    }

    const exportData = filteredData.map((entry) => ({
      "Customer Name": entry.customerName || "",
      "Contact Person": entry.contactName || "",
      Email: entry.email || "",
      "Contact Number": entry.mobileNumber || "",
      "Alternate Number": entry.AlterNumber || "",
      Product: entry.product || "",
      Address: entry.address || "",
      Organization: entry.organization || "",
      Category: entry.category || "",
      District: entry.city || "",
      State: entry.state || "",
      Status: entry.status || "Not Found",
      Remarks: entry.remarks || "",
      "Created By": entry.createdBy?.username || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Entries");

    const fileState = filteredData[0]?.state || "All";
    XLSX.writeFile(workbook, `Data_of_${fileState}.xlsx`);
    toast.success("Entries exported successfully!");
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleAnalyticsDrawerClose = () => {
    setIsAnalyticsOpen(false);
    setListKey(Date.now());
    if (listRef.current) {
      listRef.current.recomputeRowHeights();
      listRef.current.forceUpdateGrid();
      listRef.current.scrollToPosition(0);
      window.dispatchEvent(new Event("resize"));
    }
  };

  const handleValueAnalyticsDrawerClose = () => {
    setIsValueAnalyticsOpen(false);
    setListKey(Date.now());
    if (listRef.current) {
      listRef.current.recomputeRowHeights();
      listRef.current.forceUpdateGrid();
      listRef.current.scrollToPosition(0);
      window.dispatchEvent(new Event("resize"));
    }
  };
  useEffect(() => {
    if (isAnalyticsOpen || isValueAnalyticsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAnalyticsOpen, isValueAnalyticsOpen]);
  const rowRenderer = ({ index, key, style }) => {
    const row = filteredData[index];
    const isSelected = selectedEntries.includes(row._id);
    return (
      <div
        key={key}
        style={{ ...style, cursor: "pointer" }}
        className={`virtual-row ${isSelected ? "selected" : ""}`}
        onDoubleClick={() => handleDoubleClick(row._id)}
        onClick={() => handleSingleClick(row._id)}
      >
        <div className="virtual-cell">{index + 1}</div> {/* # */}
        <div className="virtual-cell">{formatDate(row.createdAt)}</div>{" "}
        {/* Date */}
        <div className="virtual-cell">{row.customerName}</div> {/* Customer */}
        <div className="virtual-cell">{row.contactName}</div> {/* Person */}
        <div className="virtual-cell">{row.mobileNumber}</div> {/* Mobile */}
        <div className="virtual-cell">{row.address}</div> {/* Address */}
        <div className="virtual-cell">{row.city}</div> {/* District */}
        <div className="virtual-cell">{row.state}</div> {/* State */}
        <div className="virtual-cell">{row.createdBy?.username}</div>{" "}
        {/* User */}
        <div
          className="virtual-cell actions-cell"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "200px",
            padding: "0 5px",
          }}
        >
          <Button
            variant="primary"
            onClick={() => handleShowDetails(row)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "22px",
              padding: "0",
            }}
          >
            <FaEye style={{ marginBottom: "3px" }} />
          </Button>
          <button
            onClick={() => handleEdit(row)}
            className="editBtn"
            style={{ width: "40px", height: "40px", padding: "0" }}
          >
            <svg height="1em" viewBox="0 0 512 512">
              <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
            </svg>
          </button>
          <button
            className="bin-button"
            onClick={() => handleDeleteClick(row._id)}
            style={{ width: "40px", height: "40px", padding: "0" }}
          >
            <svg
              className="bin-top"
              viewBox="0 0 39 7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line y1="5" x2="39" y2="5" stroke="white" strokeWidth="4"></line>
              <line
                x1="12"
                y1="1.5"
                x2="26.0357"
                y2="1.5"
                stroke="white"
                strokeWidth="3"
              ></line>
            </svg>
            <svg
              className="bin-bottom"
              viewBox="0 0 33 39"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <mask id="path-1-inside-1_8_19" fill="white">
                <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
              </mask>
              <path
                d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                fill="white"
                mask="url(#path-1-inside-1_8_19)"
              ></path>
              <path d="M12 6L12 29" stroke="white" strokeWidth="4"></path>
              <path d="M21 6V29" stroke="white" strokeWidth="4"></path>
            </svg>
          </button>
          <Button
            variant="success"
            onClick={() => handleSendEmail(row._id)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "22px",
              padding: "0",
              backgroundColor: "#28a745",
            }}
            title="Send Email"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="white"
              style={{ width: "20px", height: "20px" }}
            >
              <path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z" />
            </svg>
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="loading-wave">
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
          <div className="loading-bar"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "center", sm: "flex-start" },
          gap: { xs: 1, sm: 2 },
          px: { xs: 1, sm: 2 },
          my: { xs: 1, sm: 2 },
        }}
        className="enhanced-search-bar-container"
      >
        <input
          style={{
            width: { xs: "100%", sm: "25%" },
            maxWidth: { xs: "300px", sm: "none" },
          }}
          type="text"
          className="enhanced-search-bar allow-copy-paste"
          placeholder="🔍 Search..."
          onChange={handleSearchChange}
        />
        <select
          className="enhanced-filter-dropdown"
          value={selectedOrganization}
          onChange={handleOrganizationChange}
          style={{
            width: { xs: "100%", sm: "auto" },
            maxWidth: { xs: "300px", sm: "none" },
          }}
        >
          <option value="">-- Select Organization --</option>
          <option value="School">School</option>
          <option value="College">College</option>
          <option value="University">University</option>
          <option value="Office">Office</option>
          <option value="Corporates">Corporates</option>
          <option value="Customer">Customer</option>
          <option value="Partner">Partner</option>
          <option value="Others">Others</option>
        </select>
        {(isAdmin || isSuperadmin) && (
          <select
            className="enhanced-filter-dropdown"
            value={selectedCreatedBy}
            onChange={handleCreatedByChange}
            style={{
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "300px", sm: "none" },
            }}
          >
            <option value="">-- Select Usernames --</option>
            {uniqueCreatedBy.map((username) => (
              <option key={username} value={username}>
                {username}
              </option>
            ))}
          </select>
        )}
        <div>
          <input
            type="text"
            style={{ borderRadius: "9999px" }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            value={
              dateRange[0]?.startDate && dateRange[0]?.endDate
                ? `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
                : ""
            }
            placeholder="-- Select date range --"
            readOnly
            className="cursor-pointer border p-2"
            aria-label="Select date range"
          />
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{
              sx: {
                width: isMobile ? "100vw" : "600px",
                maxWidth: isMobile ? "100vw" : "600px",
                maxHeight: isMobile ? "80vh" : "500px",
                overflowY: "auto",
                overflowX: "hidden",
                padding: isMobile ? "5px" : "10px",
                boxSizing: "border-box",
                borderRadius: isMobile ? "0" : "8px",
                marginTop: isMobile ? "0" : "8px",
                background: "#fff",
              },
            }}
          >
            <DateRangePicker
              ranges={dateRange}
              onChange={(item) => setDateRange([item.selection])}
              moveRangeOnFirstSelection={false}
              showSelectionPreview={true}
              rangeColors={["#2575fc"]}
              editableDateInputs={true}
              months={1}
              direction="vertical"
              className={isMobile ? "mobile-date-picker" : ""}
              calendarFocus="forwards"
              staticRanges={
                isMobile
                  ? []
                  : [
                      {
                        label: "Today",
                        range: () => ({
                          startDate: new Date(),
                          endDate: new Date(),
                          key: "selection",
                        }),
                        isSelected: (range) => {
                          const today = new Date();
                          return (
                            range.startDate.toDateString() ===
                              today.toDateString() &&
                            range.endDate.toDateString() ===
                              today.toDateString()
                          );
                        },
                      },
                      {
                        label: "Yesterday",
                        range: () => ({
                          startDate: new Date(
                            new Date().setDate(new Date().getDate() - 1)
                          ),
                          endDate: new Date(
                            new Date().setDate(new Date().getDate() - 1)
                          ),
                          key: "selection",
                        }),
                        isSelected: (range) => {
                          const yesterday = new Date(
                            new Date().setDate(new Date().getDate() - 1)
                          );
                          return (
                            range.startDate.toDateString() ===
                              yesterday.toDateString() &&
                            range.endDate.toDateString() ===
                              yesterday.toDateString()
                          );
                        },
                      },
                      {
                        label: "Last 7 Days",
                        range: () => ({
                          startDate: new Date(
                            new Date().setDate(new Date().getDate() - 7)
                          ),
                          endDate: new Date(),
                          key: "selection",
                        }),
                        isSelected: (range) => {
                          const start = new Date(
                            new Date().setDate(new Date().getDate() - 7)
                          );
                          const end = new Date();
                          return (
                            range.startDate.toDateString() ===
                              start.toDateString() &&
                            range.endDate.toDateString() === end.toDateString()
                          );
                        },
                      },
                      {
                        label: "Last 30 Days",
                        range: () => ({
                          startDate: new Date(
                            new Date().setDate(new Date().getDate() - 30)
                          ),
                          endDate: new Date(),
                          key: "selection",
                        }),
                        isSelected: (range) => {
                          const start = new Date(
                            new Date().setDate(new Date().getDate() - 30)
                          );
                          const end = new Date();
                          return (
                            range.startDate.toDateString() ===
                              start.toDateString() &&
                            range.endDate.toDateString() === end.toDateString()
                          );
                        },
                      },
                    ]
              }
              inputRanges={isMobile ? [] : undefined}
              weekStartsOn={1}
            />
          </Popover>
        </div>
        <select
          className="enhanced-filter-dropdown"
          value={selectedStateA}
          onChange={handleStateChangeA}
          style={{
            width: { xs: "100%", sm: "auto" },
            maxWidth: { xs: "300px", sm: "none" },
          }}
        >
          <option value="">-- Select State --</option>
          {Object.keys(statesAndCities).map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <select
          className="enhanced-filter-dropdown"
          value={selectedCityA}
          onChange={handleCityChangeA}
          disabled={!selectedStateA}
          style={{
            width: { xs: "100%", sm: "auto" },
            maxWidth: { xs: "300px", sm: "none" },
          }}
        >
          <option value="">-- Select District --</option>
          {selectedStateA &&
            statesAndCities[selectedStateA].map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
        </select>
        <button
          className="reset-button"
          onClick={handleReset}
          style={{
            display: "flex",
            alignItems: "center",
            padding: { xs: "6px 12px", sm: "8px 16px" },
            borderRadius: "20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: { xs: "0.875rem", sm: "1rem" },
            transition: "all 0.3s ease",
            width: { xs: "100%", sm: "auto" },
            maxWidth: { xs: "300px", sm: "none" },
            justifyContent: "center",
          }}
        >
          <span style={{ fontWeight: "bold" }}>Reset</span>
          <span
            className="rounded-arrow"
            style={{
              marginLeft: "8px",
              display: "inline-flex",
              alignItems: "center",
              transition: "transform 0.3s ease",
            }}
          >
            →
          </span>
        </button>
      </Box>

      <div
        className="dashboard-container"
        style={{ width: "90%", margin: "auto", padding: "20px" }}
      >
        <CallTrackingDashboard
          filteredEntriesWithoutTracker={filteredDataWithoutTracker}
          onFilterClick={handleDashboardFilterClick}
          selectedCategory={dashboardFilter}
        />
        <div style={{ textAlign: "center" }}>
          <label
            className="button"
            style={{
              padding: "12px 20px",
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              color: "white",
              borderRadius: "12px",

              cursor: "pointer",
              fontWeight: "bold",
              border: "none",
              fontSize: "1rem",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
            }}
          >
            <FaUpload />
            Bulk Upload via Excel
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              style={{ display: "none" }}
            />
          </label>{" "}
          <button
            className="button mx-1"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: "12px 20px",
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              color: "white",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "bold",
              border: "none",
              fontSize: "1rem",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              display: "inline-flex",
              alignItems: "center",
              textAlign: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
            }}
          >
            <FaPlus />
            Add New Entry
          </button>
          {isSuperadmin && (
            <button
              className="button mx-1"
              onClick={handleExport}
              style={{
                padding: "12px 20px",
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                color: "white",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
                border: "none",
                fontSize: "1rem",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                display: "inline-flex",
                alignItems: "center",
                textAlign: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
              }}
            >
              <FaFileExport />
              Export To Excel
            </button>
          )}
          <button
            className="button mx-1"
            onClick={() => setIsAnalyticsModalOpen(true)}
            style={{
              padding: "12px 20px",
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              color: "white",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "bold",
              border: "none",
              fontSize: "1rem",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              display: "inline-flex",
              alignItems: "center",
              textAlign: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
            }}
          >
            <FaChartBar />
            Analytics
          </button>
          {(isAdmin || isSuperadmin) && filteredData.length > 0 && (
            <div style={{ marginTop: "10px", marginLeft: "0px" }}>
              {isSelectionMode && (
                <Button
                  variant="info"
                  className="select mx-1"
                  onClick={handleSelectAll}
                  style={{
                    marginRight: "10px",
                    background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                    border: "none",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0px 6px 12px rgba(0, 0, 0, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  Select All
                </Button>
              )}
              {selectedEntries.length > 0 && (
                <>
                  <Button
                    className="copy"
                    variant="primary"
                    onClick={handleCopySelected}
                    style={{
                      marginRight: "10px",
                      background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0px 6px 12px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0px 4px 6px rgba(0, 0, 0, 0.1)";
                    }}
                  >
                    Copy Selected {selectedEntries.length}
                  </Button>
                  <Button
                    variant="danger"
                    className="copy "
                    onClick={handleDeleteSelected}
                    style={{
                      background: "linear-gradient(90deg, #ff4444, #cc0000)",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0px 6px 12px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0px 4px 6px rgba(0, 0, 0, 0.1)";
                    }}
                  >
                    Delete Selected {selectedEntries.length}
                  </Button>
                </>
              )}
            </div>
          )}
          <p
            style={{ fontSize: "0.9rem", color: "#6c757d", marginTop: "10px" }}
          >
            Upload a valid Excel file with columns:{" "}
            <strong>
              Customer Name, Email, Mobile Number, Product, Address,
              Organization, Category, State, District, Status, Remarks, Created
              At
            </strong>
          </p>
        </div>

        <DisableCopy isAdmin={isAdmin} />
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 2 },
            mb: { xs: 1, sm: 2 },
            justifyContent: { xs: "center", sm: "flex-start" },
            alignItems: { xs: "center", sm: "flex-start" },
            px: { xs: 1, sm: 0 },
          }}
        >
          <Box
            className="counter-badge"
            sx={{
              fontWeight: "600",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              color: "#fff",
              background:
                dashboardFilter === "leads"
                  ? "linear-gradient(90deg, #ff4444, #cc0000)"
                  : "linear-gradient(90deg, #6a11cb, #2575fc)",
              padding: { xs: "4px 12px", sm: "5px 15px" },
              borderRadius: "20px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
              textTransform: "capitalize",
              cursor: "pointer",
              border: dashboardFilter === "leads" ? "2px solid #fff" : "none",
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "300px", sm: "none" },
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
              },
            }}
            onClick={() => handleCounterClick("leads")}
          >
            Total Leads:{" "}
            {
              filteredDataWithoutTracker.filter(
                (row) => row.status === "Not Found"
              ).length
            }
          </Box>
          <Box
            className="counter-badge"
            sx={{
              fontWeight: "600",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              color: "#fff",
              background:
                dashboardFilter === "results"
                  ? "linear-gradient(90deg, #ff4444, #cc0000)"
                  : "linear-gradient(90deg, #6a11cb, #2575fc)",
              padding: { xs: "4px 12px", sm: "5px 15px" },
              borderRadius: "20px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
              textTransform: "capitalize",
              cursor: "pointer",
              border: dashboardFilter === "results" ? "2px solid #fff" : "none",
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "300px", sm: "none" },
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
              },
            }}
            onClick={() => handleCounterClick("results")}
          >
            Total Results: {filteredData.length}
          </Box>
          <Box
            className="counter-badge"
            sx={{
              fontWeight: "600",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              color: "#fff",
              background:
                dashboardFilter === "monthly"
                  ? "linear-gradient(90deg, #ff4444, #cc0000)"
                  : "linear-gradient(90deg, #6a11cb, #2575fc)",
              padding: { xs: "4px 12px", sm: "5px 15px" },
              borderRadius: "20px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
              textTransform: "capitalize",
              cursor: "pointer",
              border: dashboardFilter === "monthly" ? "2px solid #fff" : "none",
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: "300px", sm: "none" },
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
              },
            }}
            onClick={() => handleCounterClick("monthly")}
          >
            Monthly Calls: {monthlyCalls}
          </Box>
        </Box>
        <div
          className="table-container"
          style={{
            width: "100%",
            maxWidth: "100%", // Fit screen width
            height: "75vh",
            margin: "0 auto",
            overflowX: "auto", // Enable horizontal scrolling
            overflowY: "auto", // Enable vertical scrolling
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
            borderRadius: "15px",
            marginTop: "20px",
            backgroundColor: "#fff",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            className="table-header"
            style={{
              background: "linear-gradient(135deg, #2575fc, #6a11cb)",
              color: "white",
              padding: "15px 20px",
              textAlign: "center",
              position: "sticky",
              top: 0,
              zIndex: 2,
              display: "grid",
              fontWeight: "bold",
              borderBottom: "2px solid #ddd",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "1000px", // Wide enough to trigger scrolling
            }}
          >
            <div>#</div>
            <div>Date</div>
            <div>Customer</div>
            <div>Person</div>
            <div>Mobile</div>
            <div>Address</div>
            <div>District</div>
            <div>State</div>
            <div>User</div>
            <div>Actions</div>
          </div>
          {filteredData.length === 0 ? (
            <div
              style={{
                height: "calc(100% - 60px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                color: "#666",
                fontWeight: "bold",
                textAlign: "center",
                padding: "20px",
                minWidth: "1000px", // Match header minWidth
              }}
            >
              No Entries Available
            </div>
          ) : (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  key={listKey}
                  width={Math.max(width, 1000)}
                  height={height - 60}
                  rowCount={filteredData.length}
                  rowHeight={60}
                  rowRenderer={rowRenderer}
                  overscanRowCount={10}
                  style={{ outline: "none", minWidth: "1000px" }} // Match header minWidth
                  onScroll={({ scrollTop, scrollLeft }) => {
                    setScrollPosition(scrollTop);
                    const header = document.querySelector(".table-header");
                    if (header) header.scrollLeft = scrollLeft;
                  }}
                />
              )}
            </AutoSizer>
          )}
        </div>

        <AddEntry
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onEntryAdded={handleEntryAdded}
        />
        <EditEntry
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onEntryUpdated={handleEntryUpdated}
          entryToEdit={entryToEdit}
        />
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onDelete={handleDelete}
          itemId={itemIdToDelete}
          itemIds={itemIdsToDelete}
        />
        <ViewEntry
          isOpen={showDetails}
          onClose={handleClosed}
          entry={selectedEntry}
          isAdmin={isAdmin}
        />
        <AdminDrawer
          entries={entries}
          isOpen={isAnalyticsOpen && !loading}
          onClose={handleAnalyticsDrawerClose}
          role={role}
          userId={userId}
          dateRange={dateRange}
        />
        <ValueAnalyticsDrawer
          entries={entries}
          isOpen={isValueAnalyticsOpen && !loading}
          onClose={handleValueAnalyticsDrawerClose}
          role={role}
          userId={userId}
          dateRange={dateRange}
        />
        <Modal
          show={isAnalyticsModalOpen}
          onHide={() => setIsAnalyticsModalOpen(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title style={{ fontWeight: "bold" }}>
              📊 Analytics Options
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{ display: "flex", justifyContent: "center", gap: "20px" }}
          >
            <Button
              variant="primary"
              onClick={() => {
                setIsAnalyticsOpen(true);
                setIsAnalyticsModalOpen(false);
              }}
              style={{
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "12px",
                fontWeight: "bold",
              }}
            >
              📞 Calls Analytics
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsValueAnalyticsOpen(true);
                setIsAnalyticsModalOpen(false);
              }}
              style={{
                background: "linear-gradient(90deg, #6a11cb, #2575fc)",
                border: "none",
                padding: "10px 20px",
                borderRadius: "12px",
                fontWeight: "bold",
              }}
            >
              🚀 Value Analytics
            </Button>
          </Modal.Body>
        </Modal>
      </div>
      <footer className="footer-container">
        <p style={{ marginTop: "15px", color: "white", height: "10px" }}>
          © 2025 DataManagement. All rights reserved.
        </p>
      </footer>
      <style>
        {`
          
  @media (max-width: 768px) {

 
   
   .button {
    margin-top:5px;
    margin-bottom: 8px;
    width:250px
  }
   .copy { 
    margin-bottom: 8px;
  
   width:250px
  }
   .select { 
    margin-bottom: 8px;
    
   width:250px
  }
  .table-container {
    width: 100%;
    max-width: 100%; /* Fit screen width */
    height: 75vh;
    margin: 0 auto;
    overflow-x: auto; /* Horizontal scrolling */
    overflow-y: auto; /* Vertical scrolling */
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
    border-radius: 15px;
    margin-top: 20px;
    background-color: #fff;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on mobile */
  }

  .table-header {
    background: linear-gradient(135deg, #2575fc, #6a11cb);
    color: white;
    padding: 15px 20px;
    text-align: center;
    position: sticky;
    top: 0;
    z-index: 2;
    display: grid;
    grid-template-columns: 80px 120px 150px 120px 120px 150px 100px 100px 100px 200px; /* Fixed widths for alignment */
    font-weight: bold;
    border-bottom: 2px solid #ddd;
    align-items: center;
    justify-content: center;
    min-width: 1000px; /* Wide enough for scrolling */
  }

  .virtual-row {
    display: grid;
    grid-template-columns: 80px 120px 150px 120px 120px 150px 100px 100px 100px 200px; /* Match header exactly */
    align-items: center;
    padding: 10px 20px;
    border-bottom: 1px solid #eee;
    min-width: 1000px; /* Match header minWidth */
  }

  .virtual-cell {
    padding: 10px;
    font-size: 1rem;
    text-align: center;
    white-space: nowrap; /* Prevent text wrapping */
  }

  .actions-cell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 200px;
    padding: 0 5px;
  }

  @media (max-width: 768px) {

   .cursor-pointer{
    width: 296px !important;
    }

    .table-container {
      max-width: 100%; /* Fit screen width */
      overflow-x: auto; /* Ensure horizontal scrolling */
    }

    .table-header {
      grid-template-columns: 60px 100px 120px 100px 100px 120px 80px 80px 80px 150px !important; /* Smaller columns for mobile */
      font-size: 0.9rem !important;
      min-width: 1000px; /* Wide enough for scrolling */
    }

    .virtual-row {
      grid-template-columns: 60px 100px 120px 100px 100px 120px 80px 80px 80px 150px !important; /* Match header exactly */
      min-width: 1000px; /* Wide enough for scrolling */
    }

    .virtual-cell {
      font-size: 0.75rem !important;
      padding: 6px !important;
      margin-left: -34px;
    }

    .actions-cell {
      width: 186px !important;
      gap: 0px !important;
      margin-left: -40px !important;
    }

    .table-container::-webkit-scrollbar {
      height: 8px; /* Horizontal scrollbar height */
    }

    .table-container::-webkit-scrollbar-thumb {
      background-color: #6a11cb;
      border-radius: 10px;
    }

    .table-container::-webkit-scrollbar-track {
      background-color: #f1f1f1;
    }
  }
    .enhanced-search-bar-container { flex-direction: column; align-items: center; }
    .enhanced-search-bar, .enhanced-filter-dropdown, .reset-button { width: 100% !important; max-width: 300px !important; margin-bottom: 10px; }
  }

  .footer-container {
    background: linear-gradient(90deg, #6a11cb, #2575fc);
    text-align: center;
    padding: 10px 0;
    margin-top: 20px;

  }

  .loading-wave {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .loading-bar {
    width: 8px;
    height: 40px;
    background-color: #2575fc;
    animation: wave 1.2s infinite ease-in-out;
  }

  .loading-bar:nth-child(2) {
    animation-delay: -0.1s;
  }

  .loading-bar:nth-child(3) {
    animation-delay: -0.2s;
  }

  .loading-bar:nth-child(4) {
    animation-delay: -0.3s;
  }

  @keyframes wave {
    0%, 100% {
      transform: scaleY(0.4);
      background-color: #2575fc;
    }
    50% {
      transform: scaleY(1);
      background-color: #6a11cb;
    }
  }
  .select:hover, .copy:hover {
    background: linear-gradient(90deg, #6a11cb, #2575fc);
    color: white;
    border-radius: 12px;
    transition: all 0.3s ease;
  }
  .reset-button:hover {
    background: linear-gradient(90deg, #2575fc, #6a11cb);
    box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
  .reset-button:active {
    transform: translateY(0);
    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .rounded-arrow {
    font-size: 1.2rem;
    transition: transform 0.3s ease;
  }
  
  .reset-button:hover .rounded-arrow {
    transform: translateX(5px);
  }
  
  .reset-button:active .rounded-arrow {
    transform: translateX(0);
  }
        `}
      </style>
    </>
  );
}

export default DashBoard;
