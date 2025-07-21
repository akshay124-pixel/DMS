import axios from "axios";
import DOMPurify from "dompurify";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const normalizeRole = (role) => {
  if (!role) return "Others";
  const r = role.toLowerCase();
  return r.charAt(0).toUpperCase() + r.slice(1);
};

const normalizeId = (id) => {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (id._id) return id._id.toString();
  if (id.$oid) return id.$oid.toString();
  return null;
};

let userCache = null;

const fetchUsers = async (entries, userId, role) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please log in to continue.");

    if (userCache) {
      console.log("Using cached users:", userCache.length);
      return userCache;
    }

    console.log("fetchUsers: userId:", userId, "role:", role);
    const response = await axios.get(
      "https://dms-server-l4l6.onrender.com/api/users",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    let users = Array.isArray(response.data.data) ? response.data.data : [];
    console.log(
      "Fetched users from API:",
      users.length,
      users.map((u) => ({ _id: u._id, role: u.role }))
    );

    users = users
      .map((user) => ({
        _id: normalizeId(user._id),
        username: DOMPurify.sanitize(user.username || "Unknown"),
        role: normalizeRole(user.role),
      }))
      .filter((user) => user._id);

    if (users.length === 0) {
      console.warn("No users from API, using fallback from entries");
      const userMap = new Map();
      entries.forEach((entry) => {
        const creator = entry.createdBy || {};
        const creatorId = normalizeId(creator);
        const username = DOMPurify.sanitize(
          creator.username || `User_${creatorId || "Unknown"}`
        );
        if (creatorId) {
          userMap.set(creatorId, { _id: creatorId, username, role: "Others" });
        } else {
          console.warn("Entry missing valid createdBy:", entry._id);
        }
      });
      users = Array.from(userMap.values());
      console.log("Fallback users from entries:", users.length, users);
    }

    if (!users.some((user) => user._id === userId)) {
      users.push({
        _id: userId,
        username: "Current User",
        role: normalizeRole(role),
      });
      console.log("Added current user to users list:", userId);
    }

    userCache = users;
    console.log("Final users list:", userCache.length, userCache);
    return userCache;
  } catch (err) {
    console.error("fetchUsers Error:", err.message);
    toast.error(err.message || "Failed to fetch users.");
    return [
      { _id: userId, username: "Current User", role: normalizeRole(role) },
    ];
  }
};

const filterEntriesByDateRange = (entries, dateRange) => {
  if (!dateRange?.[0]?.startDate || !dateRange?.[0]?.endDate) return entries;
  const filtered = entries.filter((entry) => {
    const createdAt = new Date(entry.createdAt);
    if (isNaN(createdAt.getTime())) {
      console.warn("Invalid createdAt in entry:", entry._id);
      return false;
    }
    const startDate = new Date(dateRange[0].startDate);
    const endDate = new Date(dateRange[0].endDate);
    return createdAt >= startDate && createdAt <= endDate;
  });
  console.log("Entries after date range filter:", filtered.length);
  return filtered;
};

const exportAnalytics = (data, sheetName, filePrefix, dateRange) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    worksheet["!cols"] = Object.keys(data[0]).map((key) => ({
      wch: Math.min(Math.max(key.length, 15) + 2, 50),
    }));

    const dateStr = dateRange?.[0]?.startDate
      ? `${new Date(dateRange[0].startDate)
          .toISOString()
          .slice(0, 10)}_to_${new Date(dateRange[0].endDate)
          .toISOString()
          .slice(0, 10)}`
      : new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${filePrefix}_${dateStr}.xlsx`);
    toast.success(`${sheetName} exported successfully!`);
  } catch (error) {
    console.error(`Error exporting ${sheetName}:`, error);
    toast.error(`Failed to export ${sheetName}!`);
  }
};

export {
  normalizeRole,
  normalizeId,
  fetchUsers,
  filterEntriesByDateRange,
  exportAnalytics,
};
