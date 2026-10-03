import { Router } from 'express';
import { livestreamController } from './livestream.controller';
import { livestreamService } from './livestream.service';
import { livestreamRepository } from './livestream.repository';

export { livestreamController, livestreamService, livestreamRepository };

export const livestreamRouter = Router({ mergeParams: true });

// Active live stream with real-time chat & telemetry
livestreamRouter.get('/active', livestreamController.getActiveStream);

// List all ceremony live streams
livestreamRouter.get('/', livestreamController.getStreams);

// Update stream source / camera / ritual
livestreamRouter.patch('/:streamId', livestreamController.updateStream);

// Send virtual blessing message
livestreamRouter.post('/:streamId/blessings', livestreamController.sendBlessing);

// Shower rose petals
livestreamRouter.post('/:streamId/petals', livestreamController.showerPetals);

// Create or update stream
livestreamRouter.post('/', livestreamController.createStream);
