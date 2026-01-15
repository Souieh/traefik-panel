# Frontend-Backend Compatibility Analysis

## Overview
This document analyzes the compatibility between the frontend (React/TypeScript) and backend (FastAPI/Python) authentication systems.

## ✅ Compatible Areas

### 1. Login Request
- **Backend**: `UserLogin { username: str, password: str }`
- **Frontend**: `LoginRequest { username: string, password: string }`
- **Status**: ✅ Compatible
- **Note**: Backend accepts both username AND email (line 40-42 in auth.py), frontend label says "Username or Email" - this is correct

### 2. Password Reset Request
- **Backend**: `UserResetPassword { token: str, new_password: str }`
- **Frontend**: `ResetPasswordRequest { token: string, new_password: string }`
- **Status**: ✅ Compatible

### 3. Forgot Password Request
- **Backend**: `UserForgotPassword { email: str }`
- **Frontend**: `ForgotPasswordRequest { email: string }`
- **Status**: ✅ Compatible

### 4. Change Password Request
- **Backend**: `UserChangePassword { old_password: str, new_password: str }`
- **Frontend**: `ChangePasswordRequest { old_password: string, new_password: string }`
- **Status**: ✅ Compatible

### 5. Token Response (Functional)
- **Backend**: Returns `Token { access_token: str, token_type: str }`
- **Frontend**: Uses only `access_token` from response
- **Status**: ✅ Functionally compatible (frontend ignores `token_type`, which is fine)

## ⚠️ Issues Found

### 1. **CRITICAL: User Model Mismatch**

**Backend User Model** (api/core/models.py:21-26):
```python
class User(BaseModel):
    username: str
    email: Union[str, None] = None
    full_name: Union[str, None] = None
    disabled: Union[bool, None] = None
    role: UserRole = UserRole.OPERATOR  # "admin" or "operator"
```

**Frontend User Interface** (web/src/types/auth.ts:1-7):
```typescript
export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;  // ❌ Backend uses "disabled"
  is_superuser: boolean;  // ❌ Backend uses "role" (admin/operator)
}
```

**Issues**:
- Frontend expects `id` but backend doesn't return it
- Frontend expects `is_active` (boolean) but backend returns `disabled` (boolean, inverted)
- Frontend expects `is_superuser` (boolean) but backend returns `role` (enum: "admin" | "operator")
- Frontend expects `email` as required, backend returns it as optional
- Backend returns `full_name`, frontend doesn't have it

**Impact**: The `getProfile()` function in auth.ts may fail or have type errors.

### 2. **Error Message Handling**

**Backend** (api/routers/auth.py):
- Returns specific error messages:
  - Line 54: "Account locked due to too many failed attempts. Please try again later."
  - Line 66: "Incorrect username or password"
- Error format: `{"detail": "error message"}`

**Frontend** (web/src/pages/LoginPage.tsx:32-33):
```typescript
catch (error) {
  toast.error("Invalid credentials");  // Generic message
}
```

**Issue**: Frontend doesn't extract or display the backend's specific error messages, especially the account lockout message.

**Impact**: Users don't see helpful error messages (e.g., account lockout).

### 3. **Token Type Missing from Frontend Type**

**Backend**: Returns `Token { access_token: str, token_type: str }`

**Frontend** (web/src/services/auth.ts:12-14):
```typescript
export interface LoginResponseData {
  access_token: string;  // ❌ Missing token_type
}
```

**Impact**: Minor - frontend doesn't use `token_type`, but type is incomplete.

## 🔧 Recommended Fixes

### Fix 1: Update Frontend User Interface
Update `web/src/types/auth.ts` to match backend:

```typescript
export interface User {
  username: string;
  email: string | null;
  full_name: string | null;
  disabled: boolean | null;
  role: "admin" | "operator";
}
```

Then update any code that uses `is_active` or `is_superuser` to use `disabled` and `role` instead.

### Fix 2: Improve Error Handling in LoginPage
Update `web/src/pages/LoginPage.tsx`:

```typescript
catch (error: any) {
  const errorMessage = error.response?.data?.detail || "Invalid credentials";
  toast.error(errorMessage);
}
```

### Fix 3: Update LoginResponseData Type
Update `web/src/services/auth.ts`:

```typescript
export interface LoginResponseData {
  access_token: string;
  token_type: string;
}
```

## 📋 Summary

| Component | Status | Issues |
|-----------|--------|--------|
| Login Request | ✅ Compatible | None |
| Password Reset | ✅ Compatible | None |
| Forgot Password | ✅ Compatible | None |
| Change Password | ✅ Compatible | None |
| Token Response | ✅ Functional | Missing `token_type` in type |
| User Model | ❌ **MISMATCH** | **CRITICAL** - Field names and types differ |
| Error Handling | ⚠️ Incomplete | Specific error messages not shown |

## 🎯 Priority Fixes

1. **HIGH**: Fix User model mismatch (affects `getProfile()` and user display)
2. **MEDIUM**: Improve error message handling (better UX)
3. **LOW**: Add `token_type` to LoginResponseData type (type completeness)

