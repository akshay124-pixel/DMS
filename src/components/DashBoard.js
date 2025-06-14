import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Popover } from "@mui/material";
import { FaEye } from "react-icons/fa";
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
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";

// Separate Call Tracking Dashboard Component
const CallTrackingDashboard = ({
  entries,
  isAdmin,
  onFilterChange,
  selectedCategory,
}) => {
  const callStats = useMemo(() => {
    const stats = {
      cold: 0,
      warm: 0,
      hot: 0,
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
    });

    stats.total = stats.total - (stats.cold + stats.warm + stats.hot);

    return stats;
  }, [entries]);

  const handleCategoryClick = (category) => {
    onFilterChange(category);
  };

  if (!isAdmin) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                sx={{
                  backgroundColor: "#e3f2fd",
                  boxShadow: 3,
                  border:
                    selectedCategory === "total" ? "2px solid #1976d2" : "none",
                }}
                onClick={() => handleCategoryClick("total")}
              >
                <CardContent>
                  <Typography variant="h6" color="textSecondary">
                    Total Leads
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "#0288d1" }}
                  >
                    {callStats.total}
                  </Typography>
                  <Chip
                    label="All Leads"
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={3}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                sx={{
                  backgroundColor: "#ffebee",
                  boxShadow: 3,
                  border:
                    selectedCategory === "Interested"
                      ? "2px solid #d32f2f"
                      : "none",
                }}
                onClick={() => handleCategoryClick("Interested")}
              >
                <CardContent>
                  <Typography variant="h6" color="textSecondary">
                    Hot Calls
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "#d32f2f" }}
                  >
                    {callStats.hot}
                  </Typography>
                  <Chip
                    label="Interested"
                    size="small"
                    color="error"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={3}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                sx={{
                  backgroundColor: "#fff3e0",
                  boxShadow: 3,
                  border:
                    selectedCategory === "Maybe" ? "2px solid #f57c00" : "none",
                }}
                onClick={() => handleCategoryClick("Maybe")}
              >
                <CardContent>
                  <Typography variant="h6" color="textSecondary">
                    Warm Calls
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "#f57c00" }}
                  >
                    {callStats.warm}
                  </Typography>
                  <Chip
                    label="Maybe"
                    size="small"
                    color="warning"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={3}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                sx={{
                  backgroundColor: "#e8f5e9",
                  boxShadow: 3,
                  border:
                    selectedCategory === "Not Interested"
                      ? "2px solid #388e3c"
                      : "none",
                }}
                onClick={() => handleCategoryClick("Not Interested")}
              >
                <CardContent>
                  <Typography variant="h6" color="textSecondary">
                    Cold Calls
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "#388e3c" }}
                  >
                    {callStats.cold}
                  </Typography>
                  <Chip
                    label="Not Interested"
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
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
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleClosed = () => setShowDetails(false);

  const debouncedSearchChange = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );
  // Update filteredData useMemo
  const filteredData = useMemo(() => {
    return entries
      .filter((row) => {
        const createdAt = new Date(row.createdAt);

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
            createdAt >= new Date(dateRange[0]?.startDate) &&
            createdAt <= new Date(dateRange[0]?.endDate));

        const matchesCreatedBy =
          !selectedCreatedBy || row.createdBy?.username === selectedCreatedBy;

        const matchesDashboardFilter =
          dashboardFilter === "total" || row.status === dashboardFilter;

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

  const handleDashboardFilterChange = (category) => {
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

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://dms-server-eneu.onrender.com/api/fetch-entry",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEntries(response.data);
    } catch (error) {
      console.error("Error fetching data:", error.message);
      toast.error("Failed to fetch entries!");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdmin = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAdmin(false);
        setIsSuperadmin(false);
        return;
      }
      const response = await axios.get(
        "https://dms-server-eneu.onrender.com/api/user-role",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsAdmin(response.data.isAdmin || false);
      setIsSuperadmin(response.data.isSuperadmin || false);
    } catch (error) {
      console.error("Error fetching admin status:", error.message);
      setIsAdmin(false);
      setIsSuperadmin(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchAdmin();
  }, [fetchEntries, fetchAdmin]);

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
  }, []);

  const handleEntryUpdated = useCallback((updatedEntry) => {
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
  }, []);

  const handleDoubleClick = (id) => {
    if (!doubleClickInitiated && (isAdmin || isSuperadmin)) {
      // Changed from isAdmin
      setIsSelectionMode(true);
      setDoubleClickInitiated(true);
      setSelectedEntries([id]);
    }
  };

  const handleSingleClick = (id) => {
    if (isSelectionMode && (isAdmin || isSuperadmin)) {
      // Changed from isAdmin
      setSelectedEntries((prev) =>
        prev.includes(id)
          ? prev.filter((entryId) => entryId !== id)
          : [...prev, id]
      );
    }
  };

  const handleSelectAll = () => {
    if (isSelectionMode && (isAdmin || isSuperadmin)) {
      // Changed from isAdmin
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

        const newEntries = parsedData.map((item) => ({
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
        }));

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
              "https://dms-server-eneu.onrender.com/api/entries",
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

    // Prepare data for export, excluding Created At and Updated At
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

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Entries");

    // Export to Excel
    XLSX.writeFile(workbook, "entries.xlsx");
    toast.success("Entries exported successfully!");
  };
  const statesAndCities = {
    "Andhra Pradesh": [
      "Alluri Sitharama Raju",
      "Anakapalli",
      "Anantapur",
      "Annamayya",
      "Bapatla",
      "Chittoor",
      "Dr. B.R. Ambedkar Konaseema",
      "East Godavari",
      "Eluru",
      "Guntur",
      "Kadapa",
      "Kakinada",
      "Krishna",
      "Kurnool",
      "Nandyal",
      "Nellore",
      "Palnadu",
      "Parvathipuram Manyam",
      "Prakasam",
      "Sri Balaji",
      "Sri Potti Sriramulu Nellore",
      "Sri Sathya Sai",
      "Srikakulam",
      "Tirupati",
      "Visakhapatnam",
      "Vizianagaram",
      "West Godavari",
    ],
    "Arunachal Pradesh": [
      "Anjaw",
      "Changlang",
      "Dibang Valley",
      "East Kameng",
      "East Siang",
      "Itanagar Capital Complex",
      "Kamle",
      "Kra Daadi",
      "Kurung Kumey",
      "Lepa Rada",
      "Lohit",
      "Longding",
      "Lower Dibang Valley",
      "Lower Siang",
      "Lower Subansiri",
      "Namsai",
      "Pakke-Kessang",
      "Papum Pare",
      "Shi-Yomi",
      "Siang",
      "Tawang",
      "Tirap",
      "Upper Siang",
      "Upper Subansiri",
      "West Kameng",
      "West Siang",
    ],
    Assam: [
      "Bajali",
      "Baksa",
      "Barpeta",
      "Biswanath",
      "Bongaigaon",
      "Cachar",
      "Charaideo",
      "Chirang",
      "Darrang",
      "Dhemaji",
      "Dhubri",
      "Dibrugarh",
      "Dima Hasao",
      "Goalpara",
      "Golaghat",
      "Hailakandi",
      "Hojai",
      "Jorhat",
      "Kamrup",
      "Kamrup Metropolitan",
      "Karbi Anglong",
      "Karimganj",
      "Kokrajhar",
      "Lakhimpur",
      "Majuli",
      "Morigaon",
      "Nagaon",
      "Nalbari",
      "Sivasagar",
      "Sonitpur",
      "South Salmara-Mankachar",
      "Tamulpur",
      "Tinsukia",
      "Udalguri",
      "West Karbi Anglong",
    ],
    Bihar: [
      "Araria",
      "Arwal",
      "Aurangabad",
      "Banka",
      "Begusarai",
      "Bhagalpur",
      "Bhojpur",
      "Buxar",
      "Darbhanga",
      "East Champaran",
      "Gaya",
      "Gopalganj",
      "Jamui",
      "Jehanabad",
      "Kaimur",
      "Katihar",
      "Khagaria",
      "Kishanganj",
      "Lakhisarai",
      "Madhepura",
      "Madhubani",
      "Munger",
      "Muzaffarpur",
      "Nalanda",
      "Nawada",
      "Patna",
      "Purnia",
      "Rohtas",
      "Saharsa",
      "Samastipur",
      "Saran",
      "Sheikhpura",
      "Sheohar",
      "Sitamarhi",
      "Siwan",
      "Supaul",
      "Vaishali",
      "West Champaran",
    ],
    Chhattisgarh: [
      "Balod",
      "Baloda Bazar",
      "Balrampur-Ramanujganj",
      "Bastar",
      "Bemetara",
      "Bijapur",
      "Bilaspur",
      "Dantewada",
      "Dhamtari",
      "Durg",
      "Gariaband",
      "Gaurela-Pendra-Marwahi",
      "Janjgir-Champa",
      "Jashpur",
      "Kanker",
      "Khairagarh-Chhuri-Khalari",
      "Kondagaon",
      "Korba",
      "Korea",
      "Mahasamund",
      "Manendragarh-Chirmiri-Bharatpur",
      "Mohla-Manpur-Ambagarh Chowki",
      "Mungeli",
      "Narayanpur",
      "Raigarh",
      "Raipur",
      "Rajnandgaon",
      "Sakti",
      "Sarangarh-Bilaigarh",
      "Sukma",
      "Surajpur",
      "Surguja",
    ],
    Goa: ["North Goa", "South Goa"],
    Gujarat: [
      "Ahmedabad",
      "Amreli",
      "Anand",
      "Aravalli",
      "Banaskantha",
      "Bharuch",
      "Bhavnagar",
      "Botad",
      "Chhota Udaipur",
      "Dahod",
      "Dang",
      "Devbhoomi Dwarka",
      "Gandhinagar",
      "Gir Somnath",
      "Jamnagar",
      "Junagadh",
      "Kheda",
      "Kutch",
      "Mahisagar",
      "Mehsana",
      "Morbi",
      "Narmada",
      "Navsari",
      "Panchmahal",
      "Patan",
      "Porbandar",
      "Rajkot",
      "Sabarkantha",
      "Surat",
      "Surendranagar",
      "Tapi",
      "Vadodara",
      "Valsad",
    ],
    Haryana: [
      "Ambala",
      "Bhiwani",
      "Charkhi Dadri",
      "Faridabad",
      "Fatehabad",
      "Gurugram",
      "Hisar",
      "Jhajjar",
      "Jind",
      "Kaithal",
      "Karnal",
      "Kurukshetra",
      "Mahendragarh",
      "Nuh",
      "Palwal",
      "Panchkula",
      "Panipat",
      "Rewari",
      "Rohtak",
      "Sirsa",
      "Sonipat",
      "Yamunanagar",
    ],
    "Himachal Pradesh": [
      "Bilaspur",
      "Chamba",
      "Hamirpur",
      "Kangra",
      "Kinnaur",
      "Kullu",
      "Lahaul and Spiti",
      "Mandi",
      "Shimla",
      "Sirmaur",
      "Solan",
      "Una",
    ],
    Jharkhand: [
      "Bokaro",
      "Chatra",
      "Deoghar",
      "Dhanbad",
      "Dumka",
      "East Singhbhum",
      "Garhwa",
      "Giridih",
      "Godda",
      "Gumla",
      "Hazaribagh",
      "Jamtara",
      "Khunti",
      "Koderma",
      "Latehar",
      "Lohardaga",
      "Pakur",
      "Palamu",
      "Ramgarh",
      "Ranchi",
      "Sahibganj",
      "Seraikela-Kharsawan",
      "Simdega",
      "West Singhbhum",
    ],
    Karnataka: [
      "Bagalkot",
      "Ballari",
      "Belagavi",
      "Bengaluru Rural",
      "Bengaluru Urban",
      "Bidar",
      "Chamarajanagar",
      "Chikkaballapura",
      "Chikkamagaluru",
      "Chitradurga",
      "Dakshina Kannada",
      "Davanagere",
      "Dharwad",
      "Gadag",
      "Hassan",
      "Haveri",
      "Kalaburagi",
      "Kodagu",
      "Kolar",
      "Koppal",
      "Mandya",
      "Mysuru",
      "Raichur",
      "Ramanagara",
      "Shivamogga",
      "Tumakuru",
      "Udupi",
      "Uttara Kannada",
      "Vijayanagara",
      "Vijayapura",
      "Yadgir",
    ],
    Kerala: [
      "Alappuzha",
      "Ernakulam",
      "Idukki",
      "Kannur",
      "Kasaragod",
      "Kollam",
      "Kottayam",
      "Kozhikode",
      "Malappuram",
      "Palakkad",
      "Pathanamthitta",
      "Thiruvananthapuram",
      "Thrissur",
      "Wayanad",
    ],
    "Madhya Pradesh": [
      "Agar Malwa",
      "Alirajpur",
      "Anuppur",
      "Ashoknagar",
      "Balaghat",
      "Barwani",
      "Betul",
      "Bhind",
      "Bhopal",
      "Burhanpur",
      "Chhatarpur",
      "Chhindwara",
      "Damoh",
      "Datia",
      "Dewas",
      "Dhar",
      "Dindori",
      "Guna",
      "Gwalior",
      "Harda",
      "Hoshangabad",
      "Indore",
      "Jabalpur",
      "Jhabua",
      "Katni",
      "Khandwa",
      "Khargone",
      "Mandla",
      "Mandsaur",
      "Maihar",
      "Mauganj",
      "Morena",
      "Narsinghpur",
      "Neemuch",
      "Niwari",
      "Pandhurna",
      "Panna",
      "Raisen",
      "Rajgarh",
      "Ratlam",
      "Rewa",
      "Sagar",
      "Satna",
      "Sehore",
      "Seoni",
      "Shahdol",
      "Shajapur",
      "Sheopur",
      "Shivpuri",
      "Sidhi",
      "Singrauli",
      "Tikamgarh",
      "Ujjain",
      "Umaria",
      "Vidisha",
    ],
    Maharashtra: [
      "Ahmednagar",
      "Akola",
      "Amravati",
      "Aurangabad",
      "Beed",
      "Bhandara",
      "Buldhana",
      "Chandrapur",
      "Dhule",
      "Gadchiroli",
      "Gondia",
      "Hingoli",
      "Jalgaon",
      "Jalna",
      "Kolhapur",
      "Latur",
      "Mumbai City",
      "Mumbai Suburban",
      "Nagpur",
      "Nanded",
      "Nandurbar",
      "Nashik",
      "Osmanabad",
      "Palghar",
      "Parbhani",
      "Pune",
      "Raigad",
      "Ratnagiri",
      "Sangli",
      "Satara",
      "Sindhudurg",
      "Solapur",
      "Thane",
      "Wardha",
      "Washim",
      "Yavatmal",
    ],
    Manipur: [
      "Bishnupur",
      "Chandel",
      "Churachandpur",
      "Imphal East",
      "Imphal West",
      "Jiribam",
      "Kakching",
      "Kamjong",
      "Kangpokpi",
      "Noney",
      "Pherzawl",
      "Senapati",
      "Tamenglong",
      "Tengnoupal",
      "Thoubal",
      "Ukhrul",
    ],
    Meghalaya: [
      "East Garo Hills",
      "East Jaintia Hills",
      "East Khasi Hills",
      "North Garo Hills",
      "Ri-Bhoi",
      "South Garo Hills",
      "South West Garo Hills",
      "South West Khasi Hills",
      "West Garo Hills",
      "West Jaintia Hills",
      "West Khasi Hills",
    ],
    Mizoram: [
      "Aizawl",
      "Champhai",
      "Hnahthial",
      "Khawzawl",
      "Kolasib",
      "Lawngtlai",
      "Lunglei",
      "Mamit",
      "Saiha",
      "Saitual",
      "Serchhip",
    ],
    Nagaland: [
      "Chumukedima",
      "Dimapur",
      "Kiphire",
      "Kohima",
      "Longleng",
      "Mokokchung",
      "Mon",
      "Niuland",
      "Noklak",
      "Peren",
      "Phek",
      "Shamator",
      "Tsemenyu",
      "Tuensang",
      "Wokha",
      "Zunheboto",
    ],
    Odisha: [
      "Angul",
      "Balangir",
      "Balasore",
      "Bargarh",
      "Bhadrak",
      "Boudh",
      "Cuttack",
      "Deogarh",
      "Dhenkanal",
      "Gajapati",
      "Ganjam",
      "Jagatsinghpur",
      "Jajpur",
      "Jharsuguda",
      "Kalahandi",
      "Kandhamal",
      "Kendrapara",
      "Kendujhar",
      "Khordha",
      "Koraput",
      "Malkangiri",
      "Mayurbhanj",
      "Nabarangpur",
      "Nayagarh",
      "Nuapada",
      "Puri",
      "Rayagada",
      "Sambalpur",
      "Subarnapur",
      "Sundargarh",
    ],
    Punjab: [
      "Amritsar",
      "Barnala",
      "Bathinda",
      "Faridkot",
      "Fatehgarh Sahib",
      "Fazilka",
      "Firozpur",
      "Gurdaspur",
      "Hoshiarpur",
      "Jalandhar",
      "Kapurthala",
      "Ludhiana",
      "Malerkotla",
      "Mansa",
      "Moga",
      "Pathankot",
      "Patiala",
      "Rupnagar",
      "S.A.S. Nagar",
      "Sangrur",
      "Shahid Bhagat Singh Nagar",
      "Sri Muktsar Sahib",
      "Tarn Taran",
    ],
    Rajasthan: [
      "Ajmer",
      "Alwar",
      "Anupgarh",
      "Balotra",
      "Banswara",
      "Baran",
      "Barmer",
      "Beawar",
      "Bharatpur",
      "Bhilwara",
      "Bikaner",
      "Bundi",
      "Chittorgarh",
      "Churu",
      "Dausa",
      "Deeg",
      "Dholpur",
      "Dudu",
      "Dungarpur",
      "Ganganagar",
      "Gangapur City",
      "Hanumangarh",
      "Jaipur",
      "Jaisalmer",
      "Jalore",
      "Jhalawar",
      "Jhunjhunu",
      "Jodhpur",
      "Karauli",
      "Kekri",
      "Khairthal-Tijara",
      "Kota",
      "Nagaur",
      "Neem ka Thana",
      "Pali",
      "Phalodi",
      "Pratapgarh",
      "Rajsamand",
      "Sanchore",
      "Sawai Madhopur",
      "Shahpura",
      "Sikar",
      "Sirohi",
      "Sri Ganganagar",
      "Tonk",
      "Udaipur",
    ],
    Sikkim: ["Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
    "Tamil Nadu": [
      "Ariyalur",
      "Chengalpattu",
      "Chennai",
      "Coimbatore",
      "Cuddalore",
      "Dharmapuri",
      "Dindigul",
      "Erode",
      "Kallakurichi",
      "Kancheepuram",
      "Kanyakumari",
      "Karur",
      "Krishnagiri",
      "Madurai",
      "Mayiladuthurai",
      "Nagapattinam",
      "Namakkal",
      "Nilgiris",
      "Perambalur",
      "Pudukkottai",
      "Ramanathapuram",
      "Ranipet",
      "Salem",
      "Sivaganga",
      "Tenkasi",
      "Thanjavur",
      "Theni",
      "Thoothukudi",
      "Tiruchirappalli",
      "Tirunelveli",
      "Tirupathur",
      "Tiruppur",
      "Tiruvallur",
      "Tiruvannamalai",
      "Tiruvarur",
      "Vellore",
      "Viluppuram",
      "Virudhunagar",
    ],
    Telangana: [
      "Adilabad",
      "Bhadradri Kothagudem",
      "Hanumakonda",
      "Hyderabad",
      "Jagtial",
      "Jangaon",
      "Jayashankar Bhupalpally",
      "Jogulamba Gadwal",
      "Kamareddy",
      "Karimnagar",
      "Khammam",
      "Komaram Bheem",
      "Mahabubabad",
      "Mahbubnagar",
      "Mancherial",
      "Medak",
      "Medchal-Malkajgiri",
      "Mulugu",
      "Nagarkurnool",
      "Nalgonda",
      "Narayanpet",
      "Nirmal",
      "Nizamabad",
      "Peddapalli",
      "Rajanna Sircilla",
      "Rangareddy",
      "Sangareddy",
      "Siddipet",
      "Suryapet",
      "Vikarabad",
      "Wanaparthy",
      "Warangal",
      "Yadadri Bhuvanagiri",
    ],
    Tripura: [
      "Dhalai",
      "Gomati",
      "Khowai",
      "North Tripura",
      "Sepahijala",
      "South Tripura",
      "Unakoti",
      "West Tripura",
    ],
    "Uttar Pradesh": [
      "Agra",
      "Aligarh",
      "Ambedkar Nagar",
      "Amethi",
      "Amroha",
      "Auraiya",
      "Ayodhya",
      "Azamgarh",
      "Baghpat",
      "Bahraich",
      "Ballia",
      "Balrampur",
      "Banda",
      "Barabanki",
      "Bareilly",
      "Basti",
      "Bhadohi",
      "Bijnor",
      "Budaun",
      "Bulandshahr",
      "Chandauli",
      "Chitrakoot",
      "Deoria",
      "Etah",
      "Etawah",
      "Farrukhabad",
      "Fatehpur",
      "Firozabad",
      "Gautam Buddha Nagar",
      "Ghaziabad",
      "Ghazipur",
      "Gonda",
      "Gorakhpur",
      "Hamirpur",
      "Hapur",
      "Hardoi",
      "Hathras",
      "Jalaun",
      "Jaunpur",
      "Jhansi",
      "Kannauj",
      "Kanpur Dehat",
      "Kanpur Nagar",
      "Kasganj",
      "Kaushambi",
      "Kushinagar",
      "Lakhimpur Kheri",
      "Lalitpur",
      "Lucknow",
      "Maharajganj",
      "Mahoba",
      "Mainpuri",
      "Mathura",
      "Mau",
      "Meerut",
      "Mirzapur",
      "Moradabad",
      "Muzaffarnagar",
      "Pilibhit",
      "Pratapgarh",
      "Prayagraj",
      "Raebareli",
      "Rampur",
      "Saharanpur",
      "Sambhal",
      "Sant Kabir Nagar",
      "Shahjahanpur",
      "Shamli",
      "Shravasti",
      "Siddharthnagar",
      "Sitapur",
      "Sonbhadra",
      "Sultanpur",
      "Unnao",
      "Varanasi",
    ],
    Uttarakhand: [
      "Almora",
      "Bageshwar",
      "Chamoli",
      "Champawat",
      "Dehradun",
      "Haridwar",
      "Nainital",
      "Pauri Garhwal",
      "Pithoragarh",
      "Rudraprayag",
      "Tehri Garhwal",
      "Udham Singh Nagar",
      "Uttarkashi",
    ],
    "West Bengal": [
      "Alipurduar",
      "Bankura",
      "Birbhum",
      "Cooch Behar",
      "Dakshin Dinajpur",
      "Darjeeling",
      "Hooghly",
      "Howrah",
      "Jalpaiguri",
      "Jhargram",
      "Kalimpong",
      "Kolkata",
      "Maldah",
      "Murshidabad",
      "Nadia",
      "North 24 Parganas",
      "Paschim Bardhaman",
      "Paschim Medinipur",
      "Purba Bardhaman",
      "Purba Medinipur",
      "Purulia",
      "South 24 Parganas",
      "Uttar Dinajpur",
    ],
    "Andaman and Nicobar Islands": [
      "Nicobar",
      "North and Middle Andaman",
      "South Andaman",
    ],
    Chandigarh: ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": [
      "Dadra and Nagar Haveli",
      "Daman",
      "Diu",
    ],
    Delhi: [
      "Central Delhi",
      "East Delhi",
      "New Delhi",
      "North Delhi",
      "North East Delhi",
      "North West Delhi",
      "Shahdara",
      "South Delhi",
      "South East Delhi",
      "South West Delhi",
      "West Delhi",
    ],
    "Jammu and Kashmir": [
      "Anantnag",
      "Bandipora",
      "Baramulla",
      "Budgam",
      "Doda",
      "Ganderbal",
      "Jammu",
      "Kathua",
      "Kishtwar",
      "Kulgam",
      "Kupwara",
      "Poonch",
      "Pulwama",
      "Rajouri",
      "Ramban",
      "Reasi",
      "Samba",
      "Shopian",
      "Srinagar",
      "Udhampur",
    ],
    Ladakh: ["Kargil", "Leh"],
    Lakshadweep: ["Lakshadweep"],
    Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
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
          entries={entries}
          isAdmin={isAdmin || isSuperadmin}
          onFilterChange={handleDashboardFilterChange}
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
              Export To Excel
            </button>
          )}
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
        <div
          style={{
            marginBottom: "10px",
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
          className="table-container"
          style={{
            width: "100%",
            height: "75vh",
            margin: "0 auto",
            overflowX: "hidden",
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
                  width={width}
                  height={height - 60}
                  rowCount={filteredData.length}
                  rowHeight={60}
                  rowRenderer={rowRenderer}
                  overscanRowCount={10}
                  style={{ outline: "none" }}
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
