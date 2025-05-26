import { Button, Modal, Form } from "react-bootstrap";
import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { statesAndDistricts } from "./statesAndDistricts";

// Common styles for form controls
const formControlStyle = {
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};

// Common styles for buttons
const buttonStyle = {
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
};

function AddEntry({ isOpen, onClose, onEntryAdded }) {
  const initialFormData = {
    customerName: "",
    email: "",
    mobileNumber: "",
    product: "",
    address: "",
    state: "",
    city: "", // Named 'city' to match Mongoose schema
    organization: "",
    category: "",
    customOrganization: "", // New field for custom organization input
  };

  const [formData, setFormData] = useState(initialFormData);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCustomOrganization, setIsCustomOrganization] = useState(false); // Track if "Others" is selected

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setSelectedState("");
      setSelectedDistrict("");
      setIsCustomOrganization(false);
    }
  }, [isOpen]);

  // Handle input changes for form fields
  const handleInput = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "mobileNumber"
          ? value.replace(/\D/g, "").slice(0, 10)
          : name === "email"
          ? value.toLowerCase()
          : value,
    }));

    // Check if "Others" is selected for organization
    if (name === "organization") {
      setIsCustomOrganization(value === "Others");
      if (value !== "Others") {
        setFormData((prev) => ({ ...prev, customOrganization: "" }));
      }
    }
  }, []);

  // Handle state selection
  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedDistrict("");
    setFormData((prev) => ({
      ...prev,
      state,
      city: "", // Named 'city' to match Mongoose schema
    }));
  };

  // Handle district selection
  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setFormData((prev) => ({
      ...prev,
      city: district, // Named 'city' to match Mongoose schema
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = [
      "customerName",
      "email",
      "mobileNumber",
      "product",
      "address",

      "organization",
      ...(isCustomOrganization ? ["customOrganization"] : []),
    ];
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        toast.error(
          `${
            field === "customOrganization"
              ? "Custom Organization"
              : field.charAt(0).toUpperCase() + field.slice(1)
          } is required!`
        );
        return;
      }
    }

    // Validate mobile number
    if (formData.mobileNumber.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits!");
      return;
    }

    // Validate product
    const validProducts = ["Ed-Tech", "Furniture", "AV"];
    if (!validProducts.includes(formData.product)) {
      toast.error("Please select a valid product!");
      return;
    }

    // Validate custom organization length
    if (isCustomOrganization && formData.customOrganization.length > 100) {
      toast.error("Custom organization cannot exceed 100 characters!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to add an entry.");
        return;
      }

      const submitData = {
        customerName: formData.customerName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        product: formData.product,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        organization: isCustomOrganization
          ? formData.customOrganization
          : formData.organization,
        category: formData.category,
      };

      const response = await axios.post(
        "https://dms-server-eneu.onrender.com/api/entry",
        submitData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newEntry = response.data.data;
      toast.success("Entry added successfully!");
      onEntryAdded(newEntry);

      setFormData(initialFormData);
      setSelectedState("");
      setSelectedDistrict("");
      setIsCustomOrganization(false);
      onClose();
    } catch (error) {
      console.error(
        "Error adding entry:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={false}
      size="mt"
    >
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(to right, #6a11cb, #2575fc)",
          color: "#fff",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Modal.Title style={{ fontWeight: "bold", fontSize: "1.5rem" }}>
          <span role="img" aria-label="add-entry">
            ✨
          </span>{" "}
          Add New Entry
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: "2rem" }}>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formCustomerName" className="mb-3">
            <Form.Label>👤 Customer Name</Form.Label>
            <Form.Control
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInput}
              required
              placeholder="Enter customer name"
              disabled={loading}
              style={formControlStyle}
              maxLength={100}
              aria-label="Customer Name"
            />
            {formData.customerName && formData.customerName.length > 100 && (
              <Form.Text style={{ color: "red" }}>
                Customer name cannot exceed 100 characters
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group controlId="formCustomeremail" className="mb-3">
            <Form.Label>📧 Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInput}
              required
              placeholder="Enter customer email"
              disabled={loading}
              style={formControlStyle}
              maxLength={100}
              aria-label="Email"
            />
            <Form.Text style={{ color: "red" }}>
              Please enter a valid email address
            </Form.Text>
          </Form.Group>

          <Form.Group controlId="mobileNumber" className="mb-3">
            <Form.Label>📱 Mobile Number</Form.Label>
            <Form.Control
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInput}
              required
              placeholder="Enter mobile number"
              maxLength={10}
              disabled={loading}
              style={formControlStyle}
              aria-label="Mobile Number"
            />
            {formData.mobileNumber && formData.mobileNumber.length !== 10 && (
              <Form.Text style={{ color: "red" }}>
                Mobile number must be exactly 10 digits
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group controlId="formProduct" className="mb-3">
            <Form.Label>📦 Product</Form.Label>
            <Form.Control
              as="select"
              name="product"
              value={formData.product}
              onChange={handleInput}
              required
              disabled={loading}
              style={formControlStyle}
              aria-label="Product"
            >
              <option value="" disabled>
                -- Select Product --
              </option>
              <option value="Ed-Tech">Ed-Tech</option>
              <option value="Furniture">Furniture</option>
              <option value="AV">AV</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formAddress" className="mb-3">
            <Form.Label>🏠 Address</Form.Label>
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInput}
              required
              placeholder="Enter address"
              disabled={loading}
              style={formControlStyle}
              maxLength={200}
              aria-label="Address"
            />
            {formData.address && formData.address.length < 5 && (
              <Form.Text style={{ color: "red" }}>
                Address must be at least 5 characters
              </Form.Text>
            )}
            {formData.address && formData.address.length > 200 && (
              <Form.Text style={{ color: "red" }}>
                Address cannot exceed 200 characters
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group controlId="formState" className="mb-3">
            <Form.Label>🗺️ State</Form.Label>
            <Form.Control
              as="select"
              name="state"
              value={selectedState}
              onChange={handleStateChange}
              disabled={loading}
              style={formControlStyle}
              aria-label="State"
            >
              <option value="">-- Select State --</option>
              {Object.keys(statesAndDistricts).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formDistrict" className="mb-3">
            <Form.Label>🌆 District</Form.Label>
            <Form.Control
              as="select"
              name="city" // Named 'city' to match Mongoose schema
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedState || loading}
              style={formControlStyle}
              aria-label="District"
            >
              <option value="">-- Select District --</option>
              {selectedState &&
                statesAndDistricts[selectedState].map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formOrganization" className="mb-3">
            <Form.Label>🏢 Organization</Form.Label>
            <Form.Control
              as="select"
              name="organization"
              value={formData.organization}
              onChange={handleInput}
              required
              disabled={loading}
              style={formControlStyle}
              aria-label="Organization"
            >
              <option value="" disabled>
                -- Select Organization --
              </option>
              <option value="School">School</option>
              <option value="College">College</option>
              <option value="University">University</option>
              <option value="Office">Office</option>
              <option value="Corporates">Corporates</option>
              <option value="Partner">Partner</option>
              <option value="Others">Others</option>
            </Form.Control>
          </Form.Group>
          {isCustomOrganization && (
            <Form.Group controlId="formCustomOrganization" className="mb-3">
              <Form.Label>🏢 Custom Organization</Form.Label>
              <Form.Control
                type="text"
                name="customOrganization"
                value={formData.customOrganization}
                onChange={handleInput}
                required
                placeholder="Enter custom organization"
                disabled={loading}
                style={formControlStyle}
                maxLength={100}
                aria-label="Custom Organization"
              />
              {formData.customOrganization &&
                formData.customOrganization.length > 100 && (
                  <Form.Text style={{ color: "red" }}>
                    Custom organization cannot exceed 100 characters
                  </Form.Text>
                )}
            </Form.Group>
          )}
          <Form.Group controlId="formCategory" className="mb-3">
            <Form.Label>📁 Category</Form.Label>
            <Form.Control
              as="select"
              name="category"
              value={formData.category}
              onChange={handleInput}
              required
              disabled={loading}
              style={formControlStyle}
              aria-label="Category"
            >
              <option value="">-- Select Category --</option>
              <option value="Private">Private</option>
              <option value="Government">Government</option>
            </Form.Control>
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: "#2575fc",
              border: "none",
              ...buttonStyle,
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#1a5ad7")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#2575fc")}
            aria-label="Save Entry"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default AddEntry;
