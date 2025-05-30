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
      centered
      style={{
        animation: isOpen ? "fadeIn 0.3s ease-out" : "fadeOut 0.3s ease-in",
      }}
    >
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #2575fc, #6a11cb)",
          color: "#fff",
          padding: "1.5rem",
          borderBottom: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Modal.Title
          id="view-entry-modal-title"
          style={{
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 700,
            fontSize: "1.75rem",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span role="img" aria-label="profile" style={{ fontSize: "1.5rem" }}>
            👤
          </span>
          Client Profile
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{
          padding: "2rem",
          background: "#f9fafb",
          maxHeight: "75vh",
          overflowY: "auto",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Personal Info Section */}
        <Section title="Personal Information">
          <Grid>
            <DataItem label="Customer Name" value={entry.customerName} />
            <DataItem label="Contact Person" value={entry.contactName} />
            <DataItem label="Mobile Number" value={entry.mobileNumber} />
            <DataItem label="Alternate Number" value={entry.AlterNumber} />
            <DataItem label="Email" value={entry.email} />
          </Grid>
        </Section>

        {/* Location Section */}
        <Section title="Location Details">
          <Grid>
            <DataItem label="Address" value={entry.address} />
            <DataItem label="City" value={entry.city} />
            <DataItem label="State" value={entry.state} />
          </Grid>
        </Section>

        {/* Business Info Section */}
        <Section title="Business Information">
          <Grid>
            <DataItem label="Organization" value={entry.organization} />
            <DataItem label="Category" value={entry.category} />
            <DataItem label="Product" value={entry.product} />
          </Grid>
        </Section>

        {/* Products Section */}
        {Array.isArray(entry.products) && entry.products.length > 0 && (
          <Section title="Products">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {entry.products.map((product, index) => (
                <div
                  key={index}
                  style={{
                    padding: "1rem",
                    background: "#ffffff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 6px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  <strong style={{ color: "#1f2937" }}>
                    Product {index + 1}:
                  </strong>{" "}
                  <span style={{ color: "#4b5563" }}>
                    {product.name || "N/A"} | Specification:{" "}
                    {product.specification || "N/A"} | Size:{" "}
                    {product.size || "N/A"} | Quantity:{" "}
                    {product.quantity || "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Follow-up Section */}
        <Section title="Follow-up Details">
          <Grid>
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
          </Grid>
        </Section>

        <Button
          variant="primary"
          onClick={handleCopy}
          disabled={!isAdmin}
          style={{
            background: isAdmin
              ? "linear-gradient(135deg, #2575fc, #6a11cb)"
              : "#e5e7eb",
            border: "none",
            borderRadius: "10px",
            padding: "0.75rem 2rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            width: "100%",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: isAdmin ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
          onMouseEnter={(e) =>
            isAdmin && (e.target.style.transform = "translateY(-3px)")
          }
          onMouseLeave={(e) =>
            isAdmin && (e.target.style.transform = "translateY(0)")
          }
          aria-label={copied ? "Copied to clipboard" : "Copy client details"}
        >
          {copied ? (
            <>
              <span>✅ Copied!</span>
            </>
          ) : (
            <>
              <span>📋</span> Copy Details
            </>
          )}
        </Button>
      </Modal.Body>
    </Modal>
  );
}

// Helper Components
const Section = React.memo(({ title, children }) => (
  <section
    style={{
      background: "#ffffff",
      borderRadius: "10px",
      padding: "1.5rem",
      marginBottom: "1.5rem",
      boxShadow: "0 3px 8px rgba(0, 0, 0, 0.08)",
      borderLeft: "4px solid #2575fc",
      transition: "transform 0.2s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
  >
    <h3
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "1.25rem",
        fontWeight: 700,
        color: "#1f2937",
        marginBottom: "1rem",
        borderBottom: "2px solid #e5e7eb",
        paddingBottom: "0.5rem",
      }}
    >
      {title}
    </h3>
    {children}
  </section>
));

const DataItem = React.memo(({ label, value }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.3rem",
      padding: "0.5rem",
    }}
    role="region"
    aria-label={`${label}: ${value || "N/A"}`}
  >
    <strong
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.95rem",
        fontWeight: 600,
        color: "#374151",
      }}
    >
      {label}:
    </strong>
    <span
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.95rem",
        color: "#4b5563",
        lineHeight: "1.5",
      }}
    >
      {value || "N/A"}
    </span>
  </div>
));

const Grid = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "1.25rem",
      padding: "0.5rem 0",
    }}
  >
    {children}
  </div>
);

// CSS for Modal Animation
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default ViewEntry;
