// src/config/bookingCategoryConfig.jsx
/**
 * Booking configuration for different service categories
 * Each category has specific fields and pricing details
 */

export const BOOKING_CATEGORIES = {
  tour_guide: {
    name: "Tour Guide",
    fields: [
      { name: "bookingDate", type: "date", label: "Tour Date", required: true },
      { name: "groupSize", type: "number", label: "Number of People", required: true, min: 1 },
      { name: "duration", type: "select", label: "Duration", required: true, 
        options: ["Half Day (4 hours)", "Full Day (8 hours)", "Multi-day"] },
      { name: "language", type: "text", label: "Preferred Language", required: true },
      { name: "specialRequests", type: "textarea", label: "Special Requests", required: false },
    ],
    pricingDetails: [
      { label: "Price per Person", key: "pricePerPerson", type: "number" },
      { label: "Duration Rate", key: "durationRate", type: "text" },
      { label: "Group Discount (%)", key: "groupDiscount", type: "number" },
    ]
  },
  
  driver: {
    name: "Driver",
    fields: [
      { name: "bookingDate", type: "date", label: "Start Date", required: true },
      { name: "endDate", type: "date", label: "End Date", required: true },
      { name: "destination", type: "text", label: "Destination", required: true },
      { name: "vehiclePreference", type: "select", label: "Vehicle Type", required: true,
        options: ["Economy Car", "Sedan", "SUV", "Van", "Luxury Vehicle"] },
      { name: "additionalNotes", type: "textarea", label: "Additional Notes", required: false },
    ],
    pricingDetails: [
      { label: "Per Day Rate", key: "perDayRate", type: "number" },
      { label: "Per KM Rate", key: "perKmRate", type: "number" },
      { label: "Fuel Charge", key: "fuelCharge", type: "text" },
    ]
  },
  
  hotel: {
    name: "Hotel",
    fields: [
      { name: "checkInDate", type: "date", label: "Check-in Date", required: true },
      { name: "checkOutDate", type: "date", label: "Check-out Date", required: true },
      { name: "numberOfRooms", type: "number", label: "Number of Rooms", required: true, min: 1 },
      { name: "roomType", type: "select", label: "Room Type", required: true,
        options: ["Single", "Double", "Twin", "Suite", "Deluxe"] },
      { name: "specialRequests", type: "textarea", label: "Special Requests", required: false },
    ],
    pricingDetails: [
      { label: "Price per Room per Night", key: "pricePerNight", type: "number" },
      { label: "Room Type Price", key: "roomTypePrice", type: "text" },
      { label: "Tax Rate (%)", key: "taxRate", type: "number" },
    ]
  },
  
  experience: {
    name: "Experience",
    fields: [
      { name: "bookingDate", type: "date", label: "Experience Date", required: true },
      { name: "participantCount", type: "number", label: "Number of Participants", required: true, min: 1 },
      { name: "experienceType", type: "select", label: "Experience Type", required: true,
        options: ["Adventure", "Cultural", "Wellness", "Food & Beverage", "Outdoor Activity"] },
      { name: "fitnessLevel", type: "select", label: "Fitness Level Required", required: false,
        options: ["Beginner", "Intermediate", "Advanced"] },
      { name: "additionalInfo", type: "textarea", label: "Additional Information", required: false },
    ],
    pricingDetails: [
      { label: "Price per Person", key: "pricePerPerson", type: "number" },
      { label: "Group Price", key: "groupPrice", type: "number" },
      { label: "Equipment Rental", key: "equipmentRental", type: "text" },
    ]
  },
  
  restaurant: {
    name: "Restaurant",
    fields: [
      { name: "reservationDate", type: "date", label: "Reservation Date", required: true },
      { name: "reservationTime", type: "time", label: "Reservation Time", required: true },
      { name: "partySize", type: "number", label: "Party Size", required: true, min: 1 },
      { name: "cuisinePreference", type: "select", label: "Cuisine Preference", required: false,
        options: ["Local", "Continental", "Asian", "Fusion", "Any"] },
      { name: "specialOccasion", type: "text", label: "Special Occasion (if any)", required: false },
    ],
    pricingDetails: [
      { label: "Price per Person", key: "pricePerPerson", type: "number" },
      { label: "Menu Package", key: "menuPackage", type: "text" },
      { label: "Service Charge (%)", key: "serviceCharge", type: "number" },
    ]
  }
};

export const getBookingConfig = (category) => {
  const normalizedCategory = category?.toLowerCase().replace(/\s+/g, '_').trim();
  return BOOKING_CATEGORIES[normalizedCategory] || BOOKING_CATEGORIES.experience;
};

export const getCategoryKey = (categoryName) => {
  return categoryName?.toLowerCase().replace(/\s+/g, '_').trim();
};
