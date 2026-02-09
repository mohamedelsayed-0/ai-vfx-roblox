import { z } from "zod";

export const Color3Schema = z.object({
  $type: z.literal("Color3"),
  r: z.number().finite(),
  g: z.number().finite(),
  b: z.number().finite(),
});

export const Vector3Schema = z.object({
  $type: z.literal("Vector3"),
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

export const RefSchema = z.object({
  $ref: z.string().min(1),
});

export const EnumSchema = z.object({
  $enum: z.string().min(1),
});

const ColorKeypointSchema = z.object({
  time: z.number().finite(),
  color: z.object({ r: z.number().finite(), g: z.number().finite(), b: z.number().finite() }),
});

export const ColorSequenceSchema = z.object({
  $type: z.literal("ColorSequence"),
  keypoints: z.array(ColorKeypointSchema).min(1),
});

const NumberKeypointSchema = z.object({
  time: z.number().finite(),
  value: z.number().finite(),
});

export const NumberSequenceSchema = z.object({
  $type: z.literal("NumberSequence"),
  keypoints: z.array(NumberKeypointSchema).min(1),
});

export const PropertyValueSchema: z.ZodType = z.union([
  z.number().finite(),
  z.string().max(10000),
  z.boolean(),
  Color3Schema,
  Vector3Schema,
  RefSchema,
  EnumSchema,
  ColorSequenceSchema,
  NumberSequenceSchema,
]);
