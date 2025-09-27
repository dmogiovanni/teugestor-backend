import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:8080',
    'https://teugestor.com.br',
    'https://www.teugestor.com.br',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Status do servidor
 *     description: Verifica se o servidor backend está funcionando
 *     responses:
 *       200:
 *         description: Servidor funcionando
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Teu Gestor Backend rodando!"
 */
app.get('/', (req: Request, res: Response) => {
  res.send('Teu Gestor Backend rodando!');
});

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Verifica o status de saúde do servidor
 *     responses:
 *       200:
 *         description: Servidor saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *                   example: "Backend funcionando corretamente"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Backend funcionando corretamente',
    version: '1.0.0'
  });
});

// Endpoint de teste CORS
app.get('/test-cors', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'CORS funcionando!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method
  });
});

// Endpoint de teste específico para transferências
app.get('/api/transfers/test-frontend', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Endpoint de transferências acessível pelo frontend!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers
  });
});

// Configurar Swagger
setupSwagger(app);

// Usar rotas organizadas
app.use('/api', routes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 80;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});

export default app; 