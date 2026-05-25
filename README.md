# Blue Collar Marketplace — Microservices

## Architecture
- 6 independent microservices
- Nginx API Gateway
- RabbitMQ for async communication
- MongoDB per service
- Redis for caching

## Services
| Service | Port | Responsibility |
|---------|------|----------------|
| auth-service | 3001 | OTP, JWT, sessions |
| user-service | 3002 | User profiles |
| job-service | 3003 | Job CRUD |
| bid-service | 3004 | Bidding logic |
| payment-service | 3005 | Razorpay integration |
| notification-service | 3006 | SMS via Twilio |

## Local Development
```bash
docker-compose up
```

## Tech Stack
- Runtime: Node.js
- Gateway: Nginx
- Queue: RabbitMQ
- Cache: Redis
- Database: MongoDB
- Container: Docker
- Orchestration: Kubernetes (EKS)
- IaC: Terraform
- CI/CD: GitHub Actions
