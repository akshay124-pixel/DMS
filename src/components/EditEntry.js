import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Modal, Form, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { FaEdit, FaSyncAlt, FaCog } from "react-icons/fa";

// Styled Components
const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    max-width: 600px;
    margin: auto;
  }
  .modal-header,
  .modal-footer {
    background: linear-gradient(135deg, #2575fc, #6a11cb);
    color: white;
    border: none;
  }
  .modal-body {
    padding: 2rem;
    background: #f9f9f9;
    max-height: 70vh;
    overflow-y: auto;
  }
`;

const StyledButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  background: ${(props) =>
    props.variant === "primary"
      ? "linear-gradient(135deg, #2575fc, #6a11cb)"
      : props.variant === "info"
      ? "linear-gradient(135deg, #2575fc, #6a11cb)"
      : props.variant === "danger"
      ? "#dc3545"
      : props.variant === "success"
      ? "#28a745"
      : "linear-gradient(135deg, rgb(252, 152, 11), rgb(244, 193, 10))"};

  &:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }
`;

const FormSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
`;

function EditEntry({ isOpen, onClose, onEntryUpdated, entryToEdit }) {
  // Initial Data
  const initialFormData = useMemo(
    () => ({
      customerName: "",
      mobileNumber: "",
      address: "",
      products: "",
      type: "",
      state: "",
      city: "",
      organization: "",
      category: "",
    }),
    []
  );

  const initialUpdateData = useMemo(
    () => ({
      status: "",
      expectedClosingDate: "",
      followUpDate: "",
      remarks: "",
    }),
    []
  );

  // State Management
  const [formData, setFormData] = useState(initialFormData);
  const [updateData, setUpdateData] = useState(initialUpdateData);
  const [view, setView] = useState("options");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form Setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: initialFormData,
  });

  const selectedState = watch("state");

  // Effect for Initial Data Load
  useEffect(() => {
    if (isOpen && entryToEdit) {
      const newFormData = {
        customerName: entryToEdit.customerName || "",
        mobileNumber: entryToEdit.mobileNumber || "",
        products: entryToEdit.products || "",
        type: entryToEdit.type || "",
        address: entryToEdit.address || "",
        state: entryToEdit.state || "",
        city: entryToEdit.city || "",
        organization: entryToEdit.organization || "",
        category: entryToEdit.category || "",
      };
      const newUpdateData = {
        status: entryToEdit.status || "",
        expectedClosingDate: entryToEdit.expectedClosingDate
          ? new Date(entryToEdit.expectedClosingDate)
              .toISOString()
              .split("T")[0]
          : "",
        followUpDate: entryToEdit.followUpDate
          ? new Date(entryToEdit.followUpDate).toISOString().split("T")[0]
          : "",
        remarks: entryToEdit.remarks || "",
      };
      setFormData(newFormData);
      setUpdateData(newUpdateData);
      reset(newFormData);
      setView("options");
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen, entryToEdit, reset]);

  // Handlers
  const debouncedHandleInputChange = useCallback(
    debounce((name, value) => {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "mobileNumber"
            ? value.replace(/\D/g, "").slice(0, 10)
            : value,
      }));
    }, 300),
    []
  );

  const handleUpdateInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const onEditSubmit = async (data) => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to update an entry.");
      }

      const response = await axios.put(
        `http://localhost:4000/api/editentry/${entryToEdit._id}`,
        { ...data, ...updateData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedEntry = response.data.data;
      toast.success("Entry updated successfully!");
      onEntryUpdated(updatedEntry);
      setFormData({
        customerName: updatedEntry.customerName || "",
        mobileNumber: updatedEntry.mobileNumber || "",
        products: updatedEntry.products || "",
        type: updatedEntry.type || "",
        address: updatedEntry.address || "",
        state: updatedEntry.state || "",
        city: updatedEntry.city || "",
        organization: updatedEntry.organization || "",
        category: updatedEntry.category || "",
      });
      setUpdateData({
        status: updatedEntry.status || "",
        expectedClosingDate: updatedEntry.expectedClosingDate
          ? new Date(updatedEntry.expectedClosingDate)
              .toISOString()
              .split("T")[0]
          : "",
        followUpDate: updatedEntry.followUpDate
          ? new Date(updatedEntry.followUpDate).toISOString().split("T")[0]
          : "",
        remarks: updatedEntry.remarks || "",
      });
      setView("options");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update entry.");
      toast.error(err.response?.data?.message || "Failed to update entry!");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const onUpdateSubmit = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to update an entry.");
      }

      const response = await axios.put(
        `http://localhost:4000/api/editentry/${entryToEdit._id}`,
        { ...formData, ...updateData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedEntry = response.data.data;
      toast.success("Follow-up updated successfully!");
      onEntryUpdated(updatedEntry);
      setUpdateData({
        status: updatedEntry.status || "",
        expectedClosingDate: updatedEntry.expectedClosingDate
          ? new Date(updatedEntry.expectedClosingDate)
              .toISOString()
              .split("T")[0]
          : "",
        followUpDate: updatedEntry.followUpDate
          ? new Date(updatedEntry.followUpDate).toISOString().split("T")[0]
          : "",
        remarks: updatedEntry.remarks || "",
      });
      setView("options");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update follow-up.");
      toast.error(err.response?.data?.message || "Failed to update follow-up!");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // Mock Data
  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ];

  const citiesByState = useMemo(
    () => ({
      "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
      "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat"],
      Assam: ["Guwahati", "Dibrugarh", "Jorhat", "Silchar"],
      Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
      Chhattisgarh: ["Raipur", "Bilaspur", "Durg", "Korba"],
      Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
      Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
      Haryana: ["Gurgaon", "Faridabad", "Panipat", "Ambala"],
      "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Mandi"],
      Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
      Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
      Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kannur"],
      "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
      Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
      Manipur: ["Imphal", "Churachandpur", "Thoubal", "Bishnupur"],
      Meghalaya: ["Shillong", "Tura", "Nongpoh", "Cherrapunjee"],
      Mizoram: ["Aizawl", "Lunglei", "Champhai", "Serchhip"],
      Nagaland: ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
      Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
      Punjab: ["Amritsar", "Ludhiana", "Patiala", "Jalandhar"],
      Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota"],
      Sikkim: ["Gangtok", "Namchi", "Pelling", "Geyzing"],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
      Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
      Tripura: ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar"],
      "Uttar Pradesh": [
        "Lucknow",
        "Kanpur",
        "Varanasi",
        "Agra",
        "Allahabad",
        "Ghaziabad",
        "Noida",
        "Meerut",
        "Aligarh",
        "Bareilly",
        "Badaun",
      ],
      Uttarakhand: ["Dehradun", "Haridwar", "Nainital", "Rishikesh"],
      "West Bengal": ["Kolkata", "Darjeeling", "Siliguri", "Howrah"],
      "Andaman and Nicobar Islands": [
        "Port Blair",
        "Havelock Island",
        "Diglipur",
      ],
      Chandigarh: ["Chandigarh"],
      "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
      Delhi: ["New Delhi"],
      "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
      Ladakh: ["Leh", "Kargil"],
      Lakshadweep: ["Kavaratti", "Agatti", "Minicoy"],
      Puducherry: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
    }),
    []
  );

  // Render Views
  const renderOptions = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        padding: "1rem",
      }}
    >
      <StyledButton variant="primary" onClick={() => setView("edit")}>
        Edit Full Details
      </StyledButton>
      <StyledButton variant="info" onClick={() => setView("update")}>
        Update Follow-up
      </StyledButton>
    </div>
  );

  const renderEditForm = () => (
    <Form onSubmit={handleSubmit(onEditSubmit)}>
      <FormSection>
        <Form.Group controlId="customerName">
          <Form.Label>👤 Customer Name</Form.Label>
          <Form.Control
            {...register("customerName", {
              required: "Customer name is required",
              maxLength: { value: 100, message: "Max 100 characters" },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("customerName", e.target.value)
            }
            isInvalid={!!errors.customerName}
            aria-label="Customer Name"
          />
          <Form.Control.Feedback type="invalid">
            {errors.customerName?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="mobileNumber">
          <Form.Label>📱 Mobile Number</Form.Label>
          <Form.Control
            {...register("mobileNumber", {
              required: "Mobile number is required",
              pattern: { value: /^\d{10}$/, message: "Must be 10 digits" },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("mobileNumber", e.target.value)
            }
            isInvalid={!!errors.mobileNumber}
            aria-label="Mobile Number"
          />
          <Form.Control.Feedback type="invalid">
            {errors.mobileNumber?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="products">
          <Form.Label>📦 Product Description</Form.Label>
          <Form.Control
            {...register("products", {
              required: "Product description is required",
              maxLength: { value: 200, message: "Max 200 characters" },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("products", e.target.value)
            }
            isInvalid={!!errors.products}
            aria-label="Product Description"
          />
          <Form.Control.Feedback type="invalid">
            {errors.products?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="type">
          <Form.Label>👥 Customer Type</Form.Label>
          <Form.Select
            {...register("type", {
              required: "Customer type is required",
            })}
            onChange={(e) => debouncedHandleInputChange("type", e.target.value)}
            isInvalid={!!errors.type}
            aria-label="Customer Type"
          >
            <option value="">-- Select Type --</option>
            <option value="Customer">Customer</option>
            <option value="Partner">Partner</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.type?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="address">
          <Form.Label>🏠 Address</Form.Label>
          <Form.Control
            as="textarea"
            {...register("address", {
              required: "Address is required",
              minLength: { value: 5, message: "Min 5 characters" },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("address", e.target.value)
            }
            isInvalid={!!errors.address}
            rows={2}
            aria-label="Address"
          />
          <Form.Control.Feedback type="invalid">
            {errors.address?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="state">
          <Form.Label>🗺️ State</Form.Label>
          <Controller
            name="state"
            control={control}
            rules={{ required: "State is required" }}
            render={({ field }) => (
              <Form.Control
                as="select"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("state", e.target.value);
                }}
                isInvalid={!!errors.state}
                aria-label="State"
              >
                <option value="">-- Select State --</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Form.Control>
            )}
          />
          <Form.Control.Feedback type="invalid">
            {errors.state?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="city">
          <Form.Label>🌆 City</Form.Label>
          <Controller
            name="city"
            control={control}
            rules={{ required: "City is required" }}
            render={({ field }) => (
              <Form.Control
                as="select"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("city", e.target.value);
                }}
                isInvalid={!!errors.city}
                disabled={!selectedState}
                aria-label="City"
              >
                <option value="">-- Select City --</option>
                {selectedState &&
                  citiesByState[selectedState]?.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </Form.Control>
            )}
          />
          <Form.Control.Feedback type="invalid">
            {errors.city?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="organization">
          <Form.Label>🏢 Organization</Form.Label>
          <Form.Control
            {...register("organization", {
              required: "Organization is required",
              maxLength: { value: 100, message: "Max 100 characters" },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("organization", e.target.value)
            }
            isInvalid={!!errors.organization}
            aria-label="Organization"
          />
          <Form.Control.Feedback type="invalid">
            {errors.organization?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="category">
          <Form.Label>📁 Category</Form.Label>
          <Form.Control
            as="select"
            {...register("category", { required: "Category is required" })}
            onChange={(e) =>
              debouncedHandleInputChange("category", e.target.value)
            }
            isInvalid={!!errors.category}
            aria-label="Category"
          >
            <option value="">-- Select Category --</option>
            <option value="Private">Private</option>
            <option value="Government">Government</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">
            {errors.category?.message}
          </Form.Control.Feedback>
        </Form.Group>
      </FormSection>
    </Form>
  );

  const renderUpdateForm = () => (
    <Form onSubmit={handleSubmit(onUpdateSubmit)}>
      <FormSection>
        <Form.Group controlId="status">
          <Form.Label>📊 Status</Form.Label>
          <Form.Control
            as="select"
            value={updateData.status}
            onChange={handleUpdateInputChange}
            name="status"
            aria-label="Status"
          >
            <option value="">-- Select Status --</option>
            <option value="Maybe">Maybe</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="expectedClosingDate">
          <Form.Label>📅 Expected Closing Date</Form.Label>
          <Form.Control
            type="date"
            value={updateData.expectedClosingDate}
            onChange={handleUpdateInputChange}
            name="expectedClosingDate"
            required
            min={new Date().toISOString().split("T")[0]}
            aria-label="Expected Closing Date"
          />
          {updateData.expectedClosingDate && (
            <Form.Text>
              {new Date(updateData.expectedClosingDate).toDateString()}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group controlId="followUpDate">
          <Form.Label>📅 Follow-up Date</Form.Label>
          <Form.Control
            type="date"
            value={updateData.followUpDate}
            onChange={handleUpdateInputChange}
            name="followUpDate"
            required
            min={new Date().toISOString().split("T")[0]}
            aria-label="Follow-up Date"
          />
          {updateData.followUpDate && (
            <Form.Text>
              {new Date(updateData.followUpDate).toDateString()}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group controlId="remarks">
          <Form.Label>✏️ Remarks</Form.Label>
          <Form.Control
            as="textarea"
            value={updateData.remarks}
            onChange={handleUpdateInputChange}
            name="remarks"
            rows={3}
            maxLength={500}
            aria-label="Remarks"
          />
          <Form.Text>{updateData.remarks.length}/500</Form.Text>
        </Form.Group>
      </FormSection>
    </Form>
  );

  return (
    <StyledModal
      show={isOpen}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title className="text-center w-100 d-flex align-items-center justify-content-center">
          {view === "options" ? (
            <>
              <FaCog className="me-2" />
              <span style={{ fontWeight: "bold" }}>Entry Management</span>
            </>
          ) : view === "edit" ? (
            <>
              <FaEdit className="me-2" />
              <span style={{ fontWeight: "bold" }}>Edit Entry</span>
            </>
          ) : (
            <>
              <FaSyncAlt className="me-2" />
              <span style={{ fontWeight: "bold" }}>Update Follow-up</span>
            </>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {view === "options" && renderOptions()}
        {view === "edit" && renderEditForm()}
        {view === "update" && renderUpdateForm()}
      </Modal.Body>

      <Modal.Footer>
        <StyledButton
          variant="danger"
          onClick={onClose}
          disabled={loading}
          aria-label="Close Modal"
        >
          Close
        </StyledButton>
        {(view === "edit" || view === "update") &&
          (showConfirm ? (
            <>
              <StyledButton
                variant="warning"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                aria-label="Cancel Confirmation"
              >
                Cancel
              </StyledButton>
              <StyledButton
                variant="success"
                onClick={
                  view === "edit" ? handleSubmit(onEditSubmit) : onUpdateSubmit
                }
                disabled={loading}
                aria-label="Confirm Action"
              >
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Confirm"
                )}
              </StyledButton>
            </>
          ) : (
            <StyledButton
              variant="primary"
              onClick={
                view === "edit" ? handleSubmit(onEditSubmit) : onUpdateSubmit
              }
              disabled={
                loading || (view === "edit" && Object.keys(errors).length > 0)
              }
              aria-label={view === "edit" ? "Save Changes" : "Update Follow-up"}
            >
              {loading ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : view === "edit" ? (
                "Save Changes"
              ) : (
                "Update Follow-up"
              )}
            </StyledButton>
          ))}
      </Modal.Footer>
    </StyledModal>
  );
}

export default EditEntry;
