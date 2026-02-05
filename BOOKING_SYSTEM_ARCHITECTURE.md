# Booking System Flow & Architecture

## Complete Booking Workflow

```
TRAVELER SIDE                          PROVIDER SIDE
─────────────────────────────────────────────────────────

Traveler Views Service
        │
        ├─ Category-specific details shown
        │
        ▼
"Book This Service" clicked
        │
        ▼
CategoryBookingForm Shows                   
(Category-specific fields)
        │
        ├─ Tour Guide: Group Size, Duration
        ├─ Driver: Vehicle Type, Destination  
        ├─ Hotel: Check-in/out, Room Type
        ├─ Experience: Participants, Type
        └─ Restaurant: Time, Party Size
        │
        ▼
Traveler Fills Form +
Contact Info                               
        │
        ▼
Submit Booking                             
        │
        ├──────────────────────────────────┐
        │                                  │
        ▼                                  ▼
Booking Created                      Provider Gets
(Status: PENDING)                    Booking Request
                                            │
        ▼                                   ├─ View All Bookings
Traveler Sees                               │ (Bookings Tab)
"PENDING" Status                           │
                                            ▼
                                     Select Booking
                                            │
                                            ├─ Review Category
                                            │  Booking Details
                                            │
                                            ├─ Click "Set Pricing"
                                            │
                                            ▼
                                      ServicePricingPanel
                                      (Category-specific
                                       pricing fields)
                                            │
                                            ├─ Tour: Price/Person
                                            ├─ Driver: Per-Day Rate
                                            ├─ Hotel: Per-Night
                                            ├─ Experience: Group Rate
                                            └─ Restaurant: Per-Person
                                            │
                                            ▼
                                      Provider Saves
                                      Pricing Details
                                            │
        ◄───────────────────────────────────┤
        │
        ▼
Traveler Sees Booking
with Provider's Pricing
        │
        ├─ Can see all pricing set
        ├─ Can see booking status
        └─ Can cancel if PENDING
        │
        ▼
Provider Updates Status
(PENDING → CONFIRMED)
        │
        ├─────────────────────────────────►
                                            ▼
                                      Provider Can:
                                      ├─ Update to COMPLETED
                                      ├─ Mark CANCELLED
                                      └─ Delete booking
        │
        ▼
Traveler Sees Status:
CONFIRMED / COMPLETED

```

---

## Data Flow Architecture

### 1. Booking Creation Flow

```
Frontend                API              Backend
─────────               ───              ───────

CategoryBookingForm
  └─ Collects:          POST /bookings   BookingController
     - serviceId                           │
     - category        ────────────┐       ├─ Verify user
     - dynamicFields   │           │       ├─ Get service details
     - contactEmail    │           ├──────►├─ Set providerId
     - contactPhone    │           │       ├─ Set travellerName
                       │           │       ├─ Set status=PENDING
                       │           │       │
                       │           │       ▼
                       │           │     BookingRepository
                       │           │       │
                       │           │       └─ Save to MongoDB
                       │           │
                       ◄───────────┘
                       │
                       └─> Response
                           (booking object)
                           │
                           ▼
                       fetchMyBookings()
                       rendered in
                       Traveller Dashboard
```

### 2. Pricing Update Flow

```
Frontend                 API               Backend
─────────                ───               ───────

ServicePricingPanel    PUT /bookings/{id}
  │                    /status & pricing
  ├─ Provider fills      │
  │  pricing form        │
  │                      ├─────────┐
  ├─ Sends:              │         │
  │  - bookingId         │         ├─► BookingController
  │  - pricingDetails    │         │     │
  │  - (optional status) │         │     ├─ Update booking
  │                      │         │     ├─ Set pricing
  │                      │         │     │
  │                      │         │     ▼
  │                      │         │   BookingRepository
  │                      │         │     │
  │                      │         │     └─ Update MongoDB
  │                      │         │
  │                      ◄─────────┘
  │                      │
  └──────────────────────┴─► Response
                             (updated booking)
                             │
                             ▼
                        fetchProviderBookings()
                        or fetchMyBookings()
```

### 3. Status Update Flow

```
Frontend                 API               Backend
─────────                ───               ───────

BookingDetailsCard    PUT /bookings/{id}
  │                  /status
  ├─ Provider         │
  │  changes status   ├────────┐
  │  in dropdown       │        │
  │                    │        ├──► BookingController
  ├─ Sends:           │        │     │
  │  - bookingId       │        │     ├─ Validate status
  │  - newStatus       │        │     ├─ Update booking
  │                    │        │     │
  └────────────────────┘        │     ▼
                                │   BookingRepository
                                │     │
                                │     └─ Update MongoDB
                                │
                                ◄─────┘
                                │
                                └─► Response
                                    │
                                    ▼
                               Update UI
                               Status badge changes
```

---

## Component Hierarchy

```
Provider Dashboard
├─ Tabs (Services / Bookings)
│
├─ Services Tab (Original)
│  ├─ Service List
│  └─ Service Details + Edit
│
└─ Bookings Tab (NEW)
   ├─ Bookings List
   │  └─ BookingDetailsCard (NEW)
   │     ├─ Header (Booking ID, Status)
   │     ├─ Details Section
   │     │  └─ renderDynamicFields()
   │     │     (Based on category)
   │     │
   │     ├─ Pricing Section
   │     │  └─ ServicePricingPanel (NEW)
   │     │     (Category-specific pricing)
   │     │
   │     └─ Actions Section
   │        ├─ Status Selector
   │        └─ Delete Button
   │
   └─ Empty State Message


Traveller Dashboard
├─ Tabs (Services / Bookings / etc)
│
├─ Services Tab (Original)
│  ├─ Category Buttons
   ├─ Service List
   └─ Service Details
        │
        ├─ "Book Service" Button
        │
        └─ BookingModal
           └─ CategoryBookingForm (NEW)
              ├─ Dynamic Fields
              │  (Based on category)
              └─ Contact Info
│
└─ Bookings Tab (UPDATED)
   ├─ Bookings List (Grid)
   │  └─ BookingDetailsCard (NEW)
   │     ├─ Booking Info
   │     ├─ Booking Details
   │     │  (Category-specific)
   │     ├─ Pricing Info
   │     │  (Set by provider)
   │     └─ Cancel Button
   │
   └─ Empty State Message
```

---

## Database Schema (MongoDB - Booking Collection)

```javascript
{
  _id: ObjectId,
  
  // Traveler Info
  travellerId: "user123",
  travellerName: "John Doe",
  contactEmail: "john@example.com",
  contactPhone: "+94712345678",
  
  // Service Info
  serviceId: "service123",
  serviceTitle: "Kandy City Tour",
  providerId: "provider456",
  
  // Category & Dynamic Fields
  category: "tour_guide",
  bookingDetails: {
    bookingDate: "2026-02-15",
    groupSize: 5,
    duration: "Full Day (8 hours)",
    language: "English",
    specialRequests: "Photography stops"
  },
  
  // Provider's Pricing
  pricingDetails: {
    pricePerPerson: 2000,
    durationRate: "Rs 500 per additional hour",
    groupDiscount: 10
  },
  
  // Status & Timestamps
  status: "CONFIRMED",
  createdAt: ISODate("2026-02-10T10:00:00Z"),
  updatedAt: ISODate("2026-02-12T14:30:00Z"),
  
  // Additional field
  message: "Please arrange early pickup" (optional)
}
```

---

## API Endpoints

### Booking Endpoints (Backend)

```
POST /api/bookings
├─ Create new booking
├─ Requires: Auth (traveler)
├─ Body: { serviceId, ...dynamicFields, contactEmail, contactPhone }
└─ Returns: { booking } with all details

GET /api/bookings/my-bookings
├─ Get traveler's bookings
├─ Requires: Auth (traveler)
└─ Returns: [ { booking }, ... ]

GET /api/bookings/provider-bookings
├─ Get provider's incoming bookings
├─ Requires: Auth (provider)
└─ Returns: [ { booking }, ... ]

PUT /api/bookings/{id}/status
├─ Update booking status
├─ Requires: Auth (provider)
├─ Body: { status: "CONFIRMED" | "COMPLETED" | "CANCELLED" }
└─ Returns: { booking }

DELETE /api/bookings/{id}
├─ Delete/cancel booking
├─ Requires: Auth (traveler or provider)
└─ Returns: success message
```

### Frontend API Client

```javascript
// src/api/travellerApi.js

createBooking(bookingData)
  ├─ POST /bookings
  └─ bookingData includes all category fields + contact info

getMyBookings()
  ├─ GET /bookings/my-bookings
  └─ Returns traveler's bookings

getProviderBookings()
  ├─ GET /bookings/provider-bookings
  └─ Returns provider's bookings

updateBookingStatus(bookingId, status)
  ├─ PUT /bookings/{id}/status
  └─ status: PENDING | CONFIRMED | COMPLETED | CANCELLED

deleteBooking(bookingId)
  ├─ DELETE /bookings/{id}
  └─ Cancels/removes booking
```

---

## Configuration System

```
bookingCategoryConfig.jsx
│
├─ BOOKING_CATEGORIES object
│  │
│  ├─ tour_guide (key)
│  │  ├─ name: "Tour Guide"
│  │  ├─ fields: [ {...}, {...} ]
│  │  └─ pricingDetails: [ {...}, {...} ]
│  │
│  ├─ driver
│  │  ├─ name: "Driver"
│  │  ├─ fields: [ {...}, {...} ]
│  │  └─ pricingDetails: [ {...}, {...} ]
│  │
│  ├─ hotel
│  ├─ experience
│  └─ restaurant
│
├─ getBookingConfig(category)
│  └─ Returns config for matched category
│
└─ getCategoryKey(categoryName)
   └─ Converts "Tour Guide" → "tour_guide"
```

---

## State Management

### Provider Dashboard
```
activeTab: "services" | "bookings"
selectedPost: { serviceData }
selectedBooking: { bookingData }
posts: [ { serviceData }, ... ]
bookings: [ { bookingData }, ... ]
```

### Traveller Dashboard
```
activeTab: "services" | "bookings" | "reviews" | ...
selectedPost: { serviceData }
bookings: [ { bookingData }, ... ]
bookingForm: { ...formData } (REMOVED - now use CategoryBookingForm)
showBookingModal: boolean
```

---

## Error Handling

```
Booking Creation
├─ 401: User not authenticated
├─ 404: Service not found
├─ 400: Invalid booking data
└─ 500: Server error

Status Update
├─ 401: User not authenticated
├─ 403: Not authorized (wrong provider)
├─ 404: Booking not found
└─ 500: Server error

Fetching Bookings
├─ 401: User not authenticated
├─ 500: Server error
└─ Returns empty array if no bookings
```

---

## Responsive Breakpoints

```css
Desktop (> 1000px)
├─ Provider Dashboard: Grid layout (2 columns)
├─ Bookings Grid: 2-3 columns
└─ Form: 2-column grid

Tablet (600px - 1000px)
├─ Provider Dashboard: 1 column
├─ Bookings Grid: 1-2 columns
└─ Form: 1-2 column grid

Mobile (< 600px)
├─ Provider Dashboard: 1 column, stacked
├─ Bookings Grid: 1 column
├─ Form: Single column
├─ Status actions: Full width
└─ Buttons: Full width or stacked
```

---

## Performance Considerations

1. **Lazy Loading**: Bookings are fetched only when Bookings tab is clicked
2. **Single Select**: Only one booking displayed in detail at a time
3. **Memoization**: CategoryBookingForm re-initializes only when category changes
4. **State Optimization**: Separate loading states for services vs bookings
5. **API Caching**: Consider adding provider booking cache

---

## Security Notes

✓ Authentication required for all booking operations  
✓ Travellers can only see their own bookings  
✓ Providers can only see bookings for their services  
✓ Backend validates authorization on all updates  
✓ Form data validated on both frontend and backend  
✓ No sensitive data in URL parameters  

---

## Future Integration Points

- Payment gateway integration (capture pricing)
- Email notifications (booking status changes)
- SMS alerts (important dates)
- Calendar sync (availability management)
- Analytics dashboard (booking trends by category)
- Review system (category-specific review data)
- Cancellation policies (category-specific rules)
