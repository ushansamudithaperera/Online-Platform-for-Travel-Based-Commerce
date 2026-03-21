# Multi-Step Form Flow Analysis
## ServiceFormModal → CheckoutPage → PaymentSuccessPage

---

## 1. ENTRY POINT: ProviderDashboard.jsx

### Auto-open Modal with Pre-filled Data (Return from Checkout)
```javascript
// Lines 36-42
const [returnFormData, setReturnFormData] = useState(null);

/* Auto-open create modal with pre-filled data when returning from checkout */
useEffect(() => {
  if (location.state?.returnFormData) {
    setReturnFormData(location.state.returnFormData);
    setShowCreateModal(true);
    window.history.replaceState({}, "");
  }
}, [location.state]);
```

### Modal Trigger
```javascript
// Line 363
<button
  className="add-btn"
  onClick={() => setShowCreateModal(true)}
>
  + Add New Service
</button>
```

### ServiceFormModal Component Rendering
```javascript
<ServiceFormModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onSuccess={handleServiceCreated}
  initialFormData={returnFormData}  // Pre-filled data from checkout return
/>
```

---

## 2. STEP 1: ServiceFormModal.jsx 

### Form Data Structure
```javascript
// Lines 167-178
const [serviceData, setServiceData] = useState({
  title: "",
  description: "",
  district: "",
  location: "",
  category: "",
  priceFrom: "",
  priceTo: "",
  priceUnit: "per person",
  currency: "LKR",
  externalBookingUrl: "",
  whatsappNumber: "",
});

// Line 181
const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

// Line 186
const [selectedOfferings, setSelectedOfferings] = useState([]);

// Lines 184-185
const [photos, setPhotos] = useState([]);
const [uploadProgress, setUploadProgress] = useState({});
```

### Plan Configuration
```javascript
// Lines 88-92
const PLANS = [
  { id: "standard", name: "Standard Listing", price: 5, photoLimit: 5, color: "#7B68EE" },
  { id: "featured", name: "Featured Visibility", price: 15, photoLimit: 10, color: "#6A5ACD" },
  { id: "premium", name: "Premium Spotlight", price: 30, photoLimit: 30, color: "#9370DB", recommended: true },
];
```

### Service Offerings Structure
```javascript
// Lines 70-87
const CATEGORY_OFFERINGS = {
  "hotel": {
    label: "Room Types",
    options: ["Single Room", "Double Room", "Twin Room", "Triple Room", "Suite", "Deluxe Room", "Family Room", "Studio"],
    key: "roomTypes"
  },
  "driver": {
    label: "Vehicle Types",
    options: ["Car", "Van", "SUV", "Minibus", "Bus", "Luxury Car", "Tuk Tuk"],
    key: "vehicleTypes"
  },
  "tour guide": {
    label: "Languages",
    options: ["English", "Sinhala", "Tamil", "French", "German", "Spanish", "Italian", "Chinese", "Japanese", "Korean"],
    key: "languages"
  },
  "experience": {
    label: "Activity Types",
    options: ["Water Sports", "Hiking", "Cycling", "Wildlife Watching", "Cultural Experience", "Adventure Sports", "Wellness & Yoga", "Surfing", "Diving"],
    key: "activityTypes"
  },
  "restaurant": {
    label: "Cuisine Types",
    options: ["Sri Lankan", "Continental", "Chinese", "Indian", "Thai", "Italian", "Seafood", "Mediterranean", "Vegetarian", "Vegan"],
    key: "cuisineTypes"
  }
};

// Helper to build offerings object from selected items
const buildOfferings = (category, selectedItems) => {
  if (!selectedItems || selectedItems.length === 0) return {};
  
  const categoryLower = (category || "").toLowerCase();
  const config = CATEGORY_OFFERINGS[categoryLower];
  
  if (config && config.key) {
    return { [config.key]: selectedItems };
  }
  
  return {};
};
```

### Form Restoration on Return from Checkout
```javascript
// Lines 210-237
if (!isEdit && initialFormData) {
  // Returning from checkout — restore previously typed data
  setServiceData({
    title: initialFormData.serviceData?.title || "",
    description: initialFormData.serviceData?.description || "",
    district: initialFormData.serviceData?.district || "",
    location: initialFormData.serviceData?.location || "",
    category: initialFormData.serviceData?.category || "",
    priceFrom: initialFormData.serviceData?.priceFrom || "",
    priceTo: initialFormData.serviceData?.priceTo || "",
    priceUnit: initialFormData.serviceData?.priceUnit || "per person",
    currency: initialFormData.serviceData?.currency || "LKR",
    externalBookingUrl: initialFormData.serviceData?.externalBookingUrl || "",
    whatsappNumber: initialFormData.serviceData?.whatsappNumber || "",
  });
  if (initialFormData.selectedPlan) {
    const found = PLANS.find((p) => p.id === initialFormData.selectedPlan.id);
    if (found) setSelectedPlan(found);
  }
  if (initialFormData.photos) setPhotos(initialFormData.photos);
  if (initialFormData.selectedOfferings) setSelectedOfferings(initialFormData.selectedOfferings);
  setError("");
}
```

### CREATE MODE: Form Submission & Navigation to Checkout
```javascript
// Lines 470-501 (handleSubmit for CREATE mode)

// ------------- CREATE MODE -------------
if (photos.length === 0) {
  throw new Error("Please upload at least one photo");
}

// Don't create the service yet — go to payment first.
// Pass all form data so checkout can create the service after payment.
const formSnapshot = {
  serviceData: { ...serviceData, whatsappNumber: serviceData.whatsappNumber?.trim() || "" },
  selectedPlan,
  photos,
  selectedOfferings,
  serviceOfferings: buildOfferings(serviceData.category, selectedOfferings),
};

onClose();

navigate("/payment/checkout", {
  state: {
    formSnapshot,
    selectedPlan,
  },
});
```

**Data Passed in location.state:**
- `formSnapshot` (object)
  - `serviceData` - All form fields (title, description, district, etc.)
  - `selectedPlan` - Selected plan object {id, name, price, photoLimit, color}
  - `photos` - Array of File objects from photo upload
  - `selectedOfferings` - Array of selected offering items
  - `serviceOfferings` - Structured object like {roomTypes: [...]} or {languages: [...]}
- `selectedPlan` - Plan details for display

---

## 3. STEP 2: CheckoutPage.jsx - Payment & Service Creation

### Extracting location.state
```javascript
// Lines 15-16
const nav = useNavigate();
const location = useLocation();
const { formSnapshot, selectedPlan } = location.state || {};
```

### Guard Against Missing Data
```javascript
// Lines 28-42
if (!formSnapshot || !selectedPlan) {
  return (
    <>
      <Navbar />
      <div className="pf-container">
        <div className="pf-card pf-error-card">
          <div className="pf-error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>Service details are missing. Please create a new post from the dashboard.</p>
          <Link to="/provider/dashboard" className="pf-btn pf-btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
```

### Using formSnapshot Data
```javascript
// Lines 118-122 (Order Summary)
<div className="pf-summary-item">
  <span className="pf-summary-label">Service</span>
  <span className="pf-summary-value">{formSnapshot.serviceData?.title || "New Service"}</span>
</div>
```

### Service Creation After Payment
```javascript
// Lines 94-117 (handlePayment - after payment processing)
try {
  // Create the service AFTER successful payment
  const formData = new FormData();
  const serviceJson = JSON.stringify({
    ...formSnapshot.serviceData,
    planId: selectedPlan.id,
    planName: selectedPlan.name,
    serviceOfferings: formSnapshot.serviceOfferings,
  });
  formData.append("serviceData", serviceJson);
  formSnapshot.photos.forEach((file) => formData.append("images", file));

  const response = await createService(formData);
  const createdService = response.data;

  nav("/payment/success", {
    state: {
      planName: selectedPlan.name,
      planPrice: selectedPlan.price,
      postTitle: createdService.title || formSnapshot.serviceData.title || "Your Service",
      postId: createdService.id,
      isNewPost: true,
    },
  });
}
```

**Navigation to Success Page with:**
- `planName` - Plan name from selectedPlan
- `planPrice` - Plan price from selectedPlan
- `postTitle` - Title from created service
- `postId` - ID of created service
- `isNewPost` - Boolean flag

---

## 4. STEP 3: PaymentSuccessPage.jsx - Success Confirmation

### Receiving Success Data
```javascript
// Lines 10-11
const location = useLocation();
const { planName, planPrice, postTitle, postId, isNewPost } = location.state || {};
```

### Auto-redirect if State Missing
```javascript
// Lines 15-23
useEffect(() => {
  if (!planName) {
    const t = setTimeout(() => nav("/provider/dashboard"), 3000);
    return () => clearTimeout(t);
  }
  /* delay for entrance animation */
  const t = setTimeout(() => setShowContent(true), 100);
  return () => clearTimeout(t);
}, [planName, nav]);
```

### Return to Dashboard
```javascript
// Button in component
<Link to="/provider/dashboard" className="pf-btn pf-btn-primary">
  Go to Dashboard
</Link>
```

---

## 5. COMPLETE DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ ProviderDashboard.jsx                                           │
│ - Shows "Add New Service" button                                │
│ - Can receive location.state?.returnFormData for pre-fill      │
└──────────────────────┬──────────────────────────────────────────┘
                       │ User clicks "Add New Service"
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ ServiceFormModal.jsx                                            │
│ - Collects: serviceData, selectedPlan, photos, offerings      │
│ - On Submit:                                                   │
│   navigate("/payment/checkout", {                             │
│     state: { formSnapshot, selectedPlan }                     │
│   })                                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │ formSnapshot includes:
                       │ - serviceData
                       │ - selectedPlan
                       │ - photos (File[])
                       │ - selectedOfferings
                       │ - serviceOfferings (structured)
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ CheckoutPage.jsx                                               │
│ - Extracts: { formSnapshot, selectedPlan }                    │
│ - Processes payment                                            │
│ - Creates service: createService(formData)                    │
│ - On Success:                                                 │
│   navigate("/payment/success", {                             │
│     state: {                                                  │
│       planName, planPrice, postTitle, postId, isNewPost      │
│     }                                                         │
│   })                                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ PaymentSuccessPage.jsx                                         │
│ - Displays success receipt                                     │
│ - "Go to Dashboard" link:                                      │
│   navigate("/provider/dashboard")                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ ProviderDashboard.jsx (Refreshed)                             │
│ - Service is now visible in the services list                  │
│ - Can edit/delete the newly created service                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Key Data Structures Summary

### formSnapshot (Passed to Checkout)
```javascript
{
  serviceData: {
    title: string,
    description: string,
    district: string,
    location: string,
    category: string,
    priceFrom: string (numeric),
    priceTo: string (numeric),
    priceUnit: string,
    currency: "LKR" | "USD",
    externalBookingUrl: string,
    whatsappNumber: string
  },
  selectedPlan: {
    id: "standard" | "featured" | "premium",
    name: string,
    price: number,
    photoLimit: number,
    color: string,
    recommended?: boolean
  },
  photos: File[],
  selectedOfferings: string[], // e.g., ["Single Room", "Double Room"]
  serviceOfferings: {
    roomTypes?: string[],
    vehicleTypes?: string[],
    languages?: string[],
    activityTypes?: string[],
    cuisineTypes?: string[]
  }
}
```

### Payment Success Data (Passed to Success Page)
```javascript
{
  planName: string,        // e.g., "Premium Spotlight"
  planPrice: number,       // e.g., 30
  postTitle: string,       // Service title from DB
  postId: number,          // Service ID from DB
  isNewPost: true
}
```

---

## 7. Route Configuration (routes.jsx)

```javascript
<Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
  <Route path="/provider/dashboard" element={<ProviderDashboard />} />
  <Route path="/payment/checkout" element={<CheckoutPage />} />
  <Route path="/payment/success" element={<PaymentSuccessPage />} />
</Route>
```

All payment/checkout routes are protected and only accessible to providers.
