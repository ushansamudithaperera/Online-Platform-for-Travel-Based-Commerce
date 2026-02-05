# Quick Reference: Booking Category Configuration

## Current Categories Configured

### 1. Tour Guide Service
```
Category ID: tour_guide
Name: Tour Guide

Booking Fields:
- bookingDate (date) - Tour Date
- groupSize (number) - Number of People
- duration (select) - Duration (Half Day, Full Day, Multi-day)
- language (text) - Preferred Language
- specialRequests (textarea) - Special Requests

Pricing Fields:
- pricePerPerson (number) - Price per Person
- durationRate (text) - Duration Rate
- groupDiscount (number) - Group Discount (%)
```

---

### 2. Driver Service
```
Category ID: driver
Name: Driver

Booking Fields:
- bookingDate (date) - Start Date
- endDate (date) - End Date
- destination (text) - Destination
- vehiclePreference (select) - Vehicle Type (Economy, Sedan, SUV, Van, Luxury)
- additionalNotes (textarea) - Additional Notes

Pricing Fields:
- perDayRate (number) - Per Day Rate
- perKmRate (number) - Per KM Rate
- fuelCharge (text) - Fuel Charge
```

---

### 3. Hotel Service
```
Category ID: hotel
Name: Hotel

Booking Fields:
- checkInDate (date) - Check-in Date
- checkOutDate (date) - Check-out Date
- numberOfRooms (number) - Number of Rooms
- roomType (select) - Room Type (Single, Double, Twin, Suite, Deluxe)
- specialRequests (textarea) - Special Requests

Pricing Fields:
- pricePerNight (number) - Price per Room per Night
- roomTypePrice (text) - Room Type Price
- taxRate (number) - Tax Rate (%)
```

---

### 4. Experience Service
```
Category ID: experience
Name: Experience

Booking Fields:
- bookingDate (date) - Experience Date
- participantCount (number) - Number of Participants
- experienceType (select) - Experience Type (Adventure, Cultural, Wellness, Food & Beverage, Outdoor)
- fitnessLevel (select) - Fitness Level Required (Beginner, Intermediate, Advanced)
- additionalInfo (textarea) - Additional Information

Pricing Fields:
- pricePerPerson (number) - Price per Person
- groupPrice (number) - Group Price
- equipmentRental (text) - Equipment Rental
```

---

### 5. Restaurant Service
```
Category ID: restaurant
Name: Restaurant

Booking Fields:
- reservationDate (date) - Reservation Date
- reservationTime (time) - Reservation Time
- partySize (number) - Party Size
- cuisinePreference (select) - Cuisine Preference (Local, Continental, Asian, Fusion, Any)
- specialOccasion (text) - Special Occasion (if any)

Pricing Fields:
- pricePerPerson (number) - Price per Person
- menuPackage (text) - Menu Package
- serviceCharge (number) - Service Charge (%)
```

---

## How to Add a New Service Category

If you need to add a new category (e.g., "Adventure Activities", "Car Rental", etc.):

### Step 1: Update bookingCategoryConfig.jsx

```javascript
// In src/config/bookingCategoryConfig.jsx

export const BOOKING_CATEGORIES = {
  // ... existing categories ...
  
  new_category: {
    name: "Your Category Name",
    fields: [
      { name: "field1", type: "date", label: "Field Label", required: true },
      { name: "field2", type: "number", label: "Another Field", required: true, min: 1 },
      { name: "field3", type: "select", label: "Option Field", required: true,
        options: ["Option 1", "Option 2", "Option 3"] },
      { name: "field4", type: "textarea", label: "Notes", required: false },
    ],
    pricingDetails: [
      { label: "Price/Unit", key: "pricePerUnit", type: "number" },
      { label: "Additional Rate", key: "additionalRate", type: "text" },
      { label: "Tax (%)", key: "taxRate", type: "number" },
    ]
  }
};
```

### Step 2: Update Service Creation

When creating a service, ensure the category name matches:
- Original name: "New Category" 
- Config key: "new_category"
- The `getCategoryKey()` function will convert it automatically

### Step 3: Verify Frontend Integration

The system will automatically:
1. Load correct form fields when service category is selected
2. Show appropriate pricing panel for the provider
3. Display category-specific details in bookings

---

## Field Types Reference

| Type | Description | Example |
|------|-------------|---------|
| `date` | Date picker input | 2026-02-15 |
| `time` | Time picker input | 19:00 |
| `number` | Numeric input with min/max | groupSize, nights |
| `text` | Single-line text input | destination, language |
| `textarea` | Multi-line text input | special requests, notes |
| `select` | Dropdown selection | duration, vehicle type, room type |

---

## Form Validation Rules

- **Required fields**: Marked with `*`, cannot be empty
- **Email**: Must match pattern `user@example.com`
- **Phone**: Any format is accepted (validation on backend can be stricter)
- **Numbers**: Can specify min value with `min` property
- **Dates**: Can use HTML5 date picker constraints

---

## Pricing Field Rules

- **Number fields**: Accept decimal values (e.g., 2500.50)
- **Text fields**: Free text for descriptive pricing (e.g., "Includes food")
- **Currency**: All amounts in Sri Lankan Rupees (Rs)
- **Optional**: Providers can leave pricing blank initially, but should set before confirming

---

## Best Practices

1. **Keep field names intuitive**: Use `checkInDate` not `date1`
2. **Use consistent naming**: `perDay`, `perPerson`, `perNight` for rate fields
3. **Group related fields**: Date fields together, pricing fields together
4. **Limit options**: Select dropdowns should have 5-7 options max
5. **Make UX clear**: Field order should follow booking workflow

---

## Common Patterns

### Pattern 1: Date Range Bookings
```javascript
{ name: "startDate", type: "date", label: "Start Date", required: true },
{ name: "endDate", type: "date", label: "End Date", required: true },
```

### Pattern 2: Unit-Based Pricing
```javascript
{ label: "Price per Unit", key: "pricePerUnit", type: "number" },
{ label: "Quantity/Duration", key: "quantity", type: "number" },
```

### Pattern 3: Package with Options
```javascript
{ name: "packageType", type: "select", label: "Package", required: true,
  options: ["Basic", "Standard", "Premium"] },
{ name: "addOns", type: "textarea", label: "Additional Services", required: false },
```

### Pattern 4: Tiered Pricing
```javascript
{ label: "Base Price", key: "basePrice", type: "number" },
{ label: "Premium Upgrade", key: "premiumPrice", type: "number" },
{ label: "Discount for Groups", key: "groupDiscount", type: "number" },
```

---

## Troubleshooting

**Issue**: Form fields not appearing for a category
- Check that service category name matches config key exactly
- Use `getCategoryKey()` function for conversion

**Issue**: Pricing not saving
- Ensure pricing panel is showing
- Check browser console for errors
- Verify backend is updated with new Booking model

**Issue**: Traveler can't see booking details
- Confirm booking was saved with category field
- Check that BookingDetailsCard is rendering correctly
- Verify API response includes all booking data

---

## Testing a New Category

1. Create a service with the new category name
2. Make a booking as traveler
3. Verify all form fields appear correctly
4. Check that data is saved to database
5. Go to provider dashboard
6. View booking and set pricing
7. Verify traveler can see the details with pricing

---

## File Reference

**Main Configuration File:**
- `src/config/bookingCategoryConfig.jsx` - All category definitions

**Components Using Configuration:**
- `src/components/CategoryBookingForm.jsx` - Renders form fields
- `src/components/ServicePricingPanel.jsx` - Renders pricing fields
- `src/components/BookingDetailsCard.jsx` - Displays booking data

**For Backend Matching:**
- Ensure category string matches config keys (lowercase with underscores)
