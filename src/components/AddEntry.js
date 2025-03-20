import { Button, Modal, Form } from "react-bootstrap";
import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function AddEntry({ isOpen, onClose, onEntryAdded }) {
  const initialFormData = {
    customerName: "",
    mobileNumber: "",
    products: "",
    type: "",
    address: "",
    state: "",
    city: "",
    organization: "",
    category: "",
    createdAt: new Date().toISOString(),
  };

  const [formData, setFormData] = useState(initialFormData);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...initialFormData, createdAt: new Date().toISOString() });
      setSelectedState("");
      setSelectedCity("");
    }
  }, [isOpen]);

  const handleInput = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "mobileNumber" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields and mobile number
    const requiredFields = [
      "customerName",
      "mobileNumber",
      "products",
      "type",
      "address",
      "state",
      "city",
      "organization",
      "category",
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required!`
        );
        return;
      }
    }

    if (formData.mobileNumber.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Retrieve token from localStorage
      if (!token) {
        toast.error("You must be logged in to add an entry.");
        return;
      }

      const submitData = {
        ...formData,
        createdAt: new Date().toISOString(),
      };

      const response = await axios.post(
        "http://localhost:4000/api/entry",
        submitData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Add token to headers
          },
        }
      );

      // Use the full entry from the backend response
      const newEntry = response.data.data; // DataentryLogic returns { success, data, message }

      toast.success("Entry added successfully!");
      onEntryAdded(newEntry); // Pass the complete entry from backend

      // Reset form and close modal
      setFormData({ ...initialFormData, createdAt: new Date().toISOString() });
      setSelectedState("");
      setSelectedCity("");
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

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedCity("");
    setFormData((prev) => ({
      ...prev,
      state,
      city: "",
    }));
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setFormData((prev) => ({
      ...prev,
      city,
    }));
  };

  // States and Cities
  const statesAndCities = {
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
    Punjab: ["Amritsar", "Mohali", "Ludhiana", "Patiala", "Jalandhar"],
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
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={false}
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
            <Form.Label>Customer Name</Form.Label>
            <Form.Control
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInput}
              required
              placeholder="Enter customer name"
              disabled={loading}
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
          </Form.Group>

          <Form.Group controlId="mobileNumber" className="mb-3">
            <Form.Label>Mobile Number</Form.Label>
            <Form.Control
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInput}
              required
              placeholder="Enter mobile number"
              maxLength={10}
              disabled={loading}
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
            {formData.mobileNumber && formData.mobileNumber.length < 10 && (
              <Form.Text style={{ color: "red" }}>
                Mobile number must be 10 digits
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group controlId="formProductDescription" className="mb-3">
            <Form.Label>Product Description</Form.Label>
            <Form.Control
              type="text"
              name="products"
              value={formData.products}
              onChange={handleInput}
              required
              placeholder="Enter product description"
              disabled={loading}
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
          </Form.Group>

          <Form.Group controlId="formCustomerType" className="mb-3">
            <Form.Label>Customer Type</Form.Label>
            <Form.Select
              name="type"
              value={formData.type}
              onChange={handleInput}
              required
              disabled={loading}
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <option value="">-- Select Type --</option>
              <option value="Customer">Customer</option>
              <option value="Partner">Partner</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="formAddress" className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInput}
              required
              placeholder="Enter address"
              disabled={loading}
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
          </Form.Group>

          <Form.Group controlId="formState" className="mb-3">
            <Form.Label>State</Form.Label>
            <Form.Control
              as="select"
              name="state"
              value={selectedState}
              onChange={handleStateChange}
              required
              disabled={loading}
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <option value="">-- Select State --</option>
              {Object.keys(statesAndCities).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formCity" className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Control
              as="select"
              name="city"
              value={selectedCity}
              onChange={handleCityChange}
              disabled={!selectedState || loading}
              required
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <option value="">-- Select City --</option>
              {selectedState &&
                statesAndCities[selectedState].map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formOrganization" className="mb-3">
            <Form.Label>Organization</Form.Label>
            <Form.Control
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleInput}
              required
              placeholder="Enter organization"
              disabled={loading}
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
          </Form.Group>

          <Form.Group controlId="formCategory" className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Control
              as="select"
              name="category"
              value={formData.category}
              onChange={handleInput}
              required
              disabled={loading}
              style={{
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
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
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#1a5ad7")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#2575fc")}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default AddEntry;
