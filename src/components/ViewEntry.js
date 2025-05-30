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

    const productsText = Array.isArray(entry.products)
      ? entry.products
          .map(
            (product, index) =>
              `Product ${index + 1}: Name: ${
                product.name || "N/A"
              }, Specification: ${product.specification || "N/A"}, Size: ${
                product.size || "N/A"
              }, Quantity: ${product.quantity || "N/A"}`
          )
          .join("\n")
      : "N/A";

    const textToCopy = `
      Date: ${
        entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "N/A"
      }
      Customer Name: ${entry.customerName || "N/A"}
      Mobile Number: ${entry.mobileNumber || "N/A"}
      Alternate Number: ${entry.AlterNumber || "N/A"}
      Products: ${productsText}
      Address: ${entry.address || "N/A"}
      City: ${entry.city || "N/A"}
      State: ${entry.state || "N/A"}
      Organization: ${entry.organization || "N/A"}
      Category: ${entry.category || "N/A"}
      Status: ${entry.status || "Not Interested"}
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
      dialogClassName="modern-modal"
      centered
    >
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #2575fc, #6a11cb)",
          color: "#fff",
          padding: "1.5rem",
          borderBottom: "none",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Modal.Title
          id="view-entry-modal-title"
          style={{
            fontWeight: "600",
            fontSize: "1.5rem",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span role="img" aria-label="profile">
            👤
          </span>{" "}
          Client Profile
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{
          padding: "2rem",
          background: "#f8fafc",
          maxHeight: "70vh",
          overflowY: "auto",
          borderRadius: "0 0 12px 12px",
        }}
      >
        {/* Personal Info Section */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Personal Information</h3>
          <div style={gridStyle}>
            <DataItem label="Customer Name" value={entry.customerName} />
            <DataItem label="Contact Person" value={entry.contactName} />
            <DataItem label="Mobile Number" value={entry.mobileNumber} />
            <DataItem label="Alternate Number" value={entry.AlterNumber} />
            <DataItem label="Email" value={entry.email} />
          </div>
        </section>

        {/* Location Section */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Location Details</h3>
          <div style={gridStyle}>
            <DataItem label="Address" value={entry.address} />
            <DataItem label="City" value={entry.city} />
            <DataItem label="State" value={entry.state} />
          </div>
        </section>

        {/* Business Info Section */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Business Information</h3>
          <div style={gridStyle}>
            <DataItem label="Organization" value={entry.organization} />
            <DataItem label="Category" value={entry.category} />
            <DataItem label="Product" value={entry.product} />
          </div>
        </section>

        {/* Products Section */}
        {Array.isArray(entry.products) && entry.products.length > 0 && (
          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Products</h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {entry.products.map((product, index) => (
                <div
                  key={index}
                  style={{
                    padding: "0.8rem",
                    background: "#ffffff",
                    borderRadius: "6px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <strong>Product {index + 1}:</strong> {product.name || "N/A"}{" "}
                  | Specification: {product.specification || "N/A"} | Size:{" "}
                  {product.size || "N/A"} | Quantity:{" "}
                  {product.quantity || "N/A"}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Follow-up Section */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Follow-up Details</h3>
          <div style={gridStyle}>
            <DataItem label="Status" value={entry.status || "Not Interested"} />
            <DataItem label="Remarks" value={entry.remarks} />
            <DataItem
              label="Created"
              value={
                entry.createdAt
                  ? new Date(entry.createdAt).toLocaleDateString()
                  : "N/A"
              }
            />
            <DataItem
              label="Updated"
              value={
                entry.updatedAt
                  ? new Date(entry.updatedAt).toLocaleDateString()
                  : "N/A"
              }
            />
            <DataItem label="Created By" value={entry.createdBy?.username} />
          </div>
        </section>

        <Button
          variant="primary"
          onClick={handleCopy}
          disabled={!isAdmin}
          style={{
            marginTop: "1.5rem",
            background: isAdmin
              ? "linear-gradient(135deg, #2575fc, #6a11cb)"
              : "#d1d5db",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            fontWeight: "600",
            fontSize: "1rem",
            width: "100%",
            transition: "all 0.2s ease",
            boxShadow: isAdmin ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none",
          }}
          onMouseEnter={(e) =>
            isAdmin && (e.target.style.transform = "translateY(-2px)")
          }
          onMouseLeave={(e) =>
            isAdmin && (e.target.style.transform = "translateY(0)")
          }
        >
          {copied ? "✅ Copied!" : "📋 Copy Details"}
        </Button>
      </Modal.Body>
    </Modal>
  );
}

// Helper component for consistent data display
const DataItem = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
    <strong style={{ fontSize: "0.9rem", color: "#374151" }}>{label}:</strong>
    <span style={{ fontSize: "0.95rem", color: "#4b5563" }}>
      {value || "N/A"}
    </span>
  </div>
);

// Common styles
const sectionStyle = {
  background: "#ffffff",
  borderRadius: "8px",
  padding: "1.25rem",
  marginBottom: "1.5rem",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
};

const sectionTitleStyle = {
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#1f2937",
  marginBottom: "1rem",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "0.5rem",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
};

export default ViewEntry;
