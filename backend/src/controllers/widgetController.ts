import { Response } from 'express';
import { WidgetConfig } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getWidgets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const widgets = await WidgetConfig.findAll({ where: { userId } });
    res.json(widgets);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching widgets configuration' });
  }
};

export const updateWidgets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { widgets } = req.body; // Expect array of: { id, widgetName, positionX, positionY, sizeX, sizeY, visible }

    if (!Array.isArray(widgets)) {
      return res.status(400).json({ error: 'Payload must be an array of widget configs' });
    }

    for (const w of widgets) {
      if (w.id) {
        await WidgetConfig.update(
          {
            positionX: w.positionX,
            positionY: w.positionY,
            sizeX: w.sizeX,
            sizeY: w.sizeY,
            visible: w.visible
          },
          { where: { id: w.id, userId } }
        );
      } else {
        // Create if missing
        await WidgetConfig.create({
          userId,
          widgetName: w.widgetName,
          positionX: w.positionX,
          positionY: w.positionY,
          sizeX: w.sizeX,
          sizeY: w.sizeY,
          visible: w.visible ?? true
        });
      }
    }

    const updated = await WidgetConfig.findAll({ where: { userId } });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error updating widgets configuration' });
  }
};
