import { db } from "@/lib/db";
import { hash } from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@aliarts.com" },
    update: {},
    create: {
      email: "admin@aliarts.com",
      name: "Ali Admin",
      username: "aliadmin",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create demo user
  const userPassword = await hash("user123", 12);
  const demoUser = await db.user.upsert({
    where: { email: "user@aliarts.com" },
    update: {},
    create: {
      email: "user@aliarts.com",
      name: "Demo User",
      username: "demouser",
      password: userPassword,
      role: "USER",
    },
  });
  console.log("✅ Demo user created:", demoUser.email);

  // Create categories
  const courseCategories = [
    { name: "Drawing", slug: "drawing", type: "COURSE" as const, description: "Learn drawing techniques" },
    { name: "Painting", slug: "painting", type: "COURSE" as const, description: "Master painting skills" },
    { name: "Digital Art", slug: "digital-art", type: "COURSE" as const, description: "Create digital masterpieces" },
    { name: "Sculpture", slug: "sculpture", type: "COURSE" as const, description: "Sculpting and 3D art" },
    { name: "Photography", slug: "photography", type: "COURSE" as const, description: "Photography fundamentals" },
  ];

  for (const cat of courseCategories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Course categories created");

  const artworkCategories = [
    { name: "Abstract", slug: "abstract", type: "ARTWORK" as const, description: "Abstract art pieces" },
    { name: "Realism", slug: "realism", type: "ARTWORK" as const, description: "Realistic artwork" },
    { name: "Portrait", slug: "portrait", type: "ARTWORK" as const, description: "Portrait art" },
    { name: "Landscape", slug: "landscape", type: "ARTWORK" as const, description: "Landscape scenery" },
  ];

  for (const cat of artworkCategories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Artwork categories created");

  // Create tags
  const tags = [
    "Beginner Friendly", "Advanced", "Watercolor", "Oil Painting", "Acrylic",
    "Pencil Drawing", "Charcoal", "Mixed Media", "Illustration", "Concept Art",
  ];

  for (const tagName of tags) {
    await db.tag.upsert({
      where: { slug: tagName.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, "-"),
      },
    });
  }
  console.log("✅ Tags created");

  // Create sample courses
  const courses = [
    {
      title: "Fundamentals of Drawing",
      slug: "fundamentals-of-drawing",
      description: "Master the basics of drawing with this comprehensive course designed for absolute beginners.",
      price: 29.99,
      level: "BEGINNER" as const,
      status: "PUBLISHED" as const,
      featured: true,
      authorId: admin.id,
      publishedAt: new Date(),
    },
    {
      title: "Advanced Watercolor Techniques",
      slug: "advanced-watercolor-techniques",
      description: "Take your watercolor skills to the next level with advanced wet-on-wet and glazing techniques.",
      price: 49.99,
      level: "ADVANCED" as const,
      status: "PUBLISHED" as const,
      featured: true,
      authorId: admin.id,
      publishedAt: new Date(),
    },
    {
      title: "Digital Illustration Mastery",
      slug: "digital-illustration-mastery",
      description: "Learn to create stunning digital illustrations using Procreate and Photoshop.",
      price: 39.99,
      salePrice: 24.99,
      level: "INTERMEDIATE" as const,
      status: "PUBLISHED" as const,
      featured: false,
      authorId: admin.id,
      publishedAt: new Date(),
    },
  ];

  for (const course of courses) {
    await db.course.upsert({
      where: { slug: course.slug },
      update: {},
      create: course,
    });
  }
  console.log("✅ Sample courses created");

  // Create sample artworks
  const artworks = [
    {
      title: "Sunset Over Mountains",
      slug: "sunset-over-mountains",
      description: "A breathtaking watercolor painting of a sunset over mountain peaks.",
      price: 199.99,
      category: "Landscape",
      medium: "Watercolor on Paper",
      dimensions: "24 x 36 inches",
      year: 2024,
      status: "PUBLISHED" as const,
      featured: true,
      isForSale: true,
      artistId: admin.id,
      publishedAt: new Date(),
    },
    {
      title: "Abstract Emotions",
      slug: "abstract-emotions",
      description: "An expressive abstract piece exploring the complexity of human emotions through color and form.",
      price: 299.99,
      category: "Abstract",
      medium: "Acrylic on Canvas",
      dimensions: "30 x 40 inches",
      year: 2024,
      status: "PUBLISHED" as const,
      featured: true,
      isForSale: true,
      artistId: admin.id,
      publishedAt: new Date(),
    },
    {
      title: "Portrait of Solitude",
      slug: "portrait-of-solitude",
      description: "A charcoal portrait capturing a moment of quiet contemplation.",
      price: 149.99,
      salePrice: 99.99,
      category: "Portrait",
      medium: "Charcoal on Paper",
      dimensions: "18 x 24 inches",
      year: 2024,
      status: "PUBLISHED" as const,
      featured: false,
      isForSale: true,
      artistId: admin.id,
      publishedAt: new Date(),
    },
  ];

  for (const artwork of artworks) {
    await db.artwork.upsert({
      where: { slug: artwork.slug },
      update: {},
      create: artwork,
    });
  }
  console.log("✅ Sample artworks created");

  // Create sample banners
  await db.banner.create({
    data: {
      title: "New Art Course Available!",
      subtitle: "Learn the fundamentals of drawing from scratch",
      image: "https://img-vessel.s3.fr-par.scw.cloud/aliarts/admin/banner-placeholder.jpg",
      link: "/courses/fundamentals-of-drawing",
      linkText: "Enroll Now",
      position: 0,
      active: true,
    },
  });
  console.log("✅ Sample banner created");

  // Create site settings
  const settings = [
    { key: "site_name", value: "AliArts", group: "general" },
    { key: "site_description", value: "A solo-creator art platform for courses, artworks, and community", group: "general" },
    { key: "site_url", value: "https://aliarts.com", group: "general" },
    { key: "currency", value: "USD", group: "payment" },
    { key: "seo_title", value: "AliArts - Learn Art, Buy Art, Join Community", group: "seo" },
    { key: "seo_description", value: "Discover art courses, buy original artworks, and join a creative community.", group: "seo" },
    { key: "social_twitter", value: "", group: "social" },
    { key: "social_instagram", value: "", group: "social" },
    { key: "social_youtube", value: "", group: "social" },
    { key: "social_facebook", value: "", group: "social" },
  ];

  for (const setting of settings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log("✅ Site settings created");

  console.log("\n🎉 Seeding complete!");
  console.log("📋 Login credentials:");
  console.log("   Admin: admin@aliarts.com / admin123");
  console.log("   User:  user@aliarts.com / user123");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
