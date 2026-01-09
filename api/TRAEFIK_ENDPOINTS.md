### **Authentication**

All endpoints below are protected. You must include the `Authorization` header with a valid Bearer token obtained from the `/login` endpoint.

**Header:**
`Authorization: Bearer <your_access_token>`

---

### **1. Configuration**

#### **Get Full Configuration**

Retrieves the entire dynamic configuration (routers and services) currently stored in the YAML file.

- **Endpoint:** `GET /traefik/config`
- **Response:** JSON object containing the full `http` configuration structure.

---

### **2. Routers Management**

#### **List Routers**

- **Endpoint:** `GET /traefik/routers`
- **Response:** A dictionary where keys are router names and values are their configurations.

#### **Add or Update a Router**

Creates a new router or updates an existing one.

- **Endpoint:** `POST /traefik/routers/{name}`
- **Path Parameter:** `name` (string) - The unique name for the router (e.g., `app-router`).
- **Body (JSON):**
  ```json
  {
    "rule": "Host(`example.com`)",
    "service": "app-service",
    "tls": {
      "certResolver": "myresolver"
    }
  }
  ```
  _Note: `tls` is optional._

#### **Delete a Router**

- **Endpoint:** `DELETE /traefik/routers/{name}`
- **Path Parameter:** `name` (string) - The name of the router to delete.

---

### **3. Services Management**

#### **List Services**

- **Endpoint:** `GET /traefik/services`
- **Response:** A dictionary where keys are service names and values are their configurations.

#### **Add or Update a Service**

Creates a new service or updates an existing one.

- **Endpoint:** `POST /traefik/services/{name}`
- **Path Parameter:** `name` (string) - The unique name for the service (e.g., `app-service`).
- **Body (JSON):**
  ```json
  {
    "loadBalancer": {
      "servers": [
        { "url": "http://10.0.1.5:8080" },
        { "url": "http://10.0.1.6:8080" }
      ]
    }
  }
  ```

#### **Delete a Service**

- **Endpoint:** `DELETE /traefik/services/{name}`
- **Path Parameter:** `name` (string) - The name of the service to delete.

---

### **4. Middlewares Management**

#### **List Middlewares**

- **Endpoint:** `GET /traefik/middlewares`
- **Response:** A dictionary where keys are middleware names and values are their configurations.

#### **Add or Update a Middleware**

Creates a new middleware or updates an existing one.

- **Endpoint:** `POST /traefik/middlewares/{name}`
- **Path Parameter:** `name` (string) - The unique name for the middleware (e.g., `my-auth`).
- **Body (JSON):**
  ```json
  {
    "basicAuth": {
      "users": ["user:$apr1$H6uskkkW$IgXLP6ewTrSuBkTrqE8wj/"]
    }
  }
  ```

#### **Delete a Middleware**

- **Endpoint:** `DELETE /traefik/middlewares/{name}`
- **Path Parameter:** `name` (string) - The name of the middleware to delete.

---

### **5. Certificate Resolvers Management**

#### **List Certificate Resolvers**

- **Endpoint:** `GET /traefik/certificates-resolvers`
- **Response:** A dictionary where keys are resolver names and values are their configurations.

#### **Add or Update a Certificate Resolver**

Creates a new certificate resolver or updates an existing one.

- **Endpoint:** `POST /traefik/certificates-resolvers/{name}`
- **Path Parameter:** `name` (string) - The unique name for the resolver (e.g., `letsencrypt`).
- **Body (JSON):**
  ```json
  {
    "acme": {
      "email": "user@example.com",
      "storage": "acme.json",
      "httpChallenge": {
        "entryPoint": "web"
      }
    }
  }
  ```

#### **Delete a Certificate Resolver**

- **Endpoint:** `DELETE /traefik/certificates-resolvers/{name}`
- **Path Parameter:** `name` (string) - The name of the resolver to delete.

---

### **6. TCP/UDP Management**

#### **TCP Routers & Services**

- **List TCP Routers:** `GET /traefik/tcp/routers`
- **Update TCP Router:** `POST /traefik/tcp/routers/{name}`
  ```json
  {
    "rule": "HostSNI(`example.com`)",
    "service": "my-tcp-service",
    "tls": { "passthrough": true }
  }
  ```
- **Delete TCP Router:** `DELETE /traefik/tcp/routers/{name}`

- **List TCP Services:** `GET /traefik/tcp/services`
- **Update TCP Service:** `POST /traefik/tcp/services/{name}`
  ```json
  {
    "loadBalancer": {
      "servers": [{ "address": "10.0.0.1:9000" }]
    }
  }
  ```
- **Delete TCP Service:** `DELETE /traefik/tcp/services/{name}`

#### **UDP Routers & Services**

- **List UDP Routers:** `GET /traefik/udp/routers`
- **Update UDP Router:** `POST /traefik/udp/routers/{name}`
  ```json
  {
    "entryPoints": ["udp_entry"],
    "service": "my-udp-service"
  }
  ```
- **Delete UDP Router:** `DELETE /traefik/udp/routers/{name}`

- **List UDP Services:** `GET /traefik/udp/services`
- **Update UDP Service:** `POST /traefik/udp/services/{name}`
  ```json
  {
    "loadBalancer": {
      "servers": [{ "address": "10.0.0.1:9000" }]
    }
  }
  ```
- **Delete UDP Service:** `DELETE /traefik/udp/services/{name}`

---

### **7. Traefik Status (Live API)**

These endpoints proxy requests directly to the Traefik API to get runtime status information.

#### **Get Routers Status**

- **Endpoint:** `GET /traefik/status/routers`
- **Response:** JSON object containing runtime status of all routers from Traefik.

#### **Get Services Status**

- **Endpoint:** `GET /traefik/status/services`
- **Response:** JSON object containing runtime status of all services from Traefik.

#### **Get Middlewares Status**

- **Endpoint:** `GET /traefik/status/middlewares`
- **Response:** JSON object containing runtime status of all middlewares from Traefik.

#### **Get TCP/UDP Status**

- **TCP Routers:** `GET /traefik/status/tcp/routers`
- **TCP Services:** `GET /traefik/status/tcp/services`
- **UDP Routers:** `GET /traefik/status/udp/routers`
- **UDP Services:** `GET /traefik/status/udp/services`

---

### **8. User Management**

#### **Get Current User**

- **Endpoint:** `GET /users/me/`
- **Response:** JSON object containing the current authenticated user's details.

#### **List Users**

- **Endpoint:** `GET /users/`
- **Query Parameters:**
  - `skip` (int, default 0)
  - `limit` (int, default 100)
- **Response:** A list of user objects.
- **Note:** This endpoint requires admin privileges.

#### **Create User**

- **Endpoint:** `POST /users/`
- **Body (JSON):**
  ```json
  {
    "username": "newuser",
    "password": "securepassword",
    "email": "user@example.com",
    "full_name": "New User",
    "disabled": false
  }
  ```

#### **Update User**

- **Endpoint:** `PUT /users/{username}`
- **Path Parameter:** `username` (string) - The username of the user to update.
- **Body (JSON):**
  ```json
  {
    "email": "updated@example.com",
    "full_name": "Updated Name",
    "password": "newpassword",
    "disabled": false
  }
  ```

#### **Delete User**

- **Endpoint:** `DELETE /users/{username}`
- **Path Parameter:** `username` (string) - The username of the user to delete.

---

### **Example Usage (cURL)**

**1. Login to get token:**

```bash
TOKEN=$(curl -s -X POST "http://localhost:8000/login" \
     -H "Content-Type: application/json" \
     -d '{"username": "johndoe", "password": "secret"}' | jq -r .access_token)
```

**2. Create a Service:**

```bash
curl -X POST "http://localhost:8000/traefik/services/my-app-svc" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
           "loadBalancer": {
             "servers": [{ "url": "http://127.0.0.1:3000" }]
           }
         }'
```

**3. Create a Router linked to that Service:**

```bash
curl -X POST "http://localhost:8000/traefik/routers/my-app-router" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
           "rule": "Host(`myapp.localhost`)",
           "service": "my-app-svc",
           "tls": { "certResolver": "letsencrypt" }
         }'
```
