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

type PendingAction = PendingApply | PendingRevert | { action: "none" };

let pendingAction: PendingAction = { action: "none" };

export async function actionsRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { patch: unknown; checkpointId: string; createdPaths: string[] } }>(
    "/apply",
    async (request) => {
      const { patch, checkpointId, createdPaths } = request.body;
      pendingAction = { action: "apply", patch, checkpointId, createdPaths };
      app.log.info({ checkpointId }, "Patch queued for plugin");
      return { ok: true };
    },
  );

  app.post<{ Body: { paths: string[] } }>(
    "/revert",
    async (request) => {
      const { paths } = request.body;
      pendingAction = { action: "revert", paths };
      app.log.info("Revert queued for plugin");
      return { ok: true };
    },
  );

  app.get("/pending-action", async () => {
    const current = pendingAction;
    pendingAction = { action: "none" };
    return current;
  });

  app.post("/confirm-action", async () => {
    return { ok: true };
  });
}
