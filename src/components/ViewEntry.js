import { useState, useCallback, useMemo, memo } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";

function ViewEntry({ isOpen, onClose, entry, isAdmin }) {
  const [copied, setCopied] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const handleCopy = useCallback(() => {
    if (!isAdmin) {
      toast.error("You do not have permission to copy data.");
      return;
    }

    if (!entry) {
      toast.error("No entry data available to copy.");
      return;
    }

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
        entry.createdAt
          ? new Date(entry.createdAt).toLocaleDateString("en-GB")
          : "N/A"
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
        entry.updatedAt
          ? new Date(entry.updatedAt).toLocaleDateString("en-GB")
          : "N/A"
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

  const toggleHistory = useCallback(() => {
    setHistoryVisible((prev) => !prev);
  }, []);

  const sortedHistory = useMemo(() => {
    if (!entry || !Array.isArray(entry.history)) return [];
    return [...entry.history].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [entry]);

  if (!isOpen || !entry) {
    return null;
  }

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
        backdropFilter: "blur(5px)",
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
          <span
            role="img"
            aria-label="Client profile icon"
            style={{ fontSize: "1.5rem" }}
          >
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
          scrollbarWidth: "thin",
          scrollbarColor: "#2575fc #e6f0fa",
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
                    borderLeft: "3px solid #6a11cb",
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
                  role="region"
                  aria-label={`Product ${index + 1}`}
                >
                  <strong style={{ color: "#1f2937", fontSize: "1rem" }}>
                    Product {index + 1}:
                  </strong>{" "}
                  <span style={{ color: "#4b5563", fontSize: "0.95rem" }}>
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
            <DataItem
              label="Status"
              value={
                <Badge
                  style={{
                    background:
                      entry.status === "Interested"
                        ? "linear-gradient(135deg, #10b981, #059669)" // green
                        : entry.status === "Not Interested"
                        ? "linear-gradient(135deg, #ef4444, #dc2626)" // red
                        : entry.status === "Maybe"
                        ? "linear-gradient(135deg, #f59e0b, #d97706)" // yellow
                        : entry.status === "Closed"
                        ? "linear-gradient(135deg, #6366f1, #4f46e5)" // violet-blue
                        : entry.status === "Service"
                        ? "linear-gradient(135deg, #0ea5e9, #0284c7)" // blue
                        : entry.status === "Not Found"
                        ? "linear-gradient(135deg, #f43f5e, #be123c)" // pink-red
                        : "linear-gradient(135deg, #6b7280, #4b5563)", // gray (default and "Not")
                    color: "#fff",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    fontWeight: 500,
                  }}
                >
                  {entry.status && entry.status !== "Not"
                    ? entry.status
                    : "Not Connected"}
                </Badge>
              }
            />
            {entry.closetype && (
              <DataItem label="Close Type" value={entry.closetype} />
            )}
            {entry.closeamount && (
              <DataItem
                label="Closure Amount"
                value={new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(entry.closeamount)}
              />
            )}
            <DataItem label="Remarks" value={entry.remarks} />
            <DataItem
              label="Created"
              value={
                entry.createdAt
                  ? new Date(entry.createdAt).toLocaleDateString("en-GB")
                  : "N/A"
              }
            />
            <DataItem
              label="Updated"
              value={
                entry.updatedAt
                  ? new Date(entry.updatedAt).toLocaleDateString("en-GB")
                  : "N/A"
              }
            />
            <DataItem label="Created By" value={entry.createdBy?.username} />
          </Grid>
        </Section>

        {/* History Section */}
        {sortedHistory.length > 0 && (
          <Section title="History Log">
            <div
              style={{
                marginBottom: "1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onClick={toggleHistory}
              onKeyDown={(e) => {
                if (e.key === "Enter") toggleHistory();
              }}
              role="button"
              tabIndex={0}
              aria-expanded={historyVisible}
              aria-controls="history-log"
              aria-label={
                historyVisible ? "Hide history log" : "Show history log"
              }
            >
              <span
                style={{
                  fontSize: "1rem",
                  transform: historyVisible ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                ▶
              </span>
              <span style={{ fontWeight: 600, color: "#1f2937" }}>
                {historyVisible ? "Hide History" : "Show History"}
              </span>
            </div>
            {historyVisible && (
              <div
                id="history-log"
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  padding: "1rem",
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
                }}
                role="log"
                aria-live="polite"
              >
                {sortedHistory.map((historyItem, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "0.75rem",
                      background: "#ffffff",
                      borderRadius: "6px",
                      marginBottom: "0.5rem",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                      borderLeft: "3px solid #2575fc",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        color: "#1f2937",
                      }}
                    >
                      <strong>Timestamp:</strong>{" "}
                      {new Date(historyItem.timestamp).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        color: "#4b5563",
                      }}
                    >
                      <strong>Status:</strong>{" "}
                      {historyItem.status && historyItem.status !== "Not" ? (
                        <Badge
                          style={{
                            background:
                              historyItem.status === "Interested"
                                ? "linear-gradient(135deg, #10b981, #059669)" // green
                                : historyItem.status === "Not Interested"
                                ? "linear-gradient(135deg, #ef4444, #dc2626)" // red
                                : historyItem.status === "Maybe"
                                ? "linear-gradient(135deg, #f59e0b, #d97706)" // yellow
                                : historyItem.status === "Closed"
                                ? "linear-gradient(135deg, #6366f1, #4f46e5)" // violet-blue
                                : historyItem.status === "Service"
                                ? "linear-gradient(135deg, #0ea5e9, #0284c7)" // blue
                                : historyItem.status === "Not Found"
                                ? "linear-gradient(135deg, #f43f5e, #be123c)" // pink-red
                                : "linear-gradient(135deg, #9ca3af, #6b7280)", // fallback gray
                            color: "#fff",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "4px",
                          }}
                        >
                          {historyItem.status}
                        </Badge>
                      ) : (
                        <Badge
                          style={{
                            background:
                              "linear-gradient(135deg, #6b7280, #4b5563)", // gray
                            color: "#fff",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "4px",
                          }}
                        >
                          Not Connected
                        </Badge>
                      )}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        color: "#4b5563",
                      }}
                    >
                      <strong>Remarks:</strong> {historyItem.remarks || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        <Button
          variant="primary"
          onClick={handleCopy}
          disabled={!isAdmin}
          style={{
            background: isAdmin
              ? "linear-gradient(135deg, #2575fc, #6a11cb)"
              : "linear-gradient(135deg, #d1d5db, #e5e7eb)",
            border: "none",
            borderRadius: "10px",
            padding: "0.85rem 2rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "1.1rem",
            width: "100%",
            transition:
              "transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease",
            boxShadow: isAdmin ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
          onMouseEnter={(e) => {
            if (isAdmin) {
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (isAdmin) {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }
          }}
          onFocus={(e) => {
            if (isAdmin) {
              e.target.style.outline = "2px solid #2575fc";
              e.target.style.outlineOffset = "2px";
            }
          }}
          onBlur={(e) => {
            e.target.style.outline = "none";
          }}
          aria-label={copied ? "Copied to clipboard" : "Copy client details"}
          tabIndex={0}
        >
          {copied ? (
            <>
              <span role="img" aria-label="Checkmark">
                ✅
              </span>{" "}
              Copied!
            </>
          ) : (
            <>
              <span role="img" aria-label="Clipboard">
                📋
              </span>{" "}
              Copy Details
            </>
          )}
        </Button>
      </Modal.Body>
    </Modal>
  );
}

// Helper Components
const Section = memo(({ title, children }) => (
  <section
    style={{
      background: "#ffffff",
      borderRadius: "10px",
      padding: "1.5rem",
      marginBottom: "1.5rem",
      boxShadow: "0 3px 8px rgba(0, 0, 0, 0.08)",
      borderLeft: "4px solid #2575fc",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.08)";
    }}
    role="region"
    aria-label={title}
  >
    <h3
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "1.3rem",
        fontWeight: 700,
        color: "#1f2937",
        marginBottom: "1rem",
        borderBottom: "2px solid #2575fc",
        paddingBottom: "0.5rem",
        background: "linear-gradient(135deg, #2575fc10, #6a11cb10)",
        padding: "0.5rem 1rem",
        borderRadius: "6px",
      }}
    >
      {title}
    </h3>
    {children}
  </section>
));

const DataItem = memo(({ label, value }) => (
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

const Grid = memo(({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1.25rem",
      padding: "0.5rem 0",
    }}
  >
    {children}
  </div>
));

// CSS for Modal Animation and Scrollbar
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #e6f0fa;
    borderRadius: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background: #2575fc;
    borderRadius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #6a11cb;
  }
`;

// Inject styles
if (!document.getElementById("view-entry-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "view-entry-styles";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default ViewEntry;
