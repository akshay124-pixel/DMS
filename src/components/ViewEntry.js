import React, { useState, useCallback } from "react";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";

function ViewEntry({ isOpen, onClose, entry, isAdmin }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!isAdmin) {
      toast.error("You do not have permission to copy data.");
      return;
    }

    if (!entry) return;

    const textToCopy = `
      Date: ${
        entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "N/A"
      }
      Customer Name: ${entry.customerName || "N/A"}
      Mobile Number: ${entry.mobileNumber || "N/A"}
      Products: ${entry.products || "N/A"}
      Customer Type: ${entry.type || "N/A"}
      Address: ${entry.address || "N/A"}
      City: ${entry.city || "N/A"}
      State: ${entry.state || "N/A"}
      Organization: ${entry.organization || "N/A"}
      Category: ${entry.category || "N/A"}
      Status: ${entry.status || "Not Interested"}
      Expected Closing Date: ${
        entry.expectedClosingDate
          ? new Date(entry.expectedClosingDate).toLocaleDateString()
          : "N/A"
      }
      Follow Up Date: ${
        entry.followUpDate
          ? new Date(entry.followUpDate).toLocaleDateString()
          : "N/A"
      }
      Remarks: ${entry.remarks || "N/A"}
      Updated At: ${
        entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : "N/A"
      }
    `.trim();
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        toast.success("Details copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        toast.error("Failed to copy details!");
        console.error("Copy error:", err);
      });
  }, [entry, isAdmin]);

  if (!entry) return null;

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      backdrop="static"
      keyboard={false}
      size="lg"
      aria-labelledby="view-entry-modal-title"
      dialogClassName="compact-modal"
    >
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #2575fc, #6a11cb)",
          color: "#fff",
          padding: "1.5rem 2rem",
          borderBottom: "none",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Modal.Title
          id="view-entry-modal-title"
          style={{
            fontWeight: "700",
            fontSize: "1.8rem",
            letterSpacing: "1px",
            textTransform: "uppercase",
            textShadow: "1px 1px 3px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginRight: "10px", fontSize: "1.5rem" }}>📋</span>{" "}
          Client Profile
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{
          padding: "2rem",
          background: "#ffffff",
          borderRadius: "0 0 15px 15px",
          minHeight: "550px",
          boxShadow: "inset 0 -4px 15px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Personal Info Section */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "10px",
            padding: "1.2rem",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: "600",
              color: "#333",
              marginBottom: "0.5rem",
            }}
          >
            Personal Info
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Name:</strong> {entry.customerName || "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Mobile:</strong> {entry.mobileNumber || "N/A"}
            </span>
          </div>
        </div>

        {/* Location Section */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "10px",
            padding: "1.2rem",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: "600",
              color: "#333",
              marginBottom: "0.5rem",
            }}
          >
            Location
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Address:</strong> {entry.address || "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>City:</strong> {entry.city || "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>State:</strong> {entry.state || "N/A"}
            </span>
          </div>
        </div>

        {/* Business Info Section */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "10px",
            padding: "1.2rem",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: "600",
              color: "#333",
              marginBottom: "0.5rem",
            }}
          >
            Business Info
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Organization:</strong> {entry.organization || "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Category:</strong> {entry.category || "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Products:</strong> {entry.products || "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Type:</strong> {entry.type || "N/A"}
            </span>
          </div>
        </div>

        {/* Follow-up Section */}
        <div
          style={{
            background: "#fafafa",
            borderRadius: "10px",
            padding: "1.2rem",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: "600",
              color: "#333",
              marginBottom: "0.5rem",
            }}
          >
            Follow-up
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Status:</strong> {entry.status || "Not Interested"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Expected Close:</strong>{" "}
              {entry.expectedClosingDate
                ? new Date(entry.expectedClosingDate).toLocaleDateString()
                : "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Follow Up:</strong>{" "}
              {entry.followUpDate
                ? new Date(entry.followUpDate).toLocaleDateString()
                : "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Remarks:</strong> {entry.remarks || "N/A"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Created:</strong>{" "}
              {entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
            <span style={{ fontSize: "1rem", color: "#555" }}>
              <strong>Updated:</strong>{" "}
              {entry.updatedAt
                ? new Date(entry.updatedAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleCopy}
          disabled={!isAdmin}
          style={{
            marginTop: "1.5rem",
            background: isAdmin
              ? "linear-gradient(135deg, #2575fc, #6a11cb)"
              : "#cccccc",
            color: "#fff",
            width: "100%",
            borderRadius: "40px",
            padding: "12px 0",
            fontSize: "1.1rem",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "1px",
            transition: "all 0.3s ease",
            boxShadow: "0 6px 15px rgba(0, 0, 0, 0.2)",
            border: "none",
          }}
          onMouseEnter={(e) =>
            isAdmin && (e.target.style.transform = "translateY(-3px)")
          }
          onMouseLeave={(e) =>
            isAdmin && (e.target.style.transform = "translateY(0)")
          }
        >
          {copied ? "✅ Copied!" : "📑 Copy Details"}
        </Button>
      </Modal.Body>
    </Modal>
  );
}

export default ViewEntry;

// Add this CSS to your global stylesheet (e.g., index.css)
const customStyles = `
  .compact-modal {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    max-width: 900px !important;
    width: 85% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .compact-modal .modal-content {
    border: none !important;
    border-radius: 15px !important;
    overflow: hidden !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
  }
`;
