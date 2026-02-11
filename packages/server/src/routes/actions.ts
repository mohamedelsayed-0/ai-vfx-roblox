import type { FastifyInstance } from "fastify";

interface PendingApply {
  action: "apply";
  patch: unknown;
  checkpointId: string;
  createdPaths: string[];
}

interface PendingRevert {
  action: "revert";
  paths: string[];
}

type PendingAction = PendingApply | PendingRevert;

const actionQueue: PendingAction[] = [];

export async function actionsRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { patch: unknown; checkpointId: string; createdPaths: string[] } }>(
    "/apply",
    async (request) => {
      const { patch, checkpointId, createdPaths } = request.body;
      actionQueue.push({ action: "apply", patch, checkpointId, createdPaths });
      app.log.info({ checkpointId }, "Patch queued for plugin");
      return { ok: true };
    },
  );

  app.post<{ Body: { paths: string[] } }>(
    "/revert",
    async (request) => {
      const { paths } = request.body;
      actionQueue.push({ action: "revert", paths });
      app.log.info("Revert queued for plugin");
      return { ok: true };
    },
  );

  app.get("/pending-action", async () => {
    if (actionQueue.length === 0) {
      return { action: "none" };
    }
    // Return the first item without removing it — removal happens on confirm
    return actionQueue[0];
  });

  app.post("/confirm-action", async () => {
    if (actionQueue.length > 0) {
      actionQueue.shift();
    }
    return { ok: true };
  });
}
