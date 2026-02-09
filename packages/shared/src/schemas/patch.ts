import { z } from "zod";
import { PropertyValueSchema } from "./properties.js";

const EnsureFolderOp = z.object({
  op: z.literal("ensureFolder"),
  path: z.string().min(1),
});

const CreateInstanceOp = z.object({
  op: z.literal("createInstance"),
  id: z.string().min(1),
  className: z.string().min(1),
  parentPath: z.string().min(1),
  name: z.string().min(1),
  properties: z.record(z.string(), PropertyValueSchema),
});

const CreateScriptOp = z.object({
  op: z.literal("createScript"),
  scriptType: z.enum(["Script", "LocalScript", "ModuleScript"]),
  path: z.string().min(1),
  source: z.string().max(10000),
});

const SetPropertyOp = z.object({
  op: z.literal("setProperty"),
  targetPath: z.string().min(1),
  property: z.string().min(1),
  value: PropertyValueSchema,
});

const DeleteInstanceOp = z.object({
  op: z.literal("deleteInstance"),
  path: z.string().min(1),
});

const MoveInstanceOp = z.object({
  op: z.literal("moveInstance"),
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
});

export const OperationSchema = z.discriminatedUnion("op", [
  EnsureFolderOp,
  CreateInstanceOp,
  CreateScriptOp,
  SetPropertyOp,
  DeleteInstanceOp,
  MoveInstanceOp,
]);

export const PatchSchema = z.object({
  version: z.literal("1.0"),
  effectName: z.string().min(1),
  rootFolder: z.string().min(1),
  summary: z.string(),
  warnings: z.array(z.string()),
  operations: z.array(OperationSchema).min(1).max(100),
});

export type Patch = z.infer<typeof PatchSchema>;
export type Operation = z.infer<typeof OperationSchema>;
