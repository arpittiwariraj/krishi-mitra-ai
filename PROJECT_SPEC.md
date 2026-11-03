# MASTER DEVELOPMENT PROMPT
# KRISHI MITRA AI – COMPLETE FULL-STACK DEVELOPMENT FROM SCRATCH

You are a senior full-stack software engineer, Python backend developer, React developer, AI integration engineer, database architect and UI/UX designer.

Your task is to BUILD a complete, functional, professional agricultural AI platform called:

# KRISHI MITRA AI
### Your Smart Farming Companion

This is a real software development project, not just a UI design, prototype, static website or architecture illustration.

Build the project from scratch with working frontend, backend, database, external API integrations, AI functionality and complete user workflows.

Do not stop after creating a plan or showing sample code. Create the actual project files, implement the features, connect the components, run the application and fix errors.

==================================================
1. PROJECT OBJECTIVE
==================================================

Krishi Mitra AI is an AI-powered Farmer Query Support and Agricultural Advisory System designed specifically for Indian farmers.

The platform should help farmers with four major problems:

1. Identifying crop diseases through uploaded leaf photographs.
2. Making farming decisions based on weather conditions.
3. Finding suitable nearby agricultural markets with better potential selling returns.
4. Discovering relevant government agricultural schemes.

The system must be accessible to farmers with limited technical knowledge.

The interface must support Hindi and English.

The platform should be mobile-first, simple, fast, accessible and scalable.

==================================================
2. STRICT TECHNOLOGY STACK
==================================================

Use ONLY the following primary technologies.

FRONTEND:
- React.js
- JavaScript (not TypeScript)
- Tailwind CSS
- Recharts
- Leaflet
- OpenStreetMap

BACKEND:
- Python
- FastAPI
- REST API architecture
- JSON responses

AI:
- OpenAI Multimodal API
- Image input capability
- Structured JSON output

DATABASE:
- PostgreSQL

EXTERNAL APIS:
- OpenWeather API
- AGMARKNET / data.gov.in
- Official government scheme sources
- myScheme

FUTURE TECHNOLOGIES:
- Copernicus Data Space Ecosystem
- Sentinel-2
- NDVI processing
- Two-way SMS gateway
- FastAPI webhooks

Do not replace React with Next.js.
Do not replace FastAPI with Node.js or Express.
Do not replace PostgreSQL with Firebase or MongoDB.
Do not introduce unnecessary technologies or complicated microservices.

Use Vite as the React development/build tool.

Keep the application in a clean frontend/backend architecture.

==================================================
3. PROJECT FOLDER STRUCTURE
==================================================

Create the following project structure:

krishi-mitra-ai/

    frontend/
        public/
        src/
            assets/
            components/
                Navbar.jsx
                Footer.jsx
                Sidebar.jsx
                WeatherCard.jsx
                FeatureCard.jsx
                LoadingSpinner.jsx
                ErrorMessage.jsx
                LanguageSwitcher.jsx
            pages/
                Home.jsx
                Dashboard.jsx
                DiseaseDetection.jsx
                WeatherAdvisory.jsx
                MarketAnalysis.jsx
                GovernmentSchemes.jsx
                FarmerProfile.jsx
                About.jsx
            services/
                api.js
                diseaseService.js
                weatherService.js
                marketService.js
                schemeService.js
            context/
                LanguageContext.jsx
                AuthContext.jsx
            hooks/
            utils/
            App.jsx
            main.jsx
            index.css
        package.json
        vite.config.js

    backend/
        app/
            main.py
            config.py
            database.py

            models/
                farmer.py
                diagnosis.py
                advisory.py
                market.py
                scheme.py

            schemas/
                farmer.py
                disease.py
                weather.py
                market.py
                scheme.py

            routes/
                auth.py
                disease.py
                weather.py
                market.py
                schemes.py
                farmer.py

            services/
                openai_service.py
                disease_service.py
                weather_service.py
                market_service.py
                scheme_service.py

            knowledge_base/
                disease_information.json
                government_schemes.json

            utils/
                image_validation.py
                market_calculator.py
                language_utils.py

        requirements.txt
        .env.example

    README.md
    .gitignore

You may add additional files if necessary, but maintain this architecture.

==================================================
4. FRONTEND DEVELOPMENT
==================================================

Build a professional, modern agricultural technology website.

DESIGN DIRECTION:

Use:
- Dark agricultural green.
- Fresh green.
- White.
- Light earthy backgrounds.
- Subtle blue for weather.
- Clean typography.
- Rounded cards.
- Professional icons.
- Subtle transitions.

Avoid:
- Excessive gradients.
- Overcrowded dashboards.
- Fake testimonials.
- Fake government approvals.
- Unnecessary animations.
- Complicated navigation.

The application should feel like a real agricultural technology product.

A. LANDING PAGE

Create a professional homepage.

Include:

Navbar:
- Krishi Mitra AI logo.
- Home.
- Features.
- About.
- Contact.
- Login / Dashboard.
- Hindi / English switcher.

Hero section:

Heading:
"Smart Farming Starts With Smart Decisions."

Description:
"Your AI-powered farming companion for crop health, weather intelligence, market insights and government schemes."

Buttons:
- Get Started.
- Explore Features.

Add an attractive agricultural hero illustration or image.

Feature section:
1. AI Crop Disease Detection.
2. Weather Advisory.
3. Smart Market Analysis.
4. Government Scheme Finder.

Additional sections:
- How It Works.
- Why Krishi Mitra?
- Our Technology.
- Future Vision.
- Footer.

B. FARMER DASHBOARD

Build a complete dashboard.

Display:
- Welcome message.
- Farmer name.
- Selected district and state.
- Current weather.
- Four feature cards.
- Recent crop diagnosis.
- Weather alerts.
- Market price summary.
- Recommended government schemes.
- Recent activity.

Use a sidebar on desktop and mobile-friendly bottom navigation or collapsible navigation on smaller screens.

C. LANGUAGE SUPPORT

Implement functional Hindi and English language switching.

All major navigation labels, buttons, headings, form labels and farmer-facing descriptions should change according to the selected language.

Store the language preference locally.

Do not translate technical API fields or database keys.

==================================================
5. MODULE 1 – MULTIMODAL AI CROP DISEASE DETECTION
==================================================

This is the primary AI feature.

IMPORTANT:
Use OpenAI Multimodal API for image understanding.

Do not implement a PlantVillage CNN as the primary disease classifier.

Do not train a separate CNN model.

OBJECTIVE:

A farmer should be able to upload a leaf photograph and receive an AI-assisted crop disease assessment with understandable recommendations.

FRONTEND REQUIREMENTS:

Create DiseaseDetection.jsx.

Include:
- Upload image.
- Camera capture using mobile device.
- Drag-and-drop image upload.
- Image preview.
- Remove image button.
- Crop selection (optional).
- Location input (optional).
- Language selection.
- Analyse Image button.
- Loading animation.
- Results dashboard.
- Download report option.

SUPPORTED IMAGE TYPES:
- JPG.
- JPEG.
- PNG.
- WEBP.

Validate file size and image format before upload.

BACKEND REQUIREMENTS:

Create the endpoint:

POST /api/disease/analyze

Accept:
- Image file.
- Optional crop name.
- Optional location.
- Preferred language.

Backend workflow:

1. Receive uploaded image.
2. Validate image format and size.
3. Reject invalid or corrupted images.
4. Prepare the image for the OpenAI multimodal API.
5. Send the image with a carefully designed diagnostic prompt.
6. Receive structured AI output.
7. Validate the response.
8. Retrieve relevant information from the agricultural knowledge base.
9. Generate the farmer-friendly report.
10. Return the result as JSON.

OPENAI MULTIMODAL INTEGRATION:

Create openai_service.py.

Use the official OpenAI Python SDK.

Read the API key from environment variables.

Never expose the API key in frontend JavaScript.

Use an image-capable model configured through an environment variable.

The multimodal AI should examine:

- Crop identification.
- Leaf colour.
- Spots.
- Lesions.
- Yellowing.
- Drying.
- Visible damage.
- Texture changes.
- Image suitability.

AI RESPONSE STRUCTURE:

{
    "crop_name": "Tomato",
    "possible_disease": "Early Blight",
    "diagnostic_status": "Possible match",
    "certainty_level": "Moderate",
    "confidence_score": null,
    "image_quality": "Good",
    "visual_observations": [],
    "alternative_possibilities": [],
    "symptoms": [],
    "possible_causes": [],
    "recommended_actions": [],
    "prevention": [],
    "expert_consultation": true,
    "disclaimer": ""
}

IMPORTANT ACCURACY RULES:

- Do not fabricate numerical confidence scores.
- Do not treat LLM certainty as measured diagnostic accuracy.
- Distinguish possible disease from confirmed diagnosis.
- Show alternative possibilities where appropriate.
- If the image is unclear, ask for a better photograph.
- If the crop is unsupported, communicate the limitation.
- Never invent pesticide dosages.
- Use only relevant verified agricultural information.
- Recommend consultation with an agricultural expert when necessary.

DISEASE KNOWLEDGE BASE:

Create disease_information.json.

Structure it to support:
- Crop name.
- Disease name.
- Symptoms.
- Possible causes.
- Prevention.
- Verified treatment guidance.
- Reference source.
- Last verified date.

The backend should retrieve matching knowledge before presenting treatment recommendations.

OPENAI SHOULD NOT BE ALLOWED TO INVENT AGRICULTURAL FACTS.

DISPLAY RESULTS:

Create an attractive diagnosis report showing:

- Crop name.
- Possible disease.
- Diagnostic certainty.
- Image quality.
- Symptoms.
- Possible causes.
- Recommended actions.
- Prevention.
- Expert consultation warning.

Clearly display that AI results are advisory and not a guaranteed laboratory diagnosis.

==================================================
6. MODULE 2 – WEATHER ADVISORY
==================================================

Create WeatherAdvisory.jsx and weather_service.py.

Integrate OpenWeather API.

Use:
- Current weather endpoint.
- Forecast endpoint.

FRONTEND:

Display:
- Location.
- Temperature.
- Weather condition.
- Humidity.
- Wind speed.
- Rainfall probability.
- Weather forecast.
- Agricultural alerts.
- Crop-specific recommendations.

Allow the farmer to select:
- State.
- District.
- Crop.
- Crop growth stage, where known.

BACKEND:

Create:

GET /api/weather/current

GET /api/weather/forecast

POST /api/weather/advisory

WORKFLOW:

Farmer selects location.
Frontend sends location to FastAPI.
Backend obtains coordinates or accepts validated coordinates.
Backend requests OpenWeather information.
Weather data is processed.
Agricultural rule engine evaluates conditions.
OpenAI explains the recommendations in simple language.
Frontend displays the advisory.

ADVISORY RULES:

Examples:

Heavy rainfall forecast:
- Delay irrigation.
- Check drainage.

High temperature:
- Monitor soil moisture.
- Watch for heat stress.

High humidity:
- Monitor possible fungal disease conditions.

Strong wind:
- Avoid spraying when wind conditions are unsuitable.

Use actual forecast data.

Do not fabricate weather information.

Clearly show the forecast timestamp.

Cache weather data briefly to reduce unnecessary API requests.

==================================================
7. MODULE 3 – AGRICULTURAL MARKET PRICE ANALYSIS
==================================================

Create MarketAnalysis.jsx and market_service.py.

OBJECTIVE:

Help farmers compare agricultural market prices across approximately three or four nearby cities or mandis.

DATA SOURCES:

- AGMARKNET.
- data.gov.in.
- Official available agricultural market data endpoints.

BACKEND:

Create:

GET /api/market/crops

GET /api/market/prices

POST /api/market/compare

ACCEPT:
- Crop.
- State.
- District.
- Optional location coordinates.

FETCH:
- Market name.
- Commodity.
- Variety where available.
- Minimum price.
- Maximum price.
- Modal price.
- Arrival quantity where available.
- Price date.

FILTER:
- Selected crop.
- Nearby locations.
- Valid records.
- Latest available records.

DISPLAY:

Create four market comparison cards.

Each card should contain:
- Mandi name.
- City.
- Distance where available.
- Minimum price.
- Maximum price.
- Modal price.
- Data date.

Use ₹/quintal when that is the source unit.

MAP INTEGRATION:

Use Leaflet and OpenStreetMap.

Display the locations of the compared markets.

MARKET RECOMMENDATION ALGORITHM:

Do not simply select the market with the highest modal price.

Calculate:

Net Return = Expected Selling Value - Estimated Transport Cost.

Allow transport cost per kilometre to be configurable.

If transport cost is unknown, do not invent it.

Show:
- Highest modal price.
- Estimated net return when sufficient information is available.
- Recommended market.
- Reason for recommendation.

DATA VALIDATION:

- Never fabricate live prices.
- Clearly label demonstration data.
- Show source and last update date.
- Handle missing market records.
- Handle API failure gracefully.

IMPORTANT:

Do not assume an API endpoint or response format without checking its documentation or actual response.

Implement a separate market data service so the data provider can be changed without rewriting the frontend.

==================================================
8. MODULE 4 – GOVERNMENT SCHEME FINDER
==================================================

Create GovernmentSchemes.jsx and scheme_service.py.

OBJECTIVE:

Make government agricultural schemes easier for farmers to discover.

DATA SOURCES:

- myScheme.
- Official government websites.
- Ministry of Agriculture.
- State agricultural departments.
- Verified government scheme publications.

Do not assume myScheme provides a freely accessible public API.

If no usable official API is available, use a structured curated database populated with verified official scheme information.

CREATE government_schemes.json.

FIELDS:

- Scheme ID.
- Scheme name.
- Description.
- Government department.
- State applicability.
- Eligibility.
- Benefits.
- Required documents.
- Application procedure.
- Official application URL.
- Source URL.
- Last verified date.

FRONTEND:

Create:
- Scheme search.
- State filter.
- District filter.
- Farmer category filter.
- Landholding filter.
- Crop filter.
- Scheme cards.
- Scheme details page.

BACKEND:

Create:

GET /api/schemes

GET /api/schemes/{scheme_id}

POST /api/schemes/recommend

ELIGIBILITY ENGINE:

Collect relevant farmer details.

Match those details with scheme eligibility rules.

Show potentially relevant schemes.

Do not claim that the farmer is officially approved or guaranteed eligible.

Display official application links.

Clearly show the last verified date.

==================================================
9. DATABASE DEVELOPMENT
==================================================

Use PostgreSQL.

Create the database schema and connection.

Use SQLAlchemy for database operations.

Create tables for:

1. Farmers
- id
- full_name
- email
- password_hash
- phone
- state
- district
- preferred_language
- created_at

2. FarmerProfiles
- id
- farmer_id
- primary_crop
- land_size
- land_unit
- irrigation_type
- created_at

3. DiseaseReports
- id
- farmer_id
- crop_name
- possible_disease
- certainty_level
- visual_observations
- recommendations
- created_at

4. WeatherAdvisories
- id
- farmer_id
- location
- crop_name
- weather_summary
- advisory
- created_at

5. MarketSearches
- id
- farmer_id
- crop_name
- location
- selected_market
- market_data_date
- created_at

6. SavedSchemes
- id
- farmer_id
- scheme_id
- saved_at

Use appropriate foreign keys and indexes.

Do not store uploaded images permanently unless required.

If diagnosis history is saved, store only necessary information and protect farmer privacy.

Use environment variables for database credentials.

==================================================
10. AUTHENTICATION AND SECURITY
==================================================

Implement basic secure authentication.

Requirements:

- Farmer registration.
- Login.
- Logout.
- Password hashing.
- Protected dashboard routes.
- JWT-based authentication.
- Input validation.
- CORS configuration.
- Secure API key handling.
- File upload validation.
- API error handling.
- Rate limiting where practical.
- No hardcoded secrets.

Create .env.example containing placeholders only.

Example:

DATABASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENWEATHER_API_KEY=
DATA_GOV_IN_API_KEY=
JWT_SECRET_KEY=
FRONTEND_URL=

Never commit the real .env file to GitHub.

==================================================
11. API COMMUNICATION
==================================================

Use REST APIs.

All frontend requests should go through a central API service.

Use a consistent response structure.

SUCCESS RESPONSE:

{
    "success": true,
    "message": "Request completed successfully",
    "data": {}
}

ERROR RESPONSE:

{
    "success": false,
    "message": "Unable to process request",
    "error_code": "SERVICE_UNAVAILABLE"
}

Use suitable HTTP status codes.

Create a FastAPI health endpoint:

GET /api/health

It should show:
- Backend status.
- Database connection status.
- External service configuration status.

Do not expose API keys or sensitive system information.

==================================================
12. USER EXPERIENCE AND ERROR HANDLING
==================================================

Every module must support:

- Loading state.
- Success state.
- Error state.
- Empty state.
- Retry option.
- Input validation.

Examples:

If OpenAI API is unavailable:
Show a friendly error and retry option.

If OpenWeather API fails:
Show that weather information is temporarily unavailable.

If market API returns no data:
Show that no recent market records were found.

If the disease image is invalid:
Ask the farmer to upload another image.

Never display fake successful API results.

==================================================
13. IMPLEMENTATION PHASES
==================================================

Build the application in the following order.

PHASE 1 – PROJECT INITIALIZATION

- Create frontend.
- Create backend.
- Install dependencies.
- Create folder structure.
- Configure Tailwind.
- Configure FastAPI.
- Configure PostgreSQL.
- Create environment configuration.
- Verify frontend/backend connection.

PHASE 2 – UI DEVELOPMENT

- Landing page.
- Navbar.
- Footer.
- Dashboard.
- Sidebar.
- Feature cards.
- Responsive layout.
- Hindi/English language switching.

PHASE 3 – DISEASE DETECTION

- Image upload.
- Image validation.
- OpenAI integration.
- Multimodal image analysis.
- Knowledge base lookup.
- Structured report.
- Diagnosis history.

PHASE 4 – WEATHER

- OpenWeather integration.
- Current weather.
- Forecast.
- Agricultural rules.
- Advisory generation.

PHASE 5 – MARKET

- AGMARKNET/data.gov.in integration.
- Crop filters.
- Location filters.
- Market comparison.
- Map integration.
- Net-return calculator.

PHASE 6 – GOVERNMENT SCHEMES

- Scheme database.
- Search.
- Filters.
- Eligibility matching.
- Scheme details.
- Official links.

PHASE 7 – DATABASE AND AUTHENTICATION

- PostgreSQL tables.
- Registration.
- Login.
- JWT.
- Farmer profile.
- Saved reports.

PHASE 8 – INTEGRATION AND TESTING

- Connect all modules.
- Test API requests.
- Test database operations.
- Test invalid inputs.
- Test API failures.
- Fix all errors.
- Verify responsive design.

PHASE 9 – FINAL PRESENTATION PREPARATION

- Prepare demo farmer account.
- Prepare sample crop image.
- Prepare demonstration scenarios.
- Prepare architecture diagram.
- Prepare working feature demonstration.
- Prepare judges' technical explanation.

==================================================
14. TESTING REQUIREMENTS
==================================================

Test the following:

FRONTEND:
- All pages load.
- Navigation works.
- Mobile layout works.
- Language switch works.
- Forms validate.
- Images preview correctly.

BACKEND:
- FastAPI starts.
- Database connects.
- Endpoints return valid responses.
- Invalid requests are rejected.
- Errors are handled correctly.

AI:
- Valid image reaches OpenAI.
- Structured response is validated.
- Invalid image is rejected.
- Missing API key is handled.
- Low-certainty diagnosis is displayed appropriately.

WEATHER:
- Valid location returns weather.
- API failure is handled.
- Forecast is displayed correctly.

MARKET:
- Crop filtering works.
- Location filtering works.
- Price units are correct.
- Missing records are handled.
- No fabricated live data is shown.

SCHEMES:
- Search works.
- Filters work.
- Official source links work.
- Eligibility information is displayed correctly.

==================================================
15. README AND DOCUMENTATION
==================================================

Create a complete README.md.

Include:

- Project introduction.
- Features.
- Technology stack.
- Architecture.
- Folder structure.
- Installation requirements.
- Frontend setup.
- Backend setup.
- PostgreSQL setup.
- Environment variables.
- OpenAI API setup.
- OpenWeather API setup.
- data.gov.in API setup.
- How to run frontend.
- How to run backend.
- API endpoint documentation.
- Troubleshooting.
- Current limitations.
- Future scope.

Include exact terminal commands.

==================================================
16. FUTURE SCOPE – DO NOT IMPLEMENT IN INITIAL MVP
==================================================

Keep these as clearly separated future development modules.

A. SMS-BASED FARMER ASSISTANCE

Architecture:

Keypad phone
→ SMS-enabled service number
→ SMS gateway
→ FastAPI webhook
→ Query processing
→ Agricultural knowledge base
→ AI-generated response
→ SMS gateway
→ Farmer receives reply.

Plan for:
- Hindi SMS queries.
- Crop disease questions.
- Weather questions.
- Market price queries.
- Scheme information.

A toll-free voice helpline should be treated separately from two-way SMS.

B. SATELLITE-BASED CROP HEALTH MONITORING

Use:
- Copernicus Data Space Ecosystem.
- Sentinel-2 Level-2A.
- B04 Red band.
- B08 Near Infrared band.
- Cloud masking.
- NDVI calculation.
- Historical comparison.
- GIS visualization.
- 3D terrain overlay.

NDVI:

NDVI = (NIR - RED) / (NIR + RED)

Architecture:

Farm boundary
→ Copernicus API
→ Sentinel-2 imagery
→ Cloud masking
→ NDVI calculation
→ Vegetation visualization
→ Historical comparison
→ Field advisory.

Do not implement these modules in the initial MVP.

==================================================
17. DEVELOPMENT RULES – VERY IMPORTANT
==================================================

1. Build actual working code, not just design mockups.
2. Do not skip backend development.
3. Do not use fake API responses as real data.
4. Do not hardcode API keys.
5. Do not expose secrets in frontend code.
6. Do not create non-functional buttons.
7. Do not leave important features as TODO comments.
8. Do not use random placeholder content for real farmer recommendations.
9. Do not invent disease confidence percentages.
10. Do not claim an API is integrated until it has been tested.
11. Keep code modular and readable.
12. Reuse components and services.
13. Use clear variable and function names.
14. Handle all errors properly.
15. Maintain a consistent UI design.
16. Keep the project easy to understand and demonstrate.
17. Use official API documentation when implementing integrations.
18. If credentials are missing, build the integration properly and explain which environment variable is required.
19. If an external API has access restrictions, document the limitation and provide a clearly labelled demonstration mode.
20. Never silently substitute demonstration data for live API data.

Do not generate the entire project as one massive source file.

Create separate, organized files.

Do not stop after the first phase.

Complete each phase, test it and continue to the next phase.

==================================================
18. FINAL ACCEPTANCE CRITERIA
==================================================

The project is complete only when:

- React frontend runs successfully.
- FastAPI backend runs successfully.
- PostgreSQL database connects.
- Landing page works.
- Farmer dashboard works.
- Hindi/English switching works.
- Crop image uploads work.
- OpenAI multimodal analysis works with a valid API key.
- Disease report is generated.
- Weather API integration works with valid credentials.
- Market integration works with a configured data source.
- Market comparison works.
- Government scheme search works using verified records.
- Farmer registration and login work.
- Frontend and backend communicate correctly.
- Errors are handled properly.
- Mobile responsiveness works.
- README contains setup instructions.

At the end, provide:

1. Completed project folder structure.
2. List of implemented features.
3. List of APIs successfully integrated.
4. List of API credentials still required.
5. Exact commands to run the application.
6. Known limitations.
7. Testing results.
8. Suggested next development steps.

FINAL INSTRUCTION:

Start by inspecting the current working directory.

If it is empty, initialize the project from scratch.

If files already exist, inspect them before modifying anything.

Then begin PHASE 1.

Do not merely explain how to build Krishi Mitra AI.

BUILD IT.

Your objective is to deliver a working, clean, professional and demonstrable full-stack agricultural AI application.
