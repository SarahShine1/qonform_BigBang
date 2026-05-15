# PV Management System - Documentation

## Overview

The PV (Procès-Verbal) management system is a Django REST Framework backend module that enables auditors and CAQ (Comité d'Audit et de Qualité) to create and manage formal audit and compliance records.

## Features

- ✅ **Automatic Code Generation**: PV codes are auto-generated using the format `PV_TYPE_YYYYMMDD`
- ✅ **Multi-participant Support**: Assign multiple users as participants in a PV
- ✅ **Document Integration**: Automatically creates and links PDF documents using the existing Document model
- ✅ **Type Classification**: Three types of PVs: AUDIT, SUIVI (Follow-up), MEETING
- ✅ **RESTful API**: Full CRUD operations with additional custom actions
- ✅ **Django Admin Integration**: Admin interface for manual management
- ✅ **Comprehensive Filtering**: Filter by type, date, and date ranges
- ✅ **Statistics & Analytics**: Get PV statistics and recent activity

## Models

### PV Model

```python
class PV(models.Model):
    id                  # AutoField primary key
    code                # Unique auto-generated code (PV_TYPE_YYYYMMDD)
    type                # Choices: AUDIT, SUIVI, MEETING
    date                # DateField for PV date
    participants        # ManyToManyField linking to User model
    document            # OneToOneField linking to Document model
    created_at          # Auto-generated timestamp
    updated_at          # Auto-updated timestamp
```

**Example Code Generation:**
- Type: AUDIT, Date: 2026-05-11 → `PV_AUDIT_20260511`
- If duplicate exists → `PV_AUDIT_20260511_1`, `PV_AUDIT_20260511_2`, etc.

## API Endpoints

### Base URL: `/api/v1/pv/`

#### 1. List All PVs
```
GET /api/v1/pv/
```

**Query Parameters:**
- `type` - Filter by type (AUDIT, SUIVI, MEETING)
- `date` - Filter by specific date (YYYY-MM-DD)
- `ordering` - Sort by: `date`, `created_at`, `code`

**Example:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/v1/pv/?type=AUDIT&ordering=-date"
```

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "code": "PV_AUDIT_20260511",
      "type": "AUDIT",
      "date": "2026-05-11",
      "participants": [1, 2, 3],
      "participants_data": [
        {
          "id": 1,
          "username": "user1",
          "email": "user1@example.com"
        }
      ],
      "document": {
        "id": 1,
        "nom_fichier": "audit_report.pdf",
        "chemin_stockage": "pv/2026/05/11/audit_report.pdf",
        "date_upload": "2026-05-11T10:30:00Z",
        "taille": 2048576
      },
      "created_at": "2026-05-11T10:30:00Z",
      "updated_at": "2026-05-11T10:30:00Z"
    }
  ]
}
```

#### 2. Create a New PV
```
POST /api/v1/pv/
```

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "type": "AUDIT",
  "date": "2026-05-11",
  "participants": [1, 2, 3],
  "fichier": <binary PDF file>
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:8000/api/v1/pv/ \
  -H "Authorization: Bearer TOKEN" \
  -F "type=AUDIT" \
  -F "date=2026-05-11" \
  -F "participants=1" \
  -F "participants=2" \
  -F "fichier=@/path/to/document.pdf"
```

**Response:**
```json
{
  "id": 1,
  "code": "PV_AUDIT_20260511",
  "type": "AUDIT",
  "date": "2026-05-11",
  "participants": [1, 2],
  "participants_data": [...],
  "document": {...},
  "created_at": "2026-05-11T10:30:00Z",
  "updated_at": "2026-05-11T10:30:00Z"
}
```

#### 3. Retrieve a Specific PV
```
GET /api/v1/pv/{id}/
```

#### 4. Update a PV
```
PUT /api/v1/pv/{id}/
PATCH /api/v1/pv/{id}/
```

**Note:** Code and type cannot be changed after creation.

#### 5. Delete a PV
```
DELETE /api/v1/pv/{id}/
```

### Custom Actions

#### 6. Filter by Type
```
GET /api/v1/pv/by-type/?type=AUDIT
```

#### 7. Filter by Date Range
```
GET /api/v1/pv/by-date/?start_date=2026-05-01&end_date=2026-05-31
```

#### 8. Get Statistics
```
GET /api/v1/pv/statistics/
```

**Response:**
```json
{
  "total_pvs": 15,
  "by_type": {
    "AUDIT": 5,
    "SUIVI": 8,
    "MEETING": 2
  },
  "recent_pvs": [
    {
      "id": 1,
      "code": "PV_AUDIT_20260511",
      "type": "AUDIT",
      "date": "2026-05-11"
    }
  ]
}
```

#### 9. Get PV Participants
```
GET /api/v1/pv/{id}/participants/
```

**Response:**
```json
{
  "pv_code": "PV_AUDIT_20260511",
  "participants_count": 3,
  "participants": [
    {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

## Serializer

### PVSerializer

**Input Fields:**
- `type` (required) - PV type: AUDIT, SUIVI, MEETING
- `date` (required) - PV date in YYYY-MM-DD format
- `participants` (required) - List of User IDs
- `fichier` (required) - PDF file for upload

**Output Fields:**
- `id` - PV ID
- `code` - Auto-generated PV code
- `type` - PV type
- `date` - PV date
- `participants` - List of participant IDs
- `participants_data` - Full participant details
- `document` - Document information
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Validation:**
- At least one participant is required
- A file must be provided
- File is automatically stored in `pv/YYYY/MM/DD/filename.pdf`

## Authentication & Permissions

- **Required:** User must be authenticated
- All endpoints require JWT token in Authorization header
- Format: `Authorization: Bearer <token>`

## Error Handling

### Common Errors

**400 - Bad Request:**
```json
{
  "participants": ["At least one participant is required."],
  "fichier": ["A PDF file is required."]
}
```

**401 - Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**404 - Not Found:**
```json
{
  "detail": "Not found."
}
```

**500 - Server Error:**
```json
{
  "detail": "Error creating PV: [error details]"
}
```

## Installation & Setup

### 1. Already Done
- App created in `backend/apps/pv/`
- Added to `INSTALLED_APPS` in settings
- Routes registered in `config/urls.py`

### 2. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Verify Installation
```bash
# Check if app is registered
python manage.py shell
>>> from apps.pv.models import PV
>>> print(PV)
<class 'apps.pv.models.PV'>
```

## Usage Examples

### Python/Django Shell
```python
from apps.pv.models import PV
from django.contrib.auth import get_user_model

User = get_user_model()

# Create a PV
pv = PV.objects.create(
    type='AUDIT',
    date='2026-05-11'
)

# Add participants
user1 = User.objects.get(id=1)
user2 = User.objects.get(id=2)
pv.participants.add(user1, user2)

print(pv.code)  # Output: PV_AUDIT_20260511
print(pv)       # Output: PV_AUDIT_20260511 - Audit (2026-05-11)
```

### JavaScript/Frontend
```javascript
// Create a new PV with file upload
const formData = new FormData();
formData.append('type', 'AUDIT');
formData.append('date', '2026-05-11');
formData.append('participants', 1);
formData.append('participants', 2);
formData.append('fichier', fileInput.files[0]);

const response = await fetch('http://localhost:8000/api/v1/pv/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Created PV:', data);
```

## Admin Interface

Access via: `http://localhost:8000/admin/pv/pv/`

**Features:**
- List all PVs with filters by type and date
- View/edit participant assignments
- Search by code
- Display participant count
- Readonly fields: code, created_at, updated_at

## Testing

Run tests:
```bash
python manage.py test apps.pv
```

**Test Coverage:**
- PV model creation and code generation
- Unique code generation
- String representation
- Participant assignment
- API endpoints (list, retrieve, filter, statistics)
- Authentication requirements
- Error handling

## File Storage

Uploaded files are stored at:
```
media/pv/YYYY/MM/DD/filename.pdf
```

**Example:**
```
media/pv/2026/05/11/audit_report.pdf
```

## Database Schema

```sql
-- PV Table
CREATE TABLE pv (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  document_id BIGINT REFERENCES document(id_document),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (date DESC),
  INDEX idx_type_date (type, date DESC)
);

-- PV Participants (ManyToMany join table)
CREATE TABLE pv_participants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  pv_id BIGINT REFERENCES pv(id),
  user_id BIGINT REFERENCES accounts_user(id),
  UNIQUE KEY unique_pv_participant (pv_id, user_id)
);
```

## Performance Considerations

- **Indexes:** Added on `date` and `(type, date)` for fast filtering
- **Prefetching:** API uses `prefetch_related()` for participants and documents
- **Pagination:** List endpoints are paginated (default 20 items per page)

## Security

- ✅ Authentication required for all endpoints
- ✅ File upload validated
- ✅ SQL injection protected (ORM)
- ✅ CSRF protection enabled
- ✅ File stored outside web root

## Future Enhancements

- [ ] PDF generation from PV data
- [ ] Email notifications for participants
- [ ] Audit trail for PV modifications
- [ ] Approval workflow (DRAFT → APPROVED → ARCHIVED)
- [ ] Comments/notes on PVs
- [ ] Bulk import PVs
- [ ] Export to Excel/PDF
- [ ] Meeting minutes transcription

## Troubleshooting

### Migration Issues
```bash
# If migration fails, check dependencies
python manage.py showmigrations apps.pv

# Rollback migrations
python manage.py migrate apps.pv 0001
python manage.py migrate apps.pv
```

### File Upload Issues
```bash
# Ensure media directory exists
mkdir -p backend/media/pv

# Check Django settings
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### Permission Denied
```
# Ensure user is authenticated
# Check JWT token is valid
# Verify user has necessary permissions
```

## Support

For issues or questions, contact: [your-email@example.com]
