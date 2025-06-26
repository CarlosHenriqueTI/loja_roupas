import { NivelAcesso } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      admin?: {
        id: string; // Mudado para string para ser consistente
        nivelAcesso: NivelAcesso;
      };
    }
  }
}