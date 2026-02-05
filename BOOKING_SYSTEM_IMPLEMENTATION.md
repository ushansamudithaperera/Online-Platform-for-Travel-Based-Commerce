# Category-Specific Booking System - Implementation Guide

## Overview
You now have a complete, modern category-specific booking system that handles different booking types for different service categories (Tour Guide, Driver, Hotel, Experience, Restaurant). The system allows providers to set category-specific pricing and travelers to make structured bookings with category-relevant fields.

---

## What Was Implemented

### 1. **Booking Configuration System** (Frontend)
**File:** `src/config/bookingCategoryConfig.jsx`

Defines the structure for each service category with:
- **Dynamic Form Fields**: Each category has unique fields (e.g., Tour Guide has "groupSize" and "duration", Hotel has "checkInDate" and "checkOutDate")
- **Pricing Details**: Category-specific pricing fields (e.g., per-person rates, per-day rates, tax rates)

**Supported Categories:**
- `tour_guide`: Tour Date, Group Size, Duration, Language, Special Requests
- `driver`: Start Date, End Date, Destination, Vehicle Type, Notes
- `hotel`: Check-in/out Dates, Rooms, Room Type, Special Requests
- `experience`: Date, Participants, Experience Type, Fitness Level
- `restaurant`: Reservation Date/Time, Party Size, Cuisine, Special Occasion

---

### 2. **Dynamic Booking Form Component** (Frontend)
**File:** `src/components/CategoryBookingForm.jsx`

Features:
- Automatically generates form fields based on selected service category
- Form validation for required fields
- Email and phone validation
- Contact information collection
- Error messages and user feedback

**Usage in Traveler Dashboard:**
```jsx
<CategoryBookingForm
  serviceId={selectedPost.id}
  category={selectedPost.category}
  onSubmit={handleSubmitBooking}
  onCancel={() => setShowBookingModal(false)}
  isLoading={isSubmittingBooking}
/>
```

---

### 3. **Service Pricing Panel** (Frontend)
**File:** `src/components/ServicePricingPanel.jsx`

Allows providers to set pricing for each service with:
- Currency input fields (with Sri Lankan Rupee icon)
- Dynamic fields based on category
- Easy-to-use form interface
- Save/cancel actions

**Pricing Details by Category:**
- Tour Guide: Price/Person, Duration Rate, Group Discount
- Driver: Per-Day Rate, Per-KM Rate, Fuel Charge
- Hotel: Price/Night, Room Type Price, Tax Rate
- Experience: Price/Person, Group Price, Equipment Rental
- Restaurant: Price/Person, Menu Package, Service Charge

---

### 4. **Booking Details Card Component** (Frontend)
**File:** `src/components/BookingDetailsCard.jsx`

Displays all booking information with:
- **For Travelers**: View booking details, pricing information set by provider
- **For Providers**: Manage bookings - view pricing fields, set/update pricing, change booking status
- Status management (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- Category-specific field display
- Color-coded status badges

---

### 5. **Updated Traveler Dashboard**
**File:** `src/pages/Traveller/Dashboard.jsx`

New Features:
- **My Bookings Tab**: Displays all traveler's bookings in a grid layout
- Uses `BookingDetailsCard` to show booking details
- View pricing information provided by the provider
- See category-specific booking details
- Cancel bookings (if status is PENDING)

**Flow:**
1. Traveler selects a service
2. Clicks "📅 Book This Service"
3. Sees category-specific booking form
4. Submits booking with category-relevant details
5. Can view booking details in "My Bookings" tab with pricing info set by provider

---

### 6. **Updated Provider Dashboard**
**File:** `src/pages/Provider/Dashboard.jsx`

New Features:
- **Two Tabs**: "📋 My Services" and "🎫 Bookings"
- **Services Tab**: Original functionality - manage services
- **Bookings Tab**: 
  - View all incoming bookings from travelers
  - See category-specific booking details
  - **Set Pricing**: Click "Set Pricing" button to input pricing details for each booking
  - **Update Status**: Change booking status (PENDING → CONFIRMED → COMPLETED, or CANCELLED)
  - **Delete Bookings**: Remove bookings if needed
  - Filter and search bookings

**Flow:**
1. Provider checks "🎫 Bookings" tab
2. Selects a booking from the list
3. Reviews traveler's booking details (category-specific fields)
4. Clicks "✏️ Set Pricing" to input pricing information
5. Sets status to CONFIRMED/COMPLETED
6. Traveler can see the pricing and booking status

---

### 7. **Updated Data Models** (Backend)

**Booking Model** (`model/Booking.java`):
```java
private String category; // tour_guide, driver, hotel, experience, restaurant
private Map<String, Object> bookingDetails; // Dynamic fields based on category
private Map<String, Object> pricingDetails; // Pricing set by provider
private Date updatedAt; // Track when booking was last updated
```

---

### 8. **API Endpoints** (Frontend)
**File:** `src/api/travellerApi.js`

New/Updated Endpoints:
```javascript
// Get provider's bookings
getProviderBookings() // GET /bookings/provider-bookings

// Update booking status
updateBookingStatus(bookingId, status) // PUT /bookings/{id}/status

// Delete booking
deleteBooking(bookingId) // DELETE /bookings/{id}
```

---

### 9. **Styling**
Created comprehensive CSS files:
- `src/styles/CategoryBookingForm.css` - Form styling
- `src/styles/ServicePricingPanel.css` - Pricing panel styling
- `src/styles/BookingDetailsCard.css` - Card styling with responsive design
- Updated `src/styles/ProviderDashboard.css` - Tabs and bookings section
- Updated `src/styles/TravellerDashboard.css` - Bookings list styling

---

## How to Use

### For Travelers:

1. **Browse Services**
   - Go to "Browse Services" tab
   - Select a service by clicking on it
   - View all service details and images

2. **Make a Booking**
   - Click "📅 Book This Service" button
   - Fill out category-specific booking form
   - Enter contact information (email, phone)
   - Submit booking
   - Booking status starts as "PENDING"

3. **View My Bookings**
   - Go to "My Bookings" tab
   - See all your bookings with status and details
   - View pricing information set by the provider
   - Cancel bookings if they're still pending
   - See booking history

---

### For Providers:

1. **View My Services** (Original)
   - Go to "📋 My Services" tab
   - Create, edit, or delete services
   - Manage service images and details

2. **Manage Bookings** (New)
   - Click "🎫 Bookings" tab
   - See all incoming booking requests
   - Click on a booking to view full details
   - For each booking:
     - Review traveler's category-specific details
     - Click "✏️ Set Pricing" to input pricing information
     - Update booking status (PENDING → CONFIRMED → COMPLETED)
     - Delete if needed

3. **Pricing Workflow**
   - When a traveler books, you see their details
   - Click "Set Pricing" to input:
     - Price per person / per night / per day (based on category)
     - Additional rates (duration, fuel, tax, etc.)
     - Special charges (equipment, service, etc.)
   - Traveler can then see the pricing and confirm

---

## Category-Specific Examples

### Example 1: Tour Guide Booking

**Traveler Provides:**
- Tour Date: 2026-02-15
- Group Size: 5 people
- Duration: Full Day (8 hours)
- Language: English
- Special Requests: Photography stops

**Provider Sets:**
- Price per Person: Rs 2,000
- Duration Rate: Rs 500 per additional hour
- Group Discount: 10% (for groups > 4)

---

### Example 2: Hotel Booking

**Traveler Provides:**
- Check-in: 2026-02-20
- Check-out: 2026-02-25
- Rooms: 2
- Room Type: Deluxe
- Special Requests: Early check-in needed

**Provider Sets:**
- Price/Night per Room: Rs 5,000
- Room Type Premium: +Rs 1,500
- Tax Rate: 8%

---

### Example 3: Restaurant Reservation

**Traveler Provides:**
- Reservation Date: 2026-02-18
- Time: 19:00
- Party Size: 4
- Cuisine: Continental
- Special Occasion: Anniversary

**Provider Sets:**
- Price per Person: Rs 1,500-2,500
- Menu Package: Multi-course (Rs 2,500)
- Service Charge: 10%

---

## Important Notes

1. **Category Matching**: Service category is stored in the booking, so form fields will always match the service type.

2. **Pricing is Optional Initially**: Providers can create bookings without immediately setting pricing, but should do so before confirming.

3. **Field Validation**: Required fields are marked with * and validated before submission.

4. **Status Flow**:
   - PENDING (initial) → CONFIRMED (accepted) → COMPLETED (done) → Optional CANCELLED

5. **Dynamic Data**: All category fields and pricing items are stored in JSON format, making the system extensible for future categories.

---

## Testing Checklist

- [ ] Create a tour guide service and make a booking as traveler
- [ ] Verify category-specific form fields appear
- [ ] Set pricing as provider
- [ ] Confirm pricing appears in traveler's booking view
- [ ] Update booking status and verify it updates
- [ ] Test with different service categories
- [ ] Check responsive design on mobile
- [ ] Verify form validation works
- [ ] Test cancel booking functionality

---

## Future Enhancements

Possible improvements:
- Email notifications when booking status changes
- Booking payment integration
- Reviews specific to individual bookings
- Pricing templates per category
- Bulk pricing settings for multiple services
- Booking calendar/availability management
- Analytics on booking trends by category

---

## File Structure Summary

```
Frontend:
├── src/
│   ├── config/
│   │   └── bookingCategoryConfig.jsx (NEW)
│   ├── components/
│   │   ├── CategoryBookingForm.jsx (NEW)
│   │   ├── ServicePricingPanel.jsx (NEW)
│   │   ├── BookingDetailsCard.jsx (NEW)
│   │   └── ... (existing components)
│   ├── pages/
│   │   ├── Provider/Dashboard.jsx (UPDATED)
│   │   ├── Traveller/Dashboard.jsx (UPDATED)
│   │   └── ... (other pages)
│   ├── api/
│   │   └── travellerApi.js (UPDATED)
│   └── styles/
│       ├── CategoryBookingForm.css (NEW)
│       ├── ServicePricingPanel.css (NEW)
│       ├── BookingDetailsCard.css (NEW)
│       ├── ProviderDashboard.css (UPDATED)
│       └── TravellerDashboard.css (UPDATED)

Backend:
└── src/main/java/com/travelcommerce/
    ├── model/
    │   └── Booking.java (UPDATED)
    ├── controller/
    │   └── BookingController.java (Already supports new endpoints)
    └── repository/
        └── BookingRepository.java (Already has methods)
```

---

## Need Help?

The system is now fully integrated and ready to use. Make sure:
1. All files are created
2. Imports are correct in the updated files
3. Backend Booking model is updated
4. Run your development servers

Happy coding! 🚀
