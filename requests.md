curl -X POST http://localhost:5004/api/auth/signup \
-H "Content-Type: application/json" \
-d '{
  "username": "adminUser",
  "firstName": "Admin",
  "lastName": "User",
  "companyName": "sermixer",
  "email": "admin@example.com",
  "password": "strongpassword",
  "role": "admin"
}'
