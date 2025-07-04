import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
import axios from "axios";
import * as XLSX from "xlsx";
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

// Separate Call Tracking Dashboard Component
// Separate Call Tracking Dashboard Component
const CallTrackingDashboard = ({
  filteredEntries,
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
      total: filteredEntries.length,
    };

    filteredEntries.forEach((entry) => {
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
  }, [filteredEntries]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
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
              title: "Not Connected",
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
              style={{ flex: "1 1 13%" }}
            >
              <Card
                sx={{
                  backgroundColor: item.bg,
                  boxShadow: 2,
                  border:
                    selectedCategory === item.category
                      ? `2px solid ${item.border}`
                      : "none",
                  padding: 2,
                  minHeight: "180px",
                }}
                onClick={() => onFilterClick(item.category)}
              >
                <CardContent sx={{ padding: "16px !important" }}>
                  <Typography variant="subtitle1" color="textSecondary">
                    {item.title}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: item.color }}
                  >
                    {item.value}
                  </Typography>
                  <Chip
                    label={item.label}
                    size="medium"
                    sx={{ mt: 2, backgroundColor: item.chipBg, color: "#fff" }}
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
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
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
  const listRef = useRef(null); // Ref for List component
  const callStats = useMemo(() => {
    const stats = {
      cold: 0,
      warm: 0,
      hot: 0,
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

  const filteredData = useMemo(() => {
    return entries
      .filter((row) => {
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
              end.setHours(23, 59, 59, 999); // 👈 Important line

              return (
                (createdAt >= start && createdAt <= end) ||
                (updatedAt >= start && updatedAt <= end)
              );
            })());

        const matchesCreatedBy =
          !selectedCreatedBy || row.createdBy?.username === selectedCreatedBy;

        const matchesDashboardFilter =
          dashboardFilter === "total" ||
          (dashboardFilter === "Closed Won" &&
            row.closetype === "Closed Won") ||
          (dashboardFilter === "Closed Lost" &&
            row.closetype === "Closed Lost") ||
          row.status === dashboardFilter;

        return (
          matchesSearch &&
          matchesOrganization &&
          matchesState &&
          matchesCity &&
          matchesDate &&
          matchesCreatedBy &&
          matchesDashboardFilter
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [
    entries,
    searchTerm,
    selectedOrganization,
    selectedStateA,
    selectedCityA,
    dashboardFilter,
    dateRange,
    selectedCreatedBy,
  ]);

  const monthlyCalls = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const validStatuses = [
      "Interested",
      "Not Interested",
      "Maybe",
      "Closed",
      "Not",
      "Service",
    ];

    return entries.filter((entry) => {
      const updatedAt = new Date(entry.updatedAt);
      return (
        updatedAt.getMonth() === currentMonth &&
        updatedAt.getFullYear() === currentYear &&
        validStatuses.includes(entry.status)
      );
    }).length;
  }, [entries]);

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
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      // Log decoded token for debugging
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded);
      } catch (decodeError) {
        console.error("Token decode error:", decodeError.message);
        toast.error("Invalid token. Please log in again.");
        navigate("/login");
        return;
      }

      console.log("Fetching entries with userId:", userId, "role:", role);

      const response = await axios.get(
        "https://dms-server-vryx.onrender.com/api/fetch-entry",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!Array.isArray(response.data.data)) {
        console.error("Invalid entries data:", response.data);
        toast.error("Invalid data received from server.");
        setEntries([]);
        return;
      }

      let fetchedEntries = response.data.data;

      if (role !== "Superadmin" && role !== "Admin") {
        fetchedEntries = fetchedEntries.filter(
          (entry) => normalizeId(entry.createdBy?._id) === userId
        );
      }

      console.log("Fetched and filtered entries:", fetchedEntries.length);
      setEntries(fetchedEntries);
    } catch (error) {
      console.error("Error fetching data:", {
        message: error.message,
        response: error.response?.data,
      });
      toast.error("Failed to fetch entries!");
      setEntries([]);
    } finally {
      setLoading(false);
      setListKey(Date.now());
      if (listRef.current) {
        listRef.current.recomputeRowHeights();
        listRef.current.forceUpdateGrid();
      }
    }
  }, [userId, role, navigate]);

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
        return;
      }

      const decoded = jwtDecode(token);
      const userRole = decoded.role || "Others";
      const userId = decoded.id;

      const response = await axios.get(
        "https://dms-server-vryx.onrender.com/api/user-role",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setIsAdmin(response.data.isAdmin || false);
      setIsSuperadmin(response.data.isSuperadmin || false);
      setRole(userRole);
      setUserId(userId);

      console.log("Fetched user info:", { userId, role: userRole });
      localStorage.setItem("userId", userId);
      localStorage.setItem("role", userRole);
    } catch (error) {
      console.error("Error fetching admin status:", error.message);
      setIsAdmin(false);
      setIsSuperadmin(false);
      setRole("Others");
      setUserId("");
      toast.error("Session expired. Please log in again.");
      navigate("/login");
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      await fetchAdmin();
      if (isMounted) {
        await fetchEntries();
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
      status: newEntry.status || "Not Found",
      expectedClosingDate: newEntry.expectedClosingDate || "",
      followUpDate: newEntry.followUpDate || "",
      remarks: newEntry.remarks || "",
      email: newEntry.email || "",
      createdBy: {
        _id: localStorage.getItem("userId"),
        username: newEntry.createdBy?.username || "",
      },
      updatedAt: newEntry.updatedAt || new Date().toISOString(),
    };
    setEntries((prev) => [completeEntry, ...prev]);
    setListKey(Date.now());
    if (listRef.current) {
      listRef.current.recomputeRowHeights();
      listRef.current.forceUpdateGrid();
    }
  }, []);

  const handleEntryUpdated = useCallback(
    (updatedEntry) => {
      const currentScrollPosition =
        listRef.current?.getOffsetForRow({
          alignment: "start",
          index: filteredData.findIndex(
            (entry) => entry._id === updatedEntry._id
          ),
        }) || 0;
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry._id === updatedEntry._id ? { ...updatedEntry } : entry
        )
      );
      setSelectedEntry((prevSelected) =>
        prevSelected && prevSelected._id === updatedEntry._id
          ? { ...updatedEntry }
          : prevSelected
      );
      setEntryToEdit((prevEntryToEdit) =>
        prevEntryToEdit && prevEntryToEdit._id === updatedEntry._id
          ? { ...updatedEntry }
          : prevEntryToEdit
      );
      setEditModalOpen(false);
      setListKey(Date.now());
      setScrollPosition(currentScrollPosition);
    },
    [filteredData]
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
            "Customer Name": item["Customer Name"] || "",
            "Contact Person": item["Contact Person"] || "",
            Email: item["Email"] || "",
            "Contact Number": item["Contact Number"] || "",
            "Alternate Number": item["Alternate Number"] || "",
            Product: item["Product"] || "",
            Address: item["Address"] || "",
            Organization: item["Organization"] || "",
            Category: item["Category"] || "",
            District: item["District"] || "",
            State: item["State"] || "",
            Status: item["Status"] || "Not Found",
            Remarks: item["Remarks"] || "",
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

        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < newEntries.length; i += chunkSize) {
          chunks.push(newEntries.slice(i, i + chunkSize));
        }

        let uploadedCount = 0;
        const errors = [];
        const token = localStorage.getItem("token");

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          try {
            const response = await axios.post(
              "https://dms-server-vryx.onrender.com/api/entries",
              chunk,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
                timeout: 60000,
              }
            );

            if (response.status === 201 || response.status === 200) {
              uploadedCount += chunk.length;
              setEntries((prev) => [
                ...prev,
                ...chunk.map((entry) => ({
                  ...entry,
                  _id: `temp-${Date.now()}-${Math.random()}`,
                  createdBy: {
                    username: localStorage.getItem("username") || "Unknown",
                  },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })),
              ]);
              toast.success(
                `Uploaded ${uploadedCount} of ${newEntries.length} entries`
              );
            } else if (response.status === 207) {
              uploadedCount += parseInt(
                response.data.message.match(/(\d+)/)?.[0] || 0
              );
              errors.push(...response.data.errors);
              setEntries((prev) => [
                ...prev,
                ...chunk.map((entry) => ({
                  ...entry,
                  _id: `temp-${Date.now()}-${Math.random()}`,
                  createdBy: {
                    username: localStorage.getItem("username") || "Unknown",
                  },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })),
              ]);
              toast.warn(
                `Partially uploaded ${uploadedCount} of ${newEntries.length} entries`
              );
            }
          } catch (error) {
            const errorMessage =
              error.response?.data?.message ||
              `Batch ${i + 1}: Failed to upload chunk`;
            errors.push(errorMessage);
            toast.error(errorMessage);
          }
        }

        if (uploadedCount === newEntries.length && errors.length === 0) {
          toast.success("All entries uploaded successfully!");
          fetchEntries();
        } else if (uploadedCount > 0) {
          toast.warn(
            `Uploaded ${uploadedCount} of ${
              newEntries.length
            } entries. Errors: ${errors.join("; ")}`
          );
          fetchEntries();
        } else {
          toast.error(`Failed to upload entries. Errors: ${errors.join("; ")}`);
        }
      } catch (error) {
        console.error("Error processing Excel file:", error.message);
        toast.error(`Invalid Excel file: ${error.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

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

    XLSX.writeFile(workbook, "entries.xlsx");
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
        <div className="virtual-cell">{index + 1}</div>
        <div className="virtual-cell">
          <div className="virtual-cell">{formatDate(row.createdAt)}</div>
        </div>
        <div className="virtual-cell">{row.customerName}</div>
        <div className="virtual-cell">{row.contactName}</div>
        <div className="virtual-cell">{row.mobileNumber}</div>
        <div className="virtual-cell">{row.address}</div>
        <div className="virtual-cell">{row.city}</div>
        <div className="virtual-cell">{row.state}</div>
        <div className="virtual-cell">{row.createdBy?.username}</div>
        <div
          className="virtual-cell actions-cell"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "150px",
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
      <div className="enhanced-search-bar-container">
        <input
          style={{ width: "25%" }}
          type="text"
          className="enhanced-search-bar"
          placeholder="🔍 Search..."
          onChange={handleSearchChange}
        />
        <select
          className="enhanced-filter-dropdown"
          value={selectedOrganization}
          onChange={handleOrganizationChange}
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
            onClick={handleOpen}
            value={
              dateRange[0]?.startDate && dateRange[0]?.endDate
                ? `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
                : ""
            }
            placeholder="-- Select date range -- "
            readOnly
            className="cursor-pointer border p-2"
          />
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <DateRangePicker
              ranges={dateRange}
              onChange={(item) => setDateRange([item.selection])}
              moveRangeOnFirstSelection={false}
              showSelectionPreview={true}
              rangeColors={["#2575fc"]}
              editableDateInputs={true}
              months={1}
              direction="horizontal"
            />
          </Popover>
        </div>
        <select
          className="enhanced-filter-dropdown"
          value={selectedStateA}
          onChange={handleStateChangeA}
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
            padding: "8px 16px",
            borderRadius: "20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            transition: "all 0.3s ease",
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
      </div>
      <div
        className="dashboard-container"
        style={{ width: "90%", margin: "auto", padding: "20px" }}
      >
        <CallTrackingDashboard
          filteredEntries={filteredData}
          onFilterClick={handleDashboardFilterClick}
          selectedCategory={dashboardFilter}
        />
        <div style={{ textAlign: "center" }}>
          <label
            style={{
              padding: "12px 20px",
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              color: "white",
              borderRadius: "12px",
              marginLeft: "5%",
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
            className="button mx-3"
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
            <div style={{ marginTop: "10px", marginLeft: "50px" }}>
              {isSelectionMode && (
                <Button
                  variant="info"
                  className="select mx-3"
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
                    className="copy mx-2"
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
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div
            style={{
              fontWeight: "600",
              fontSize: "1rem",
              color: "#fff",
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              padding: "5px 15px",
              borderRadius: "20px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              display: "inline-block",
              textAlign: "center",
              width: "auto",
              textTransform: "capitalize",
            }}
          >
            Total Leads: {callStats.total}
          </div>

          <div
            style={{
              fontWeight: "600",
              fontSize: "1rem",
              color: "#fff",
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              padding: "5px 15px",
              borderRadius: "20px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              display: "inline-block",
              textAlign: "center",
              width: "auto",
              textTransform: "capitalize",
            }}
          >
            Total Results: {filteredData.length}
          </div>
          <div
            style={{
              fontWeight: "600",
              fontSize: "1rem",
              color: "#fff",
              background: "linear-gradient(90deg, #ff4444, #cc0000)",
              padding: "5px 15px",
              borderRadius: "20px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              display: "inline-block",
              textAlign: "center",
              width: "auto",
              textTransform: "capitalize",
            }}
          >
            Monthly Calls: {monthlyCalls}
          </div>
        </div>
        <div
          className="table-container"
          style={{
            width: "100%",
            height: "75vh",
            margin: "0 auto",
            overflow: "auto",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
            borderRadius: "15px",
            marginTop: "20px",
            backgroundColor: "#fff",
          }}
        >
          <div
            className="table-header"
            style={{
              background: "linear-gradient(135deg, #2575fc, #6a11cb)",
              color: "white",
              fontSize: "1.1rem",
              padding: "15px 20px",
              textAlign: "center",
              position: "sticky",
              top: 0,
              zIndex: 2,
              display: "grid",
              gridTemplateColumns: "115px repeat(8, 1fr) 150px",
              fontWeight: "bold",
              borderBottom: "2px solid #ddd",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div>#</div>
            <div style={{ alignItems: "center", justifyContent: "center" }}>
              Date
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Customer
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Contact Person
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Mobile
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Address
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              District
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              State
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              User
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Actions
            </div>
          </div>
          {filteredData.length === 0 ? (
            <div
              style={{
                height: "calc(100% - 60px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "1.5rem",
                color: "#666",
                fontWeight: "bold",
                textAlign: "center",
                padding: "20px",
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
                  width={width}
                  height={height - 60}
                  rowCount={filteredData.length}
                  rowHeight={60}
                  rowRenderer={rowRenderer}
                  overscanRowCount={10}
                  style={{ outline: "none" }}
                  onScroll={({ scrollTop }) => setScrollPosition(scrollTop)}
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
    </>
  );
}

export default DashBoard;
