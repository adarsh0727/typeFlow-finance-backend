# Typeflow Finance - Backend

A comprehensive financial management web application backend built with Node.js and Express.js. This backend provides robust APIs for managing financial data, transactions, categories, reports, and user authentication using OCR capabilities for document processing.

## 🏗️ Project Structure

```
backend/
├── controllers/           # Request handlers and business logic
│   ├── category.controller.js    # Category management operations
│   ├── ocr.controller.js         # OCR processing for documents
│   ├── report.controller.js      # Financial reporting logic
│   └── transaction.controller.js # Transaction CRUD operations
├── db/                   # Database configuration
│   └── connect.js        # Database connection setup
├── middleware/           # Custom middleware functions
├── models/              # Database models and schemas
│   ├── category.model.js # Category data model
│   ├── transaction.model.js # Transaction data model
│   └── user.model.js     # User data model
├── node_modules/        # Project dependencies
├── routes/              # API route definitions
│   ├── category.routes.js    # Category-related endpoints
│   ├── ocr.routes.js         # OCR processing endpoints
│   ├── report.routes.js      # Report generation endpoints
│   └── transaction.routes.js # Transaction management endpoints
├── uploads/             # File upload storage
├── utils/              # Utility functions and helpers
│   ├── ocrHelper.js     # OCR processing utilities
│   └── parser.js        # Data parsing utilities
├── .env                # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Project dependencies and scripts
├── package-lock.json   # Dependency lock file
├── README.md           # Project documentation
└── server.js           # Application entry point
```
## API Flow
![Alt text](https://github.com/user-attachments/assets/8932052f-fd38-4a59-b200-01615135fd73)

## 🚀 Features

- **Transaction Management**: Complete CRUD operations for financial transactions
- **Category System**: Organize transactions with customizable categories
- **OCR Integration**: Extract financial data from documents and receipts
- **Report Generation**: Generate comprehensive financial reports and analytics
- **User Management**: User authentication and profile management
- **File Upload**: Handle document and receipt uploads
- **Database Integration**: Robust data persistence layer

## 🛠️ Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB/PostgreSQL (configured via connect.js)
- **OCR Processing**: Integration for document text extraction
- **File Handling**: Multer for file uploads
- **Authentication**: JWT-based authentication system
- **Validation**: Input validation and sanitization

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- npm or yarn package manager
- Database (MongoDB/PostgreSQL)
- OCR service credentials (if applicable)

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd typeflow-finance/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_CONNECTION_STRING=your_database_url
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   
   # OCR Service Configuration
   OCR_API_KEY=your_ocr_api_key
   OCR_ENDPOINT=your_ocr_endpoint
   
   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔌 API Endpoints

### Categories
- `GET /api/categories` - Get all categories

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### OCR Processing
- `POST /api/ocr/process` - Process document with OCR
- `GET /api/ocr/status/:id` - Check OCR processing status

### Reports
- `GET /api/reports/summary` - Get financial summary
- `GET /api/reports/monthly` - Get monthly reports
- `GET /api/reports/category-breakdown` - Get category-wise breakdown

## 📊 Database Models

### Transaction Model
```javascript
{
  id: ObjectId,
  amount: Number,
  description: String,
  category: ObjectId,
  date: Date,
  type: String, // 'income' or 'expense'
  userId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model
```javascript
{
  id: ObjectId,
  name: String,
  description: String,
  color: String,
  icon: String,
  userId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### User Model
```javascript
{
  id: ObjectId,
  username: String,
  email: String,
  password: String,
  profile: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Database Connection
Configure your database connection in `db/connect.js`. The application supports both MongoDB and PostgreSQL.

### File Uploads
Upload configurations are handled in the `uploads/` directory. Supported file types include:
- Images (JPG, PNG, PDF) for OCR processing
- Maximum file size: 5MB (configurable)

### OCR Integration
The OCR functionality processes financial documents and extracts:
- Transaction amounts
- Merchant names
- Transaction dates
- Category suggestions

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```



## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security

- auth0 authentication
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload handling
- Environment variable protection

**Typeflow Finance Backend** - Empowering financial management through technology.
