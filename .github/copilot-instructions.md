# Travel Commerce Platform - AI Coding Instructions

## Architecture Overview

**Fullstack Monorepo**: Separate frontend (React + Vite) and backend (Spring Boot + MongoDB) in `travel_commerce_front-end/` and `travel-commerce_back-end/`.

**Three-Role System**: Users are `traveller`, `provider`, or `admin`. Backend uses Spring Security with `ROLE_` prefix (`ROLE_TRAVELLER`, `ROLE_PROVIDER`, `ROLE_ADMIN`). Frontend normalizes these to lowercase without prefix in [AuthContext.jsx](travel_commerce_front-end/src/context/AuthContext.jsx#L7) via `normalizeRole()`.

**Service Lifecycle**: Providers create services (ServicePost) with `Status.PENDING` → Admin approves to `Status.ACTIVE` or bans to `Status.BANNED` via [AdminController.java](travel-commerce_back-end/src/main/java/com/travelcommerce/controller/AdminController.java).

## Key Patterns

### Authentication Flow
1. Backend [AuthController](travel-commerce_back-end/src/main/java/com/travelcommerce/controller/AuthController.java#L43) returns `{token, user}` with JWT
2. Frontend stores token in localStorage and attaches via [axiosConfig.js](travel_commerce_front-end/src/api/axiosConfig.js#L10) interceptor
3. [JwtAuthFilter](travel-commerce_back-end/src/main/java/com/travelcommerce/config/JwtAuthFilter.java) validates bearer tokens and sets Spring Security context
4. Role-based routing in [routes.jsx](travel_commerce_front-end/src/routes.jsx) using [ProtectedRoute](travel_commerce_front-end/src/components/ProtectedRoute.jsx)

### File Upload Pattern
Services support multipart form data with images. See [ServiceController](travel-commerce_back-end/src/main/java/com/travelcommerce/controller/ServiceController.java#L57) `@PostMapping(consumes = MULTIPART_FORM_DATA_VALUE)` and [serviceApi.js](travel_commerce_front-end/src/api/serviceApi.js#L8) using FormData. Images stored in `uploads/` directory, served via `/uploads/**` public path.

### Frontend Image Handling
Always construct image URLs using `backendBaseUrl + imagePath` pattern. See [Provider Dashboard](travel_commerce_front-end/src/pages/Provider/Dashboard.jsx#L28-L37) `getImageUrl()` helper.

## Development Workflows

### Running Locally
**Backend**: 
```bash
cd travel-commerce_back-end
./mvnw spring-boot:run  # Runs on port 8080
```
Requires MongoDB at `mongodb://localhost:27017/travelcommerce` (see [application.properties](travel-commerce_back-end/src/main/resources/application.properties)).

**Frontend**:
```bash
cd travel_commerce_front-end
npm run dev  # Runs on port 5173
```
Backend URL configured via `VITE_API_BASE` env var (defaults to `http://localhost:8080/api`).

### Project Conventions
- **Lombok**: Used extensively in backend models (`@Data` annotation). Never manually write getters/setters.
- **DTO Pattern**: [RegisterDTO](travel-commerce_back-end/src/main/java/com/travelcommerce/dto/RegisterDTO.java), [LoginDTO](travel-commerce_back-end/src/main/java/com/travelcommerce/dto/LoginDTO.java) for request bodies.
- **ApiResponse**: Standard wrapper in [dto/ApiResponse.java](travel-commerce_back-end/src/main/java/com/travelcommerce/dto/ApiResponse.java) for success/error messages.
- **React Context**: [AuthContext](travel_commerce_front-end/src/context/AuthContext.jsx) manages global user state. Always use `useAuth()` hook, never access localStorage directly.

## Critical Integration Points

**Security Configuration**: [SecurityConfig.java](travel-commerce_back-end/src/main/java/com/travelcommerce/config/SecurityConfig.java#L43-L56) defines public endpoints (`/api/auth/**`, `/api/services`, `/uploads/**`) vs authenticated routes. Admin endpoints require `ROLE_ADMIN` authority.

**CORS**: Configured in [CorsConfig.java](travel-commerce_back-end/src/main/java/com/travelcommerce/config/CorsConfig.java) - check this if frontend can't reach backend.

**Provider vs Admin Endpoints**: 
- `/api/services/provider-posts` returns only current user's services
- `/api/admin/pending-posts` shows all pending services for approval

## Common Pitfalls

⚠️ **Role mismatch**: Backend sends `ROLE_PROVIDER`, frontend expects `provider`. Always use `normalizeRole()` when setting user state.

⚠️ **Image paths**: Don't hardcode `localhost:8080` in components. Use `import.meta.env.VITE_API_BASE` or helper functions.

⚠️ **Authentication on edit**: Service updates require ownership check - `ServiceController` verifies `providerId` matches authenticated user.
