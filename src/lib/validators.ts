import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().optional(),
  content: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  salePrice: z.number().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  thumbnail: z.string().optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
  videoType: z.enum(["YOUTUBE", "FACEBOOK", "VIMEO", "CUSTOM"]).default("YOUTUBE"),
  duration: z.number().min(0).default(0),
  order: z.number().min(0).default(0),
  isFree: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  courseId: z.string(),
});

export const artworkSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  salePrice: z.number().optional(),
  category: z.string().optional(),
  medium: z.string().optional(),
  dimensions: z.string().optional(),
  year: z.number().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  isForSale: z.boolean().default(true),
  isDownloadable: z.boolean().default(false),
});

export const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().optional(),
  type: z.enum(["DISCUSSION", "CHALLENGE", "SHOWCASE", "ANNOUNCEMENT", "FEEDBACK"]).default("DISCUSSION"),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  postId: z.string().optional(),
  parentId: z.string().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  value: z.number().min(0, "Value must be non-negative"),
  minAmount: z.number().optional(),
  maxUses: z.number().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  active: z.boolean().default(true),
});

export const bannerSchema = z.object({
  title: z.string().min(2, "Title is required"),
  subtitle: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  link: z.string().optional(),
  linkText: z.string().optional(),
  position: z.number().default(0),
  active: z.boolean().default(true),
});

export const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR", "ENROLLMENT", "ORDER", "COMMENT", "LIKE"]).default("INFO"),
  pinned: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(["COURSE", "ARTWORK", "POST"]).default("COURSE"),
});

export const tagSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
});

export const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
  group: z.string().default("general"),
});
