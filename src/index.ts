import dotenv from 'dotenv';
import { startServer } from './server/apiServer';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

// Start the server
startServer(PORT).catch((error) => {
  console.error('Failed to start AI Test Generator server:', error);
  process.exit(1);
});