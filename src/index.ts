import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://teugestor.com.br',
    'https://www.teugestor.com.br',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.get('/', (req: Request, res: Response) => {
  res.send('Teu Gestor Backend rodando!');
});

// Endpoint de teste para verificar se o backend está funcionando
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

// Usar rotas organizadas
app.use('/api', routes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 80;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});

export default app; 