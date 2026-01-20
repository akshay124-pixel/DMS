import { useState, useCallback, useEffect, useMemo } from "react";
import { Modal, Form, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { FaEdit, FaSyncAlt, FaCog } from "react-icons/fa";
import api, { getAuthData } from "../api/api";

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

const formControlStyle = {
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};

function EditEntry({ isOpen, onClose, onEntryUpdated, entryToEdit }) {
  // Initial Data
  const initialFormData = useMemo(
    () => ({
      customerName: "",
      contactName: "",
      email: "",
      mobileNumber: "",
      AlterNumber: "",
      address: "",
      product: "",
      state: "",
      city: "",
      organization: "",
      category: "",
     
      remarks: "",
    }),
    []
  );

  const initialUpdateData = useMemo(
    () => ({
      status: "",
      closetype: "",
      closeamount: "",
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
        contactName: entryToEdit.contactName || "",
        email: entryToEdit.email || "",
        mobileNumber: entryToEdit.mobileNumber || "",
        AlterNumber: entryToEdit.AlterNumber || "",
        address: entryToEdit.address || "",
        product: entryToEdit.product || "",
        state: entryToEdit.state || "",
        city: entryToEdit.city || "",
        organization: entryToEdit.organization || "",
        category: entryToEdit.category || "",
        
        remarks: entryToEdit.remarks || "",
      };
      const newUpdateData = {
        status: entryToEdit.status || "",
        closeamount: entryToEdit.closeamount || "",
        closetype: entryToEdit.closetype || "",
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

   const handleCopyPaste = useCallback((e) => {
    e.stopPropagation(); // Prevent interference with copy/paste
  }, []);
  const handleUpdateInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({
      ...prev,
      [name]: name === "closeamount" ? (value ? parseFloat(value) : "") : value,
    }));
  }, []);

  const onEditSubmit = async (data) => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    try {
      const { accessToken } = getAuthData();
      if (!accessToken) {
        throw new Error("You must be logged in to update an entry.");
      }

      // Prepare payload
      const payload = {
        ...data,
        status: updateData.status,
        remarks: updateData.remarks,
      };
      if (updateData.status === "Closed") {
        if (!updateData.closetype || !updateData.closeamount) {
          throw new Error(
            "Close type and close amount are required when status is 'Closed'."
          );
        }
        payload.closetype = updateData.closetype;
        payload.closeamount = parseFloat(updateData.closeamount);
      } else {
        payload.closetype = "";
        payload.closeamount = null;
      }

      const response = await api.put(`/api/editentry/${entryToEdit._id}`, payload);
      const updatedEntry = response.data.data;
      toast.success("Entry updated successfully!");
      onEntryUpdated(updatedEntry); // Pass the updated entry to the parent
      setView("options");
      onClose();
    } catch (err) {
      console.error("Edit error:", err.response?.data);

      // Friendly error message for user
      const errorMessage =
        err.response?.data?.message ||
        "Sorry, we couldn't update your entry. Please check your details and try again.";

      // Detailed errors, if any, joined for display
      const detailedErrors = err.response?.data?.errors
        ? err.response.data.errors.join(", ")
        : null;

      setError(errorMessage);
      toast.error(
        detailedErrors ? `${errorMessage} (${detailedErrors})` : errorMessage
      );
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
      const { accessToken } = getAuthData();
      if (!accessToken) {
        throw new Error("You must be logged in to update an entry.");
      }

      const payload = {
        status: updateData.status,
        remarks: updateData.remarks,
      };
      if (updateData.status === "Closed") {
        payload.closetype = updateData.closetype;
        payload.closeamount = updateData.closeamount;
      }

      const response = await api.put(`/api/editentry/${entryToEdit._id}`, payload);
      const updatedEntry = response.data.data;
      toast.success("Follow-up updated successfully!");
      onEntryUpdated(updatedEntry); // Pass the updated entry to the parent
      setView("options");
      onClose();
    } catch (err) {
      console.error("Update error:", err.response?.data);

      const errorMessage =
        err.response?.data?.message ||
        "Sorry, we couldn't update your follow-up. Please try again.";

      const detailedErrors = err.response?.data?.errors
        ? err.response.data.errors.join(", ")
        : null;

      setError(errorMessage);
      toast.error(
        detailedErrors ? `${errorMessage} (${detailedErrors})` : errorMessage
      );
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // Mock Data (States and Districts)
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

  const districtsByState = useMemo(
    () => ({
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
        "Nabha",
        "Mansa",
        "Moga",
        "Muktsar",
        "Banga",
        "Ropar",
        "Rajpura",
        "Samana",
        "Anandpur sahib",
        "Mukerian",
        "Phagwara",
        "Manal",
        "Dasuya",
        "Nangal",
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
    }),
    []
  );

  // Render Views
const renderOptions = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
        gap: "1rem",
        "@media (min-width: 576px)": {
          flexDirection: "row",
          justifyContent: "space-around",
        },
      }}
    >
      <StyledButton
        variant="primary"
        onClick={() => setView("edit")}
        
        style={{ width: "100%", maxWidth: "250px" }}
      >
        Edit Full Details
      </StyledButton>
      <StyledButton
        variant="info"
        onClick={() => setView("update")}
     
        style={{ width: "100%", maxWidth: "250px" }}
      >
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
           placeholder="Enter customer name"
            {...register("customerName", {
              maxLength: {
                value: 100,
                message: "Customer name cannot exceed 100 characters",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("customerName", e.target.value)
            }
            onCopy={handleCopyPaste}
            onPaste={handleCopyPaste}
            isInvalid={!!errors.customerName}
            style={formControlStyle}
            aria-label="Customer Name"
          />
          <Form.Control.Feedback type="invalid">
            {errors.customerName?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="contactName">
          <Form.Label>🧑‍💼 Contact Person Name</Form.Label>
          <Form.Control
            placeholder="Enter contact person name"
            {...register("contactName", {
              maxLength: {
                value: 100,
                message: "Contact name cannot exceed 100 characters",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("contactName", e.target.value)
            }
            onCopy={handleCopyPaste}
            onPaste={handleCopyPaste}
            isInvalid={!!errors.contactName}
            style={formControlStyle}
            aria-label="Contact Name"
          />
          <Form.Control.Feedback type="invalid">
            {errors.contactName?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="email">
          <Form.Label>📧 Email</Form.Label>
          <Form.Control
          placeholder="example@email.com"
            {...register("email", {
             
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                message: "Please enter a valid email address",
              },
              maxLength: {
                value: 100,
                message: "Email cannot exceed 100 characters",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("email", e.target.value)
            }
            onCopy={handleCopyPaste}
            onPaste={handleCopyPaste}
            isInvalid={!!errors.email}
            style={formControlStyle}
            aria-label="Email"
          />
          <Form.Control.Feedback type="invalid">
            {errors.email?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="mobileNumber">
          <Form.Label>📱 Mobile Number</Form.Label>
          <Form.Control
           type="tel"
           inputMode="numeric"
          placeholder="Enter 10-digit mobile number"
           maxLength={10}
            {...register("mobileNumber", {
              maxLength: {
                value: 10,
                message: "Mobile number must be exactly 10 digits",
              },
              pattern: {
                value: /^\d{10}$/,
                message: "Mobile number must be exactly 10 digits",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("mobileNumber", e.target.value)
            }
            onCopy={handleCopyPaste}
            onPaste={handleCopyPaste}
            isInvalid={!!errors.mobileNumber}
            style={formControlStyle}
            aria-label="Mobile Number"
          />
          <Form.Control.Feedback type="invalid">
            {errors.mobileNumber?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="alterNumber">
          <Form.Label>📞 Alternate Number</Form.Label>
          <Form.Control
          type="tel"
          inputMode="numeric"
           placeholder="Enter alternate mobile number"
          maxLength={10}
            {...register("AlterNumber", {
              maxLength: {
                value: 10,
                message: "Alternate number must be exactly 10 digits",
              },
              pattern: {
                value: /^\d{10}$/,
                message: "Alternate number must be exactly 10 digits",
              },
            })}
            onChange={(e) =>
              debouncedHandleInputChange("AlterNumber", e.target.value)
            }
            onCopy={handleCopyPaste}
            onPaste={handleCopyPaste}
            isInvalid={!!errors.AlterNumber}
            style={formControlStyle}
            aria-label="Alternate Number"
          />
          <Form.Control.Feedback type="invalid">
            {errors.AlterNumber?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="product" className="mb-3">
          <Form.Label>📦 Product</Form.Label>
          <Form.Control
            as="select"
            {...register("product")}
            onChange={(e) =>
              debouncedHandleInputChange("product", e.target.value)
            }
            isInvalid={!!errors.product}
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
          <Form.Control.Feedback type="invalid">
            {errors.product?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="address">
          <Form.Label>🏠 Address</Form.Label>
          <Form.Control
            as="textarea"
            {...register("address")}
            onChange={(e) =>
              debouncedHandleInputChange("address", e.target.value)
            }
            onCopy={handleCopyPaste}
            onPaste={handleCopyPaste}
            isInvalid={!!errors.address}
            rows={2}
            style={formControlStyle}
            placeholder="Enter complete address"
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
            render={({ field }) => (
              <Form.Control
                as="select"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  debouncedHandleInputChange("state", e.target.value);
                }}
                isInvalid={!!errors.state}
                style={formControlStyle}
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
          <Form.Label>🌆 District</Form.Label>
          <Controller
            name="city"
            control={control}
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
                style={formControlStyle}
                aria-label="District"
              >
                <option value="">-- Select District --</option>
                {selectedState &&
                  districtsByState[selectedState]?.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
              </Form.Control>
            )}
          />
          <Form.Control.Feedback type="invalid">
            {errors.city?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="organization" className="mb-3">
          <Form.Label>🏢 Organization</Form.Label>
          <Form.Control
            as="select"
            {...register("organization")}
            onChange={(e) =>
              debouncedHandleInputChange("organization", e.target.value)
            }
            isInvalid={!!errors.organization}
            style={formControlStyle}
            aria-label="Organization"
          >
           <option value="" disabled>
                -- Select Organization --
              </option>
            <option value="School">School</option>
            <option value="College">College</option>
            <option value="University">University</option>
            <option value="Construction Agency">Construction Agency</option>
            <option value="Corporate">Corporate</option>
            <option value="Partner">Partner</option>
            <option value="Others">Others</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">
            {errors.organization?.message}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="category">
          <Form.Label>📁 Category</Form.Label>
          <Form.Control
            as="select"
            {...register("category")}
            onChange={(e) =>
              debouncedHandleInputChange("category", e.target.value)
            }
            isInvalid={!!errors.category}
            style={formControlStyle}
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
            style={formControlStyle}
            aria-label="Status"
          >
            <option value="">-- Select Status --</option>
            <option value="Maybe">Maybe</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Not">Not Connected</option>
            <option value="Service">Service Call</option>
            <option value="Closed">Closed</option>
          </Form.Control>
        </Form.Group>
        {updateData.status === "Closed" && (
          <>
            <Form.Group controlId="closetype">
              <Form.Label>🏁 Close Type</Form.Label>
              <Form.Control
                as="select"
                name="closetype"
                value={updateData.closetype || ""}
                onChange={handleUpdateInputChange}
                style={formControlStyle}
                aria-label="Close Type"
              >
                <option value="">-- Select Close Type --</option>
                <option value="Closed Won">Won</option>
                <option value="Closed Lost">Lost</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="closeamount">
              <Form.Label>💰 Close Amount</Form.Label>
              <Form.Control
                type="number"
                name="closeamount"
                value={updateData.closeamount || ""}
                onChange={handleUpdateInputChange}
                onCopy={handleCopyPaste}
                onPaste={handleCopyPaste}
                min="0"
                step="0.01"
                placeholder="Enter final deal amount"
                style={formControlStyle}
                aria-label="Close Amount"
              />
            </Form.Group>
          </>
        )}
        <Form.Group controlId="remarks">
          <Form.Label>✏️ Remarks</Form.Label>
          <Form.Control
            as="textarea"
            value={updateData.remarks}
            onChange={handleUpdateInputChange}
            onCopy={handleCopyPaste}
            onPaste={handleCopyPaste}
            name="remarks"
            rows={3}
            maxLength={500}
            style={formControlStyle}
             placeholder="Enter remarks or follow-up notes (max 500 characters)"
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