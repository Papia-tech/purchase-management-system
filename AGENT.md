# INVENTO --- Purchase Management System

A simple, clean **MERN-stack Purchase Management System** for a
university DBMS lab project.

> **Project goal:** Build a small working website to manage suppliers,
> products, and purchase records. Keep the application
> beginner-friendly, lightweight, and easy to demonstrate. Do not turn
> it into a large ERP or inventory platform.

------------------------------------------------------------------------

## 1. Important instructions for the AI coding agent

Build the application according to this README and the supplied UI
reference screenshot.

### Main priorities

1.  Recreate the overall visual style of the reference screenshot.
2.  Keep the actual project scope limited to the Purchase Management
    System.
3.  Implement working CRUD operations connected to MongoDB.
4.  Keep the code understandable for beginner-level students.
5.  Use only the technologies and dependencies listed below unless
    something is genuinely necessary.
6.  Do not add features just to make the project look more complicated.
7.  Do not use static or hardcoded data as a substitute for database
    functionality. A few optional seed records are fine for
    demonstration.

### Important distinction

The reference screenshot is an **inventory dashboard used as a UI/design
reference**. Adapt its layout and visual style to our Purchase
Management System. Do not copy unrelated inventory/shipping features
that are outside our project scope.

------------------------------------------------------------------------

## 2. Project overview

**Project name:** INVENTO --- Purchase Management System

The website will help an administrator maintain basic purchase-related
information in one place.

The system will allow the administrator to:

-   View a small dashboard with summary cards.
-   Add, view, edit, and delete supplier records.
-   Add, view, edit, and delete product records.
-   Create purchase records.
-   View purchase history.
-   Automatically calculate the total amount of a purchase.
-   Increase the product's available quantity when a purchase is
    recorded.

This is a basic academic project, not a commercial enterprise resource
planning system.

------------------------------------------------------------------------

## 3. Technology stack

Use the MERN stack with a small number of supporting libraries.

  -----------------------------------------------------------------------
  Layer                   Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React.js                Build the user
                                                  interface

  Frontend tooling        Vite                    Run and build the React
                                                  application

  Styling                 Plain CSS               Layout, colours,
                                                  spacing, and responsive
                                                  design

  Routing                 React Router DOM        Navigate between pages

  HTTP requests           Axios                   Connect React to the
                                                  backend

  Backend                 Node.js                 Run server-side
                                                  JavaScript

  Backend framework       Express.js              Create REST API
                                                  endpoints

  Database                MongoDB Atlas           Store project data

  Database modelling      Mongoose                Define schemas and
                                                  interact with MongoDB

  Development             VS Code                 Code editor

  Version control         Git and GitHub          Share and manage group
                                                  code
  -----------------------------------------------------------------------

### Do not add these unless absolutely necessary

-   Tailwind CSS
-   Redux or other global state libraries
-   TypeScript
-   Socket.IO
-   Payment gateways
-   AI/ML libraries
-   Chart libraries
-   Microservices
-   Docker
-   Complex authentication systems

Use React state and basic CSS. A small amount of reusable components is
encouraged.

------------------------------------------------------------------------

## 4. UI and design requirements

Use the attached screenshot as the visual reference. The target should
feel like a clean, professional admin dashboard.

### Overall layout

Create a desktop-first dashboard with:

1.  A fixed dark sidebar on the left.
2.  A white top navigation bar.
3.  A light grey main content area.
4.  White content cards and tables.
5.  Simple borders, subtle shadows, and restrained rounded corners.

### Reference design characteristics

-   Dark charcoal/black sidebar.
-   White main workspace.
-   Light grey page background.
-   Black or dark charcoal buttons.
-   Neutral grey borders and table separators.
-   Clear typography and generous spacing.
-   Simple line icons.
-   A compact search field in the top bar.
-   A circular admin avatar/profile area.
-   A restrained, professional appearance.

Suggested colours:

  Element               Colour
  --------------------- -----------
  Sidebar               `#191919`
  Main background       `#F4F4F4`
  Cards and tables      `#FFFFFF`
  Primary text          `#202020`
  Secondary text        `#777777`
  Borders               `#E5E5E5`
  Primary buttons       `#171717`
  Active sidebar item   `#333333`

Use a clean sans-serif font such as Inter, or a system sans-serif font
if avoiding external font loading.

### Sidebar navigation

Use these project-specific menu items:

-   Dashboard
-   Suppliers
-   Products
-   Purchases
-   Reports

Do not add Inventory, Shipments, Warehouse, or unrelated modules as
separate functional sections. Product quantity can be displayed within
the Products page.

### Top navigation bar

Include:

-   Current page title.
-   A simple search input (search the currently relevant list if
    implemented).
-   Admin label/avatar.
-   Optional light/dark toggle only if it is easy to implement;
    otherwise omit it.

### UI behaviour

-   Sidebar highlights the active page.
-   Tables should have clear column headings.
-   Add and Edit should open a simple modal or form.
-   Delete should ask for confirmation.
-   Forms should show basic validation messages.
-   Show a clear empty state when a table has no records.
-   Show a simple success/error message after an operation.
-   Make the layout usable on a laptop screen and reasonably responsive
    on smaller screens.

Do not reproduce the screenshot's unrelated inventory data or exact
labels. Use Purchase Management System content.

------------------------------------------------------------------------

## 5. Website pages and features

Build only the following five pages. The Reports page can be very basic.

### A. Dashboard

Display summary cards:

-   Total Suppliers
-   Total Products
-   Total Purchases

Also display a small **Recent Purchases** table with the latest purchase
records.

Dashboard values must be calculated from MongoDB data through the
backend API. Do not hardcode the statistics.

### B. Suppliers

Create a supplier management page.

Supplier fields:

-   Supplier Name
-   Email
-   Phone
-   Address

Required operations:

-   Add supplier
-   View suppliers
-   Edit supplier
-   Delete supplier

Display suppliers in a clean table.

Suggested table columns:

  Supplier ID   Supplier Name   Email   Phone   Address   Actions
  ------------- --------------- ------- ------- --------- ---------

### C. Products

Create a basic product management page.

Product fields:

-   Product Name
-   Category
-   Price
-   Available Quantity

Required operations:

-   Add product
-   View products
-   Edit product
-   Delete product

Display products in a clean table.

Suggested table columns:

  Product ID   Product Name   Category   Quantity   Price   Actions
  ------------ -------------- ---------- ---------- ------- ---------

The quantity field represents the currently available stock. It is
included because a purchase should update the quantity.

### D. Purchases

Create a purchase management page.

For simplicity, **one purchase record contains one product**. Do not
build a shopping cart or multi-product purchase workflow.

Purchase form fields:

-   Supplier --- dropdown populated from suppliers in MongoDB.
-   Product --- dropdown populated from products in MongoDB.
-   Quantity --- numeric input.
-   Unit Price --- use the selected product's price as the default;
    allow editing only if needed.
-   Total Amount --- calculate automatically.
-   Purchase Date --- date input.

Formula:

`Total Amount = Quantity × Unit Price`

Required operations:

-   Create a purchase record.
-   View purchase history.

When a purchase is successfully created, increase the selected product's
available quantity by the purchased quantity.

Example:

-   Existing product quantity: 10
-   Purchased quantity: 5
-   Updated product quantity: 15

Do not update stock if the purchase creation fails.

Suggested purchase history columns:

  ----------------------------------------------------------------------------
  Purchase   Date       Supplier   Product    Quantity   Unit Price Total
  ID                                                                
  ---------- ---------- ---------- ---------- ---------- ---------- ----------

  ----------------------------------------------------------------------------

### E. Reports

Keep this page very simple. Display:

-   Total number of purchases.
-   Total purchase expenditure.
-   A basic purchase history or summary table.

Do not create advanced charts or complex analytics. Simple cards and a
table are sufficient.

------------------------------------------------------------------------

## 6. Database design

Use only **three MongoDB collections**.

### Collection 1: suppliers

Mongoose model: `Supplier`

``` js
{
  name: String,
  email: String,
  phone: String,
  address: String
}
```

### Collection 2: products

Mongoose model: `Product`

``` js
{
  name: String,
  category: String,
  price: Number,
  quantity: Number
}
```

### Collection 3: purchases

Mongoose model: `Purchase`

``` js
{
  supplierId: ObjectId,
  productId: ObjectId,
  quantity: Number,
  unitPrice: Number,
  totalAmount: Number,
  purchaseDate: Date
}
```

Use Mongoose references for `supplierId` and `productId`.

Mongoose should automatically create the MongoDB `_id` field. Do not
create a separate manual ID system unless needed for display.

### Basic validation

-   Required text fields must not be empty.
-   Email should have basic email validation.
-   Price must be a positive number.
-   Quantity must be a positive whole number.
-   Purchase must reference an existing supplier and product.
-   Calculate total amount on the backend as well as displaying it on
    the frontend. Do not trust a total sent only by the browser.

------------------------------------------------------------------------

## 7. Backend API requirements

Use simple REST APIs.

### Suppliers

  Method   Endpoint               Purpose
  -------- ---------------------- -------------------
  GET      `/api/suppliers`       Get all suppliers
  GET      `/api/suppliers/:id`   Get one supplier
  POST     `/api/suppliers`       Add supplier
  PUT      `/api/suppliers/:id`   Update supplier
  DELETE   `/api/suppliers/:id`   Delete supplier

### Products

  Method   Endpoint              Purpose
  -------- --------------------- ------------------
  GET      `/api/products`       Get all products
  GET      `/api/products/:id`   Get one product
  POST     `/api/products`       Add product
  PUT      `/api/products/:id`   Update product
  DELETE   `/api/products/:id`   Delete product

### Purchases

  Method   Endpoint           Purpose
  -------- ------------------ --------------------------
  GET      `/api/purchases`   Get purchase history
  POST     `/api/purchases`   Create a purchase record

### Dashboard

  Method   Endpoint           Purpose
  -------- ------------------ --------------------------------------------
  GET      `/api/dashboard`   Get dashboard summary and recent purchases

Use appropriate HTTP status codes and return understandable JSON error
messages.

### Purchase creation logic

When `POST /api/purchases` is called:

1.  Validate the supplier and product IDs.
2.  Find the supplier and product in MongoDB.
3.  Validate the quantity and unit price.
4.  Calculate `totalAmount = quantity * unitPrice` on the server.
5.  Create the purchase record.
6.  Increase the product quantity by the purchased quantity.
7.  Return the created purchase and updated product information.

Use a MongoDB transaction if the configured MongoDB deployment supports
it. If transactions are not available, implement safe error handling so
a failed operation does not silently leave inconsistent purchase and
stock data.

------------------------------------------------------------------------

## 8. Suggested project folder structure

Keep the structure simple and understandable.

``` text
purchase-management-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Purchases.jsx
│   │   │   └── Reports.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── Supplier.js
│   │   ├── Product.js
│   │   └── Purchase.js
│   │
│   ├── routes/
│   │   ├── supplierRoutes.js
│   │   ├── productRoutes.js
│   │   └── purchaseRoutes.js
│   │
│   ├── controllers/
│   │   ├── supplierController.js
│   │   ├── productController.js
│   │   └── purchaseController.js
│   │
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

The AI coding agent may adjust this structure slightly if it improves
clarity, but should not over-engineer it.

------------------------------------------------------------------------

## 9. Environment variables and security

Keep database credentials out of source code.

Backend `.env` example:

``` env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Frontend `.env` example, if needed:

``` env
VITE_API_URL=http://localhost:5000/api
```

Add `.env` to `.gitignore`. Commit an `.env.example` containing
placeholder values, never real credentials.

For this basic academic version, a login system is not required unless
the project guide specifically asks for it. Do not invent authentication
requirements.

------------------------------------------------------------------------

## 10. Basic testing checklist

Before considering the project complete, verify:

### Suppliers

-   [ ] Add a supplier.
-   [ ] Display supplier list.
-   [ ] Edit supplier details.
-   [ ] Delete a supplier.

### Products

-   [ ] Add a product.
-   [ ] Display product list.
-   [ ] Edit product details.
-   [ ] Delete a product.

### Purchases

-   [ ] Select an existing supplier.
-   [ ] Select an existing product.
-   [ ] Enter purchase quantity.
-   [ ] Check automatic total calculation.
-   [ ] Save purchase.
-   [ ] Verify purchase history.
-   [ ] Verify that product quantity increases.

### Dashboard and reports

-   [ ] Dashboard counts match database records.
-   [ ] Recent purchases display correctly.
-   [ ] Total purchase expenditure is correct.

### General

-   [ ] Frontend and backend both start successfully.
-   [ ] MongoDB connection works.
-   [ ] Forms validate required fields.
-   [ ] Errors are displayed clearly.
-   [ ] No important buttons are decorative or non-functional.

------------------------------------------------------------------------

## 11. Academic presentation and project report support

The application should be easy to explain during a DBMS lab
demonstration.

The implementation should clearly demonstrate:

-   MongoDB collections and documents.
-   Mongoose schemas.
-   ObjectId references between collections.
-   CRUD operations.
-   REST API communication.
-   React frontend communicating with Express backend.
-   Purchase total calculation.
-   Updating product quantity after a purchase.

The project team will prepare the PowerPoint and spiral report
separately. The coding agent should make the application easy to
document by keeping the code organized and using clear names.

### Suggested demonstration order

1.  Open the dashboard.
2.  Add a supplier.
3.  Add a product.
4.  Create a purchase using that supplier and product.
5.  Show the calculated total.
6.  Show the new purchase in purchase history.
7.  Open Products and demonstrate the updated quantity.
8.  Show the dashboard and reports.

Use real screenshots from the completed application in the report and
presentation. Do not claim that an unimplemented feature exists.

------------------------------------------------------------------------

## 12. Development approach

Build in this order:

1.  Set up the React frontend and Express backend.
2.  Connect the backend to MongoDB.
3.  Create the three Mongoose models.
4.  Implement supplier CRUD APIs.
5.  Implement product CRUD APIs.
6.  Implement purchase creation and history APIs.
7.  Build the shared dashboard layout and pages.
8.  Connect the frontend to the APIs using Axios.
9.  Implement dashboard statistics and basic reports.
10. Test the complete application.

Work incrementally. Run and test the application after each major module
rather than generating the entire project and discovering all errors at
the end.

------------------------------------------------------------------------

## 13. Final scope boundaries

### Must have

-   Clean admin dashboard UI inspired by the supplied screenshot.
-   Suppliers CRUD.
-   Products CRUD.
-   Purchase creation.
-   Purchase history.
-   Automatic purchase total.
-   Automatic product quantity update.
-   MongoDB database integration.

### Nice to have only if time permits

-   Search and simple filters.
-   A basic confirmation modal.
-   A small recent-purchases section.
-   A few sample database records for demonstration.

### Do not build

-   Sales management.
-   Shipment tracking.
-   Employee management.
-   Payroll.
-   Payment gateway.
-   Shopping cart.
-   Multi-product purchase orders.
-   AI chatbot or AI recommendations.
-   Advanced analytics.
-   Complex user roles and permissions.
-   Unnecessary animations or complicated UI effects.

------------------------------------------------------------------------

## 14. Definition of completion

The project is complete when:

1.  The React website opens and navigation works.
2.  The Express server connects to MongoDB.
3.  Supplier and product CRUD operations work with MongoDB.
4.  A user can create and view purchase records.
5.  Purchase totals are calculated correctly.
6.  Product quantity increases after a successful purchase.
7.  Dashboard figures are based on actual database data.
8.  The application can be demonstrated on the group's laptop.

**Final instruction:** Prioritize a small, fully working Purchase
Management System over a large, unfinished application. Keep the design
close to the supplied INVENTO reference screenshot, but keep the
functionality limited to the requirements in this README.
