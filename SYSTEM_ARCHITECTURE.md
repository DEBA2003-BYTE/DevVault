# System Architecture Diagram

## Complete System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        A1[Login/Signup Form]
        A2[GPS Location Capture]
        A3[Keystroke Dynamics]
        A4[Access Control Page]
        A5[User Dashboard]
        A6[Admin Dashboard]
    end

    subgraph "Frontend Layer"
        B[HTML/CSS/JavaScript]
        B1[auth.js - Authentication]
        B2[user-dashboard.js]
        B3[admin-dashboard.js]
        B4[config.js - API Config]
        B5[Leaflet.js - Maps]
    end

    subgraph "Backend Layer - Express.js/Node.js"
        C[API Routes]
        C1[auth.js - Auth Routes]
        C2[user.js - User Routes]
        C3[admin.js - Admin Routes]
        
        D[Middleware]
        D1[authMiddleware - JWT Verify]
        D2[adminMiddleware - Role Check]
        D3[multer - File Upload]
        
        E[Services]
        E1[Risk Assessment Engine]
        E2[Email Service - Nodemailer]
        E3[S3 Service - AWS SDK]
    end

    subgraph "Risk Assessment Engine"
        R1[Location Anomaly - 20pts]
        R2[Keystroke Anomaly - 30pts]
        R3[Session Time - 30pts]
        R4[Unusual Time - 20pts]
        R5[Failed Attempts]
        R6[Impossible Travel]
        R7[Risk Score Calculator]
        R8[Decision Engine]
    end

    subgraph "Database Layer - MongoDB Atlas"
        F[(User Collection)]
        G[(AccessLog Collection)]
        H[(File Collection)]
        I[(Feedback Collection)]
        J[(Settings Collection)]
    end

    subgraph "External Services"
        K[AWS S3 Storage]
        L[Email SMTP Server]
        M[GeoIP Service]
    end

    subgraph "Security Components"
        S1[bcrypt - Password Hash]
        S2[JWT - Token Generation]
        S3[OTP Generator]
        S4[Haversine Distance]
    end

    %% Client to Frontend
    A --> B
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    A5 --> B2
    A6 --> B3

    %% Frontend to Backend
    B1 --> C1
    B2 --> C2
    B3 --> C3
    B4 --> C

    %% Backend Routes to Middleware
    C1 --> D1
    C2 --> D1
    C3 --> D1
    C3 --> D2
    C2 --> D3

    %% Middleware to Services
    D1 --> E1
    C1 --> E1
    C1 --> E2
    C2 --> E3

    %% Risk Assessment Flow
    E1 --> R1
    E1 --> R2
    E1 --> R3
    E1 --> R4
    E1 --> R5
    E1 --> R6
    R1 --> R7
    R2 --> R7
    R3 --> R7
    R4 --> R7
    R5 --> R7
    R6 --> R7
    R7 --> R8

    %% Database Connections
    C1 --> F
    C1 --> G
    C2 --> F
    C2 --> H
    C3 --> F
    C3 --> G
    C3 --> I
    C3 --> J

    %% External Services
    E3 --> K
    E2 --> L
    E1 --> M

    %% Security Components
    C1 --> S1
    C1 --> S2
    E2 --> S3
    E1 --> S4

    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style E1 fill:#ffebee
    style F fill:#e8f5e9
    style K fill:#fff9c4
    style R7 fill:#ff6b6b
    style R8 fill:#4ecdc4
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant R as Risk Engine
    participant DB as MongoDB
    participant E as Email Service
    participant S as AWS S3

    U->>F: Enter credentials + GPS
    F->>F: Capture keystroke dynamics
    F->>B: POST /api/auth/login
    B->>DB: Query user credentials
    DB-->>B: User data
    B->>B: Verify password (bcrypt)
    
    alt Password Valid
        B->>R: Calculate risk score
        R->>DB: Get user history
        DB-->>R: Location, patterns, logs
        R->>R: Evaluate 6 risk factors
        R-->>B: Risk score + breakdown
        
        alt Risk 0-40 (Low)
            B->>B: Generate JWT token
            B-->>F: Access granted + token
            F->>F: Store token in localStorage
            F->>U: Redirect to dashboard
        else Risk 41-70 (Medium)
            B->>DB: Check OTP email registered
            alt OTP Email Exists
                B->>E: Send 4-digit OTP
                E-->>U: Email with OTP
                B-->>F: MFA required
                F->>U: Show OTP input
                U->>F: Enter OTP
                F->>B: POST /api/auth/verify-mfa
                B->>B: Verify OTP
                alt OTP Valid
                    B->>B: Generate JWT token
                    B-->>F: Access granted + token
                    F->>U: Redirect to dashboard
                else OTP Invalid
                    B-->>F: Invalid OTP
                    F->>U: Show error
                end
            else No OTP Email
                B->>DB: Block account
                B-->>F: Account blocked
                F->>U: Contact admin message
            end
        else Risk 71-100 (High)
            B->>DB: Block account for 4 hours
            B->>E: Send block notification
            B-->>F: Access denied
            F->>U: Account blocked message
        end
    else Password Invalid
        B->>DB: Log failed attempt
        B-->>F: Invalid credentials
        F->>U: Show error
    end
```

## Risk Assessment Flow

```mermaid
flowchart TD
    Start([Login Attempt]) --> Collect[Collect Context Data]
    
    Collect --> GPS[GPS Coordinates]
    Collect --> Keys[Keystroke Dynamics]
    Collect --> Time[Session Timing]
    Collect --> Device[Device Info]
    
    GPS --> L1{Location<br/>Anomaly?}
    L1 -->|Far from baseline| L2[+20 points]
    L1 -->|Normal| L3[+0 points]
    
    Keys --> K1{Delete Key<br/>Count High?}
    K1 -->|Yes| K2[+30 points]
    K1 -->|No| K3[+0 points]
    
    Time --> T1{Session Time<br/>Abnormal?}
    T1 -->|Too fast/slow| T2[+30 points]
    T1 -->|Normal| T3[+0 points]
    
    Device --> U1{Unusual<br/>Time?}
    U1 -->|Outside hours| U2[+20 points]
    U1 -->|Normal hours| U3[+0 points]
    
    L2 --> Aggregate
    L3 --> Aggregate
    K2 --> Aggregate
    K3 --> Aggregate
    T2 --> Aggregate
    T3 --> Aggregate
    U2 --> Aggregate
    U3 --> Aggregate
    
    Aggregate[Aggregate Risk Score] --> Check{Total<br/>Score?}
    
    Check -->|0-40| Allow[Grant Access<br/>JWT Token]
    Check -->|41-70| MFA{OTP Email<br/>Registered?}
    Check -->|71-100| Block[Block Account<br/>4 Hours]
    
    MFA -->|Yes| SendOTP[Send Email OTP]
    MFA -->|No| BlockNoMFA[Block Account]
    
    SendOTP --> VerifyOTP{OTP<br/>Valid?}
    VerifyOTP -->|Yes| Allow
    VerifyOTP -->|No| Retry[Show Error]
    
    Allow --> Log1[Log Success]
    Block --> Log2[Log Block]
    BlockNoMFA --> Log3[Log No MFA]
    
    Log1 --> End([End])
    Log2 --> End
    Log3 --> End
    Retry --> End
    
    style Start fill:#4ecdc4
    style Allow fill:#95e1d3
    style Block fill:#ff6b6b
    style MFA fill:#ffd93d
    style Aggregate fill:#a8e6cf
    style End fill:#4ecdc4
```

## Data Flow Diagram

```mermaid
flowchart LR
    subgraph Input
        I1[User Credentials]
        I2[GPS Location]
        I3[Keystroke Data]
        I4[Session Info]
    end
    
    subgraph Processing
        P1[Authentication<br/>Verification]
        P2[Risk Score<br/>Calculation]
        P3[Access Control<br/>Decision]
        P4[OTP Generation<br/>& Verification]
    end
    
    subgraph Storage
        S1[(User DB)]
        S2[(Access Logs)]
        S3[(Files DB)]
    end
    
    subgraph Output
        O1[JWT Token]
        O2[OTP Email]
        O3[Block Message]
        O4[Dashboard Access]
    end
    
    I1 --> P1
    I2 --> P2
    I3 --> P2
    I4 --> P2
    
    P1 --> P2
    P2 --> P3
    
    P3 -->|Low Risk| O1
    P3 -->|Medium Risk| P4
    P3 -->|High Risk| O3
    
    P4 --> O2
    P4 -->|Verified| O1
    
    O1 --> O4
    
    P1 --> S1
    P2 --> S2
    O4 --> S3
    
    style P2 fill:#ffebee
    style P3 fill:#e1f5ff
    style O1 fill:#95e1d3
    style O3 fill:#ff6b6b
```

## File Upload/Download Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant S3 as AWS S3
    participant DB as MongoDB

    rect rgb(200, 220, 255)
        Note over U,DB: File Upload Flow
        U->>F: Select file
        F->>B: POST /api/user/upload (multipart)
        B->>B: Validate file (multer)
        B->>S3: Upload to S3 bucket
        S3-->>B: S3 URL + Key
        B->>DB: Save file metadata
        DB-->>B: Success
        B-->>F: Upload complete
        F->>U: Show success message
    end

    rect rgb(255, 220, 200)
        Note over U,DB: File Download Flow
        U->>F: Click download
        F->>B: GET /api/user/files/:id/download
        B->>DB: Check file permissions
        DB-->>B: File metadata
        B->>S3: Get file from S3
        S3-->>B: File stream
        B-->>F: File blob with headers
        F->>F: Create download link
        F->>U: Browser downloads file
    end
```

## Admin Dashboard Architecture

```mermaid
graph TB
    subgraph "Admin Interface"
        A1[User Management]
        A2[Access Logs Viewer]
        A3[Unusual Time Config]
        A4[Feedback Management]
        A5[Statistics Dashboard]
    end
    
    subgraph "Admin API Endpoints"
        E1[GET /api/admin/users]
        E2[GET /api/admin/access-logs]
        E3[PUT /api/admin/block-user]
        E4[DELETE /api/admin/delete-user]
        E5[GET /api/admin/stats]
        E6[PUT /api/admin/unusual-time]
    end
    
    subgraph "Database Operations"
        D1[Query Users]
        D2[Query Logs]
        D3[Update User Status]
        D4[Delete User & Files]
        D5[Aggregate Stats]
        D6[Update Settings]
    end
    
    A1 --> E1
    A1 --> E3
    A1 --> E4
    A2 --> E2
    A3 --> E6
    A5 --> E5
    
    E1 --> D1
    E2 --> D2
    E3 --> D3
    E4 --> D4
    E5 --> D5
    E6 --> D6
    
    style A1 fill:#e3f2fd
    style A2 fill:#f3e5f5
    style A3 fill:#fff3e0
    style E1 fill:#c8e6c9
    style D1 fill:#ffccbc
```

## Technology Stack Diagram

```mermaid
graph LR
    subgraph "Frontend"
        F1[HTML5]
        F2[CSS3]
        F3[Vanilla JavaScript]
        F4[Leaflet.js]
    end
    
    subgraph "Backend"
        B1[Node.js 18+]
        B2[Express.js 4.x]
        B3[Mongoose ODM]
    end
    
    subgraph "Database"
        D1[MongoDB Atlas]
    end
    
    subgraph "Security"
        S1[bcryptjs]
        S2[jsonwebtoken]
        S3[helmet]
    end
    
    subgraph "External"
        E1[AWS S3]
        E2[Nodemailer]
        E3[GeoIP-Lite]
    end
    
    F1 --> B2
    F2 --> B2
    F3 --> B2
    F4 --> B2
    
    B1 --> B2
    B2 --> B3
    B3 --> D1
    
    B2 --> S1
    B2 --> S2
    B2 --> S3
    
    B2 --> E1
    B2 --> E2
    B2 --> E3
    
    style F1 fill:#e1f5ff
    style B2 fill:#fff3e0
    style D1 fill:#e8f5e9
    style S1 fill:#ffebee
    style E1 fill:#fff9c4
```
