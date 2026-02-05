# Booking System - Setup & Verification Checklist

## Pre-Implementation Checklist

- [ ] Backend running (port 8080)
- [ ] Frontend running (port 5173 or configured port)
- [ ] MongoDB database connected
- [ ] All dependencies installed

---

## Files Created/Updated - Verification

### NEW Frontend Files

- [ ] `src/config/bookingCategoryConfig.jsx` - Booking configuration
- [ ] `src/components/CategoryBookingForm.jsx` - Dynamic booking form
- [ ] `src/components/ServicePricingPanel.jsx` - Provider pricing panel
- [ ] `src/components/BookingDetailsCard.jsx` - Booking details display
- [ ] `src/styles/CategoryBookingForm.css` - Form styles
- [ ] `src/styles/ServicePricingPanel.css` - Pricing panel styles
- [ ] `src/styles/BookingDetailsCard.css` - Card styles

### UPDATED Frontend Files

- [ ] `src/pages/Provider/Dashboard.jsx` - Added bookings tab
- [ ] `src/pages/Traveller/Dashboard.jsx` - Updated booking form & display
- [ ] `src/api/travellerApi.js` - Added new API endpoints
- [ ] `src/styles/ProviderDashboard.css` - Added tab styles
- [ ] `src/styles/TravellerDashboard.css` - Updated bookings list styles

### UPDATED Backend Files

- [ ] `src/main/java/com/travelcommerce/model/Booking.java` - Updated model with new fields

---

## Setup Steps

### Step 1: Frontend Setup

1. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

2. **Verify all new files are created** in the correct directories

3. **Check imports in modified files:**
   - Traveller Dashboard should import: `CategoryBookingForm`, `BookingDetailsCard`
   - Provider Dashboard should import: `BookingDetailsCard`, `getProviderBookings`, `updateBookingStatus`, `deleteBooking`

4. **Verify CSS files exist** and are correctly imported

### Step 2: Backend Setup

1. **Update Booking model** with new fields:
   ```java
   private String category;
   private Map<String, Object> bookingDetails;
   private Map<String, Object> pricingDetails;
   private Date updatedAt;
   ```

2. **Verify BookingController endpoints exist:**
   ```java
   POST /api/bookings              // Create
   GET /api/bookings/my-bookings   // Traveler bookings
   GET /api/bookings/provider-bookings // Provider bookings
   PUT /api/bookings/{id}/status   // Update status
   DELETE /api/bookings/{id}       // Delete
   ```

3. **Compile and restart** Spring Boot application

### Step 3: Database Migration

If you have existing bookings in the database:

- The new fields are optional (set to null/empty for old bookings)
- New bookings will have all fields populated
- No migration script needed if using MongoDB

### Step 4: Test Environment Verification

- [ ] Frontend dev server running without errors
- [ ] Backend API responding to requests
- [ ] Dev tools showing no console errors
- [ ] Network tab showing successful API calls

---

## Quick Verification Tests

### Test 1: Service Category Display
**Steps:**
1. Go to Traveller Dashboard → Browse Services
2. Select a service
3. **Expected:** Service category shown in details

**Pass Criteria:** ✓ Category visible

---

### Test 2: Booking Form Generation
**Steps:**
1. Click "📅 Book This Service" on any service
2. **Expected:** Form shows category-specific fields

**For Tour Guide Service:**
- [ ] Tour Date field
- [ ] Group Size field
- [ ] Duration dropdown
- [ ] Language field
- [ ] Special Requests textarea

**Pass Criteria:** ✓ Correct fields appear

---

### Test 3: Form Validation
**Steps:**
1. Try to submit booking form without filling required fields
2. **Expected:** Error messages appear for empty fields

**Pass Criteria:** ✓ Validation errors shown

---

### Test 4: Booking Creation
**Steps:**
1. Fill out booking form completely
2. Click "Confirm Booking"
3. Check browser console for errors
4. **Expected:** Success message shown

**Pass Criteria:** ✓ Booking submitted successfully

---

### Test 5: Traveller View Bookings
**Steps:**
1. Go to "My Bookings" tab
2. **Expected:** New booking appears in list
3. Verify booking shows:
   - [ ] Service title
   - [ ] Booking status (PENDING)
   - [ ] Category badge
   - [ ] All booking details

**Pass Criteria:** ✓ Booking displayed with all details

---

### Test 6: Provider View Bookings
**Steps:**
1. Log in as provider (service owner)
2. Go to Provider Dashboard → "🎫 Bookings" tab
3. **Expected:** Booking appears in list
4. Click on booking to expand
5. Verify sections visible:
   - [ ] Header with status
   - [ ] Category badge
   - [ ] Booking details (category-specific)
   - [ ] Pricing section (with "Set Pricing" button)
   - [ ] Actions section (status dropdown)

**Pass Criteria:** ✓ All sections visible

---

### Test 7: Set Pricing
**Steps:**
1. In Provider Bookings, click "✏️ Set Pricing"
2. **Expected:** ServicePricingPanel appears
3. See category-specific pricing fields
4. Fill in pricing information
5. Click "Save Pricing"
6. **Expected:** Panel closes, pricing updates

**Pass Criteria:** ✓ Pricing saved successfully

---

### Test 8: Traveller Sees Pricing
**Steps:**
1. As traveller, go to "My Bookings"
2. View the booking
3. Scroll to "Pricing Information" section
4. **Expected:** Provider's pricing visible

**Pass Criteria:** ✓ Pricing displayed correctly

---

### Test 9: Update Booking Status
**Steps:**
1. As provider, view booking
2. In Actions section, change status dropdown
3. Select "CONFIRMED"
4. **Expected:** Status updates immediately
5. Go back to Traveller Bookings
6. **Expected:** Status changed to "CONFIRMED"

**Pass Criteria:** ✓ Status updates for both provider and traveller

---

### Test 10: Cancel Booking
**Steps:**
1. As traveller, go to "My Bookings"
2. Find a PENDING booking
3. Click "Delete Booking" button
4. Confirm deletion
5. **Expected:** Booking removed from list

**Pass Criteria:** ✓ Booking deleted

---

### Test 11: Responsive Design - Mobile
**Steps:**
1. Open developer tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set to iPhone 12 resolution
4. Navigate through booking flow
5. **Expected:** All elements readable and usable

**Check:**
- [ ] Form fields stack vertically
- [ ] Buttons are full width
- [ ] Text is readable (no horizontal scroll)
- [ ] Cards are appropriately sized

**Pass Criteria:** ✓ Mobile view works correctly

---

### Test 12: Different Service Categories
**Steps:**
Repeat Tests 1-9 for each category:
- [ ] Tour Guide
- [ ] Driver
- [ ] Hotel
- [ ] Experience
- [ ] Restaurant

**Expected:** Each has unique fields and pricing

**Pass Criteria:** ✓ All categories work independently

---

## Common Issues & Solutions

### Issue 1: Form fields not appearing
**Problem:** Booking form shows generic fields instead of category-specific
**Solution:**
- Check selectedPost.category is not null
- Verify bookingCategoryConfig.jsx is imported
- Check browser console for errors in getBookingConfig()
- Ensure category name matches config keys (case-sensitive)

### Issue 2: Pricing panel not showing
**Problem:** ServicePricingPanel doesn't appear when clicking "Set Pricing"
**Solution:**
- Check if showPricingPanel state is toggling
- Verify ServicePricingPanel is imported
- Check booking object has category field
- See browser console for TypeErrors

### Issue 3: Bookings not loading in Provider tab
**Problem:** "No bookings yet" message showing when there are bookings
**Solution:**
- Check if getProviderBookings() API exists in backend
- Verify auth token is being sent
- Check backend logs for authentication errors
- Verify provider ID matches in bookings collection

### Issue 4: Status update not working
**Problem:** Dropdown change doesn't update status
**Solution:**
- Check if updateBookingStatus() API exists
- Verify PUT endpoint: `/bookings/{id}/status`
- Check if booking.status field is being updated
- Look for 401/403 authorization errors

### Issue 5: Styling looks broken
**Problem:** CSS classes not applied, layout looks off
**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Check all CSS files are imported correctly
- Verify class names match in JSX (camelCase)
- Run `npm install` to ensure dependencies

---

## Performance Tips

1. **Optimize re-renders:**
   - Close booking modal when booking succeeds
   - Don't fetch all bookings on page load, fetch on tab click

2. **Cache data:**
   - Store bookings in state, update on mutation
   - Refresh on tab switch, not on every render

3. **Lazy load:**
   - Bookings tab only fetches when opened
   - Pricing panel only renders when "Set Pricing" clicked

---

## Browser DevTools Debugging

### Console Checks
```javascript
// Check if config is loaded
console.log(BOOKING_CATEGORIES)

// Check if form data is correct
console.log(bookingForm)

// Check API response
console.log(response.data)
```

### Network Tab
1. Open DevTools → Network tab
2. Make a booking
3. Look for:
   - [ ] POST /api/bookings (201 Created)
   - [ ] GET /api/bookings/my-bookings (200 OK)
   - [ ] GET /api/bookings/provider-bookings (200 OK)
   - [ ] PUT /api/bookings/{id}/status (200 OK)

### Elements Inspector
1. Right-click form → Inspect
2. Verify:
   - [ ] Form has correct number of input fields
   - [ ] Input name attributes match config
   - [ ] CSS classes are applied

---

## Testing Matrix

| Feature | Traveller | Provider | Status |
|---------|-----------|----------|---------|
| View Services | ✓ | ✓ | Working |
| Create Booking | ✓ | - | Test |
| Set Pricing | - | ✓ | Test |
| View Bookings | ✓ | ✓ | Test |
| Update Status | - | ✓ | Test |
| Cancel Booking | ✓ | - | Test |
| Responsive Design | ✓ | ✓ | Test |

---

## Final Verification Checklist

- [ ] All 7 new files created
- [ ] 5 files updated correctly
- [ ] Backend Booking model updated
- [ ] Frontend imports all correct
- [ ] No console errors on startup
- [ ] Can create booking with category-specific fields
- [ ] Can view booking in provider dashboard
- [ ] Can set pricing for booking
- [ ] Can update booking status
- [ ] Traveller sees pricing and status
- [ ] Mobile responsive works
- [ ] Different categories work
- [ ] Database saves all fields correctly

---

## Support & Help

If you encounter issues:

1. **Check browser console** (F12 → Console tab) for JavaScript errors
2. **Check backend logs** for API errors
3. **Verify all files exist** in correct directories
4. **Check file imports** - ensure all dependencies are imported
5. **Test with different categories** to isolate category-specific issues
6. **Check database** - use MongoDB Compass to verify data structure

---

## Post-Launch Checklist

- [ ] Test with real user data
- [ ] Verify database backups
- [ ] Set up monitoring/logging
- [ ] Test payment integration (if applicable)
- [ ] Load testing with multiple concurrent bookings
- [ ] Security testing (authorization, validation)
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor logs for errors

---

## Documentation Files Created

1. **BOOKING_SYSTEM_IMPLEMENTATION.md** - Complete implementation guide
2. **CATEGORY_CONFIGURATION_REFERENCE.md** - Category config details
3. **BOOKING_SYSTEM_ARCHITECTURE.md** - System design & flows
4. **SETUP_VERIFICATION_CHECKLIST.md** - This file

---

## Next Steps

After verification:

1. Create test accounts (traveller & provider)
2. Test full booking workflow
3. Gather user feedback
4. Consider additional categories if needed
5. Plan for enhancements (payments, notifications, etc.)

---

**Last Updated:** February 5, 2026  
**Implementation Status:** ✅ Complete  
**Testing Status:** Pending  
