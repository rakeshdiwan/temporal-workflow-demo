import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const router = Router();

// Minimal OpenAPI spec for demo purposes
const spec = YAML.parse(`
openapi: 3.0.0
info:
  title: Temporal Order Workflow Demo API
  version: 1.0.0
servers:
  - url: http://localhost:4000
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: OK
  /orders:
    post:
      summary: Create order and start workflow
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [customerName]
              properties:
                customerName:
                  type: string
                simulateFailureSteps:
                  type: array
                  items: { type: string }
      responses:
        '201':
          description: Created
  /orders/{orderId}/approve:
    post:
      summary: Approve order (signal)
      parameters:
        - in: path
          name: orderId
          required: true
          schema: { type: string }
      responses:
        '202': { description: Accepted }
  /orders/{orderId}/assign-driver:
    post:
      summary: Assign driver (signal)
      parameters:
        - in: path
          name: orderId
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [driverId]
              properties:
                driverId: { type: string }
      responses:
        '202': { description: Accepted }
  /orders/{orderId}/driver-accept:
    post:
      summary: Driver accept (signal)
      parameters:
        - in: path
          name: orderId
          required: true
          schema: { type: string }
      responses:
        '202': { description: Accepted }
  /orders/{orderId}/pickup:
    post:
      summary: Pickup (signal)
      parameters:
        - in: path
          name: orderId
          required: true
          schema: { type: string }
      responses:
        '202': { description: Accepted }
  /orders/{orderId}/deliver:
    post:
      summary: Deliver (signal)
      parameters:
        - in: path
          name: orderId
          required: true
          schema: { type: string }
      responses:
        '202': { description: Accepted }
  /orders/{orderId}/cancel:
    post:
      summary: Cancel order (signal)
      parameters:
        - in: path
          name: orderId
          required: true
          schema: { type: string }
      responses:
        '202': { description: Accepted }
  /workflows:
    get:
      summary: List workflows
      responses:
        '200': { description: OK }
  /workflows/{workflowId}/status:
    get:
      summary: Query workflow status/progress/failure/version info
      parameters:
        - in: path
          name: workflowId
          required: true
          schema: { type: string }
      responses:
        '200': { description: OK }
  /workflows/{workflowId}/history:
    get:
      summary: Get raw workflow history
      parameters:
        - in: path
          name: workflowId
          required: true
          schema: { type: string }
      responses:
        '200': { description: OK }
`);

router.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
router.get('/openapi.json', (_req, res) => res.json(spec));

export default router;

