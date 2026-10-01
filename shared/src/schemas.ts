import { z } from "zod";

/** Numero de telephone tchadien : +235 suivi de 8 chiffres. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+235\d{8}$/, "Le telephone doit suivre le format +235XXXXXXXX");

/**
 * Mot de passe : 10 caracteres minimum, avec au moins une lettre et un chiffre.
 * Rejette explicitement les mots de passe trop courants.
 */
export const passwordSchema = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caracteres")
  .max(128, "Le mot de passe est trop long")
  .refine((value) => /[A-Za-z]/.test(value), "Le mot de passe doit contenir une lettre")
  .refine((value) => /\d/.test(value), "Le mot de passe doit contenir un chiffre")
  .refine(
    (value) => !["password", "1234567890", "qwertyuiop"].includes(value.toLowerCase()),
    "Ce mot de passe est trop courant",
  );

/** Reference interne de commande, generee par la base. */
export const orderReferenceSchema = z
  .string()
  .regex(/^CMD-\d{4,}$/, "Reference de commande invalide");

/** Identifiant UUID, tel qu'attendu par Prisma. */
export const uuidSchema = z.string().uuid();

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerClientSchema = z.object({
  establishmentName: z.string().trim().min(2).max(120),
  managerName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  password: passwordSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type RegisterClientInput = z.infer<typeof registerClientSchema>;

export const registerSupplierSchema = z.object({
  depotName: z.string().trim().min(2).max(120),
  managerName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  password: passwordSchema,
});
export type RegisterSupplierInput = z.infer<typeof registerSupplierSchema>;

export const registerDriverSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  password: passwordSchema,
  vehicleNumber: z.string().trim().min(2).max(32),
});
export type RegisterDriverInput = z.infer<typeof registerDriverSchema>;

export const orderItemInputSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().min(1).max(200),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, "La commande doit contenir au moins une ligne"),
  paymentMethod: z.enum(["cod", "moov", "airtel"]),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const assignOrderSchema = z.object({
  driverId: uuidSchema,
});
export type AssignOrderInput = z.infer<typeof assignOrderSchema>;

export const confirmDeliverySchema = z.object({
  paymentMethod: z.enum(["cash", "mobile"]),
  amountReceived: z.number().int().min(0).optional(),
  verificationCode: z.string().trim(),
});
export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;