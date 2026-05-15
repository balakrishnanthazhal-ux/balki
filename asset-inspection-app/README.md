# Asset Inspection App - Angular

## Project Structure
```
asset-inspection-app/
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.css
│   │   ├── inspection-form/
│   │   │   ├── inspection-form.component.ts
│   │   │   ├── inspection-form.component.html
│   │   │   └── inspection-form.component.css
│   │   ├── models/
│   │   │   └── inspection.model.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
├── tsconfig.json
└── tsconfig.app.json
```

## Setup & Run

### Prerequisites
- Node.js 18+ 
- npm

### Steps

```bash
# 1. Install Angular CLI globally
npm install -g @angular/cli

# 2. Navigate to project
cd asset-inspection-app

# 3. Install dependencies
npm install

# 4. Run development server
ng serve

# 5. Open browser at:
# http://localhost:4200
```

## Demo Login Credentials

| Username   | Password     | Role      |
|-----------|--------------|-----------|
| admin      | admin123     | Admin     |
| inspector  | inspect123   | Inspector |
| sekar      | sekar123     | Engineer  |

## Features

### 1. Login Page
- Secure login with username/password
- Session-based authentication
- Animated futuristic UI

### 2. Inspection Form
- **Date & Time** - Auto-filled with current datetime, editable
- **Project Name** - Text input (required)
- **Asset Name** - Text input (required)  
- **Remark** - Textarea for notes
- **Progress %** - Interactive slider (0-100%) with color indicators
- **Place** - GPS + Photo capture

### 3. Place Feature (GPS + Photo)
- Click "PLACE CAPTURE" button
- Automatically gets GPS coordinates
- Reverse geocodes to address (via OpenStreetMap)
- Opens live camera (back camera preferred)
- GPS data watermarked ON the photo
- Photo preview → Confirm or Retake
- Captured photo downloadable
- Map link opens in browser

## Browser Permissions Required
- Location (GPS)
- Camera

## Notes
- GPS works best on mobile/device with GPS hardware
- HTTPS required for GPS+Camera in production
- For development, localhost works fine

## Production Build
```bash
ng build --configuration production
# Output in: dist/asset-inspection-app/
```
"# bala-" 
"# asset-inspection-app" 
