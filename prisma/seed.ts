import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { hexToLab, rgbString, hexToRgb } from "../lib/color";
import { fileURLToPath } from "node:url";

// pg-connection-string treats sslmode=require as an alias for verify-full,
// which rejects Supabase's certificate chain. uselibpqcompat=true restores
// the classic libpq semantics (encrypt without strict CA verification).
function withLibpqCompat(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}

const adapter = new PrismaPg({
  connectionString: withLibpqCompat(
    process.env.fineline_POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL!
  ),
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const PALETTE_ORDER = [
  { name: "Bright White", code: "1001", hex: "#F5F3EA" },
  { name: "Black", code: "1000", hex: "#1A1A1A" },
  { name: "Navy", code: "1243", hex: "#17375E" },
  { name: "Royal Blue", code: "1912", hex: "#1F4E9C" },
  { name: "Red", code: "1147", hex: "#C41230" },
  { name: "Yellow", code: "1122", hex: "#FFD100" },
  { name: "Kelly Green", code: "1246", hex: "#00843D" },
  { name: "Orange", code: "1168", hex: "#F4661C" },
  { name: "Purple", code: "1327", hex: "#5B2C83" },
  { name: "Gray", code: "1288", hex: "#8B8D8F" },
  { name: "Tan", code: "1170", hex: "#C9A876" },
  { name: "Brown", code: "1082", hex: "#5C4033" },
  { name: "Pink", code: "1503", hex: "#F2A0C9" },
  { name: "Light Blue", code: "1841", hex: "#6EC6E8" },
  { name: "Gold", code: "1012", hex: "#C9A227" },
] as const;

// Machine 01 needle load order (per the production floor's current setup) —
// deliberately not the same order as the company palette above.
const MACHINE_NEEDLE_ORDER = [
  "Bright White",
  "Black",
  "Red",
  "Navy",
  "Royal Blue",
  "Yellow",
  "Kelly Green",
  "Orange",
  "Gray",
  "Gold",
  "Tan",
  "Brown",
  "Pink",
  "Light Blue",
  "Purple",
];

export async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "org_demo" },
    update: { name: "Fine Line Studio" },
    create: { id: "org_demo", name: "Fine Line Studio" },
  });

  const passwordHash = await bcrypt.hash("stitchos-dev", 10);
  const [admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@stitchos.dev" },
      update: {},
      create: {
        organizationId: org.id,
        email: "admin@stitchos.dev",
        passwordHash,
        name: "Alex Rivera",
        role: "ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { email: "zonasha@househeywood.com" },
      update: { passwordHash: await bcrypt.hash("Momboss123", 10) },
      create: {
        organizationId: org.id,
        email: "zonasha@househeywood.com",
        passwordHash: await bcrypt.hash("Momboss123", 10),
        name: "Zonasha Heywood",
        role: "ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { email: "jameshward3@gmail.com" },
      update: { passwordHash: await bcrypt.hash("tkVwGbPFRcbxSn", 10) },
      create: {
        organizationId: org.id,
        email: "jameshward3@gmail.com",
        passwordHash: await bcrypt.hash("tkVwGbPFRcbxSn", 10),
        name: "James Ward",
        role: "ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { email: "james@househeywood.com" },
      update: { passwordHash: await bcrypt.hash("Dudedad123", 10) },
      create: {
        organizationId: org.id,
        email: "james@househeywood.com",
        passwordHash: await bcrypt.hash("Dudedad123", 10),
        name: "James Heywood",
        role: "ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { email: "designer@stitchos.dev" },
      update: {},
      create: {
        organizationId: org.id,
        email: "designer@stitchos.dev",
        passwordHash,
        name: "Sam Ortiz",
        role: "DESIGNER",
      },
    }),
    prisma.user.upsert({
      where: { email: "operator@stitchos.dev" },
      update: {},
      create: {
        organizationId: org.id,
        email: "operator@stitchos.dev",
        passwordHash,
        name: "Jordan Blake",
        role: "OPERATOR",
      },
    }),
    prisma.user.upsert({
      where: { email: "viewer@stitchos.dev" },
      update: {},
      create: {
        organizationId: org.id,
        email: "viewer@stitchos.dev",
        passwordHash,
        name: "Casey Wu",
        role: "VIEWER",
      },
    }),
  ]);

  const madeira = await prisma.threadManufacturer.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Madeira" } },
    update: {},
    create: { organizationId: org.id, name: "Madeira" },
  });
  await prisma.threadManufacturer.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Isacord" } },
    update: {},
    create: { organizationId: org.id, name: "Isacord" },
  });
  await prisma.threadManufacturer.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Robison-Anton" } },
    update: {},
    create: { organizationId: org.id, name: "Robison-Anton" },
  });

  const threadByName = new Map<string, Awaited<ReturnType<typeof prisma.threadColor.upsert>>>();
  for (const t of PALETTE_ORDER) {
    const rgb = hexToRgb(t.hex);
    const lab = hexToLab(t.hex);
    const thread = await prisma.threadColor.upsert({
      where: {
        organizationId_manufacturerId_manufacturerCode: {
          organizationId: org.id,
          manufacturerId: madeira.id,
          manufacturerCode: t.code,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        manufacturerId: madeira.id,
        manufacturerCode: t.code,
        manufacturerName: t.name,
        companyName: t.name,
        rgb: rgbString(rgb),
        hex: t.hex,
        lab: { l: lab.l, a: lab.a, b: lab.b },
        threadType: "Polyester",
        threadWeight: "W40",
        material: "Polyester",
        finish: "Rayon-look sheen",
        inventoryQuantity: 24,
        active: true,
        favorite: true,
      },
    });
    threadByName.set(t.name, thread);
  }

  const palette = await prisma.companyPalette.upsert({
    where: { organizationId: org.id },
    update: {},
    create: { organizationId: org.id, name: "Standard Company Palette" },
  });
  for (let i = 0; i < PALETTE_ORDER.length; i++) {
    const thread = threadByName.get(PALETTE_ORDER[i].name)!;
    await prisma.companyPaletteSlot.upsert({
      where: { companyPaletteId_slotNumber: { companyPaletteId: palette.id, slotNumber: i + 1 } },
      update: { threadColorId: thread.id },
      create: { companyPaletteId: palette.id, slotNumber: i + 1, threadColorId: thread.id },
    });
  }

  const machine = await prisma.machine.upsert({
    where: { id: "machine_poolin_01" },
    update: {},
    create: {
      id: "machine_poolin_01",
      organizationId: org.id,
      name: "Poolin 15-Needle #01",
      needleCount: 15,
      location: "Production Floor A",
    },
  });
  for (let i = 0; i < MACHINE_NEEDLE_ORDER.length; i++) {
    const thread = threadByName.get(MACHINE_NEEDLE_ORDER[i])!;
    await prisma.machineNeedle.upsert({
      where: { machineId_needleNumber: { machineId: machine.id, needleNumber: i + 1 } },
      update: { threadColorId: thread.id },
      create: { machineId: machine.id, needleNumber: i + 1, threadColorId: thread.id },
    });
  }

  const polo = await prisma.product.upsert({
    where: { id: "product_polo" },
    update: {},
    create: {
      id: "product_polo",
      organizationId: org.id,
      name: "Nike Dri-FIT Polo",
      brand: "Nike",
      manufacturer: "Nike Team Sports",
      sku: "NKE-838956",
      category: "Polo Shirt",
      material: "100% Polyester Dri-FIT",
      fabricWeight: "4.1 oz",
      stretch: "Low stretch, woven-feel knit",
      availableColors: ["Navy", "Black", "White", "Royal Blue"],
      supplier: "BSN Sports",
      supplierUrl: "https://www.bsnsports.com",
      cost: 34.5,
    },
  });
  const tshirt = await prisma.product.upsert({
    where: { id: "product_tshirt" },
    update: {},
    create: {
      id: "product_tshirt",
      organizationId: org.id,
      name: "Gildan Ultra Cotton Tee",
      brand: "Gildan",
      category: "T-Shirt",
      material: "100% Cotton",
      fabricWeight: "6.0 oz",
      availableColors: ["White", "Black", "Navy", "Sport Grey"],
      cost: 5.25,
    },
  });
  const hoodie = await prisma.product.upsert({
    where: { id: "product_hoodie" },
    update: {},
    create: {
      id: "product_hoodie",
      organizationId: org.id,
      name: "Heavy Blend Hoodie",
      brand: "Gildan",
      category: "Hoodie",
      material: "Cotton/Poly Blend",
      fabricWeight: "8.0 oz",
      stretch: "Low stretch",
      availableColors: ["Black", "Navy", "Charcoal"],
      cost: 18.75,
    },
  });
  const cap = await prisma.product.upsert({
    where: { id: "product_cap" },
    update: {},
    create: {
      id: "product_cap",
      organizationId: org.id,
      name: "Structured Trucker Hat",
      brand: "Richardson",
      category: "Trucker Hat",
      material: "Cotton twill front / mesh back",
      availableColors: ["Navy/White", "Black/Black"],
      cost: 6.4,
    },
  });
  await prisma.product.upsert({
    where: { id: "product_patch" },
    update: {},
    create: {
      id: "product_patch",
      organizationId: org.id,
      name: "Twill Embroidered Patch",
      category: "Patch",
      material: "Twill with merrowed border",
      cost: 1.1,
    },
  });

  await prisma.embroideryLocation.upsert({
    where: { id: "loc_polo_left_chest" },
    update: {},
    create: {
      id: "loc_polo_left_chest",
      productId: polo.id,
      name: "Left Chest",
      maxWidthInches: 4.0,
      maxHeightInches: 4.0,
      standardWidthMinInches: 3.25,
      standardWidthMaxInches: 3.75,
      recommendedHoop: "4\" x 4\"",
      recommendedStabilizer: "Medium cutaway",
      orientation: "Upright",
      placementNotes: "7.5\"–9\" below shoulder seam, centered on chest",
    },
  });
  await prisma.embroideryLocation.upsert({
    where: { id: "loc_polo_right_chest" },
    update: {},
    create: {
      id: "loc_polo_right_chest",
      productId: polo.id,
      name: "Right Chest",
      maxWidthInches: 4.0,
      maxHeightInches: 4.0,
      recommendedHoop: "4\" x 4\"",
      recommendedStabilizer: "Medium cutaway",
      placementNotes: "Mirror of left chest placement",
    },
  });
  await prisma.embroideryLocation.upsert({
    where: { id: "loc_hoodie_left_chest" },
    update: {},
    create: {
      id: "loc_hoodie_left_chest",
      productId: hoodie.id,
      name: "Left Chest",
      maxWidthInches: 4.5,
      maxHeightInches: 4.5,
      standardWidthMinInches: 3.5,
      standardWidthMaxInches: 4.0,
      recommendedHoop: "5\" x 7\"",
      recommendedStabilizer: "Medium cutaway",
      placementNotes: "Hoop garment with backing.",
    },
  });
  await prisma.embroideryLocation.upsert({
    where: { id: "loc_hoodie_full_back" },
    update: {},
    create: {
      id: "loc_hoodie_full_back",
      productId: hoodie.id,
      name: "Full Back",
      maxWidthInches: 11,
      maxHeightInches: 13,
      recommendedHoop: "12\" x 15\"",
      recommendedStabilizer: "Heavy cutaway",
    },
  });
  await prisma.embroideryLocation.upsert({
    where: { id: "loc_tshirt_left_chest" },
    update: {},
    create: {
      id: "loc_tshirt_left_chest",
      productId: tshirt.id,
      name: "Left Chest",
      maxWidthInches: 4.0,
      maxHeightInches: 4.0,
      recommendedHoop: "4\" x 4\"",
      recommendedStabilizer: "Tearaway",
    },
  });
  await prisma.embroideryLocation.upsert({
    where: { id: "loc_cap_front" },
    update: {},
    create: {
      id: "loc_cap_front",
      productId: cap.id,
      name: "Front Panel",
      maxWidthInches: 4.5,
      maxHeightInches: 2.25,
      standardWidthMinInches: 3.5,
      standardWidthMaxInches: 4.25,
      recommendedHoop: "Cap frame",
      recommendedStabilizer: "No-show mesh + cap backing",
      orientation: "Curved to panel",
    },
  });

  const poloSetup = await prisma.productionSetup.upsert({
    where: { id: "setup_polo_left_chest" },
    update: {},
    create: {
      id: "setup_polo_left_chest",
      organizationId: org.id,
      name: "Nike Dri-FIT Polo — Left Chest",
      productId: polo.id,
      locationId: "loc_polo_left_chest",
      hoop: "4\" x 4\"",
      stabilizer: "Medium cutaway",
      topping: "Water-soluble topping",
      needleSize: "75/11",
      threadWeight: "40 wt polyester",
      bobbin: "Standard polyester",
      speedSpm: 750,
      densityNotes: "Standard 4.0 pt line density, 0.45mm fill",
      notes: "Light tension check on Dri-FIT weave before running full order.",
      isFavorite: true,
    },
  });
  await prisma.productionSetup.upsert({
    where: { id: "setup_hoodie_left_chest" },
    update: {},
    create: {
      id: "setup_hoodie_left_chest",
      organizationId: org.id,
      name: "Heavy Hoodie — Left Chest",
      productId: hoodie.id,
      locationId: "loc_hoodie_left_chest",
      hoop: "5\" x 7\"",
      stabilizer: "Medium cutaway",
      topping: "None",
      needleSize: "75/11",
      threadWeight: "40 wt polyester",
      bobbin: "Standard polyester",
      speedSpm: 700,
      densityNotes: "Stored as reference",
      notes: "Hoop garment with backing.",
      isFavorite: true,
    },
  });
  await prisma.productionSetup.upsert({
    where: { id: "setup_cap_front" },
    update: {},
    create: {
      id: "setup_cap_front",
      organizationId: org.id,
      name: "Trucker Hat — Front Panel",
      productId: cap.id,
      locationId: "loc_cap_front",
      hoop: "Cap frame",
      stabilizer: "No-show mesh + cap backing",
      topping: "None",
      needleSize: "75/11",
      threadWeight: "40 wt polyester",
      bobbin: "Standard polyester (black)",
      speedSpm: 650,
      notes: "Reduce speed on curved panel edges to avoid distortion.",
    },
  });

  const client = await prisma.client.upsert({
    where: { id: "client_orange_tigers" },
    update: { phone: "(555) 867-5309" },
    create: {
      id: "client_orange_tigers",
      organizationId: org.id,
      name: "Orange Tigers",
      contactName: "Coach Danielle Price",
      email: "dprice@orangetigers.example",
      phone: "(555) 867-5309",
    },
  });

  const shieldDesign = await prisma.design.upsert({
    where: { id: "design_ot_shield" },
    update: {},
    create: {
      id: "design_ot_shield",
      organizationId: org.id,
      clientId: client.id,
      collection: "Team Logos",
      name: "South Orange Tigers — Chest Logo",
    },
  });

  await prisma.designVersion.upsert({
    where: { designId_versionNumber: { designId: shieldDesign.id, versionNumber: 1 } },
    update: {},
    create: {
      designId: shieldDesign.id,
      versionNumber: 1,
      status: "ARCHIVED",
      changeNotes: "Initial AI-generated concept import.",
      createdById: admin.id,
      widthInches: 3.5,
      heightInches: 2.75,
      displayUnit: "in",
      detectedColorCount: 37,
      targetColorCount: 8,
      readinessScore: 61,
      readinessClassification: "Significant cleanup required",
    },
  });

  const shieldV3 = await prisma.designVersion.upsert({
    where: { designId_versionNumber: { designId: shieldDesign.id, versionNumber: 3 } },
    update: {},
    create: {
      designId: shieldDesign.id,
      versionNumber: 3,
      status: "READY_FOR_INSTITCH",
      changeNotes: "Simplified border, remapped to 6 stocked colors, cleaned lettering.",
      createdById: admin.id,
      widthInches: 3.5,
      heightInches: 2.75,
      displayUnit: "in",
      detectedColorCount: 37,
      targetColorCount: 6,
      readinessScore: 87,
      readinessBreakdown: {
        colorCount: 10,
        shapeComplexity: 17,
        minimumDetail: 14,
        contrast: 10,
        vectorQuality: 18,
        productionSetup: 18,
      },
      readinessClassification: "Good with simplification",
    },
  });

  const shieldColors: { name: string; sequence: number }[] = [
    { name: "Bright White", sequence: 1 },
    { name: "Red", sequence: 2 },
    { name: "Navy", sequence: 3 },
    { name: "Gold", sequence: 4 },
    { name: "Black", sequence: 5 },
    { name: "Royal Blue", sequence: 6 },
  ];
  for (const c of shieldColors) {
    const thread = threadByName.get(c.name)!;
    await prisma.designColorMapping.upsert({
      where: { designVersionId_sequence: { designVersionId: shieldV3.id, sequence: c.sequence } },
      update: {},
      create: {
        designVersionId: shieldV3.id,
        sequence: c.sequence,
        artworkColorHex: thread.hex,
        threadColorId: thread.id,
        needleNumber: MACHINE_NEEDLE_ORDER.indexOf(c.name) + 1,
        colorDeltaE: Math.round(Math.random() * 300) / 100,
      },
    });
  }

  const shieldLayers: { name: string; color: string; stitch: "SATIN_STITCH" | "TATAMI_FILL" | "RUNNING_STITCH"; order: number }[] = [
    { name: "White Base", color: "Bright White", stitch: "TATAMI_FILL", order: 1 },
    { name: "Red Fill", color: "Red", stitch: "TATAMI_FILL", order: 2 },
    { name: "Navy Fill", color: "Navy", stitch: "TATAMI_FILL", order: 3 },
    { name: "White Lettering", color: "Bright White", stitch: "SATIN_STITCH", order: 4 },
    { name: "Black Outline", color: "Black", stitch: "RUNNING_STITCH", order: 5 },
  ];
  for (const layer of shieldLayers) {
    const thread = threadByName.get(layer.color)!;
    await prisma.vectorObject.upsert({
      where: { id: `vector_${shieldV3.id}_${layer.order}` },
      update: {},
      create: {
        id: `vector_${shieldV3.id}_${layer.order}`,
        designVersionId: shieldV3.id,
        name: layer.name,
        svgPath: `M ${10 + layer.order * 4} ${10 + layer.order * 4} L ${90 - layer.order * 4} ${10 + layer.order * 4} L ${90 - layer.order * 4} ${90 - layer.order * 4} L ${10 + layer.order * 4} ${90 - layer.order * 4} Z`,
        threadColorId: thread.id,
        stitchType: layer.stitch,
        stitchTypeAuto: layer.stitch,
        stitchDirectionDegrees: [0, 45, 90, 45, 0][layer.order - 1],
        sequenceOrder: layer.order,
        areaSqMm: 400 - layer.order * 20,
        minDetailMm: 1.2,
      },
    });
  }

  await prisma.designProductSetup.upsert({
    where: { designId_productId_locationId: { designId: shieldDesign.id, productId: polo.id, locationId: "loc_polo_left_chest" } },
    update: {},
    create: {
      designId: shieldDesign.id,
      designVersionId: shieldV3.id,
      productId: polo.id,
      locationId: "loc_polo_left_chest",
      setupId: poloSetup.id,
    },
  });

  for (const name of ["Company Crest", "Monogram", "Construction Logo", "Text Logo"]) {
    const design = await prisma.design.upsert({
      where: { id: `design_${name.toLowerCase().replace(/\s+/g, "_")}` },
      update: {},
      create: {
        id: `design_${name.toLowerCase().replace(/\s+/g, "_")}`,
        organizationId: org.id,
        collection: "Sample Library",
        name,
      },
    });
    await prisma.designVersion.upsert({
      where: { designId_versionNumber: { designId: design.id, versionNumber: 1 } },
      update: {},
      create: {
        designId: design.id,
        versionNumber: 1,
        status: "DRAFT",
        createdById: threadByName.has(name) ? admin.id : admin.id,
        widthInches: 3.0,
        heightInches: 3.0,
        detectedColorCount: 12,
        targetColorCount: 5,
        readinessScore: 74,
        readinessClassification: "Good with simplification",
      },
    });
  }

  const job = await prisma.job.upsert({
    where: { jobNumber: "2026-0042" },
    update: {},
    create: {
      organizationId: org.id,
      jobNumber: "2026-0042",
      clientId: client.id,
      status: "READY_FOR_INSTITCH",
      machineId: machine.id,
      createdById: admin.id,
      items: {
        create: [
          {
            designId: shieldDesign.id,
            designVersionId: shieldV3.id,
            productId: polo.id,
            locationId: "loc_polo_left_chest",
            setupId: poloSetup.id,
            garmentColor: "Navy",
            quantity: 24,
          },
        ],
      },
    },
  });

  for (let i = 0; i < 3; i++) {
    await prisma.productionRun.create({
      data: {
        designVersionId: shieldV3.id,
        jobId: i === 0 ? job.id : undefined,
        setupId: poloSetup.id,
        result: i < 2 ? "EXCELLENT" : "ACCEPTABLE",
        issues: i < 2 ? [] : ["poor color"],
        notes: i < 2 ? "Clean registration, no puckering." : "Slight registration drift on high-density fill.",
        recordedById: threadByName.size > 0 ? admin.id : admin.id,
      },
    });
  }

  const tagNames = ["team-logo", "left-chest", "priority"];
  for (const label of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { organizationId_label: { organizationId: org.id, label } },
      update: {},
      create: { organizationId: org.id, label },
    });
    await prisma.tagsOnDesigns.upsert({
      where: { designId_tagId: { designId: shieldDesign.id, tagId: tag.id } },
      update: {},
      create: { designId: shieldDesign.id, tagId: tag.id },
    });
  }

  // ---------------------------------------------------------------------
  // CRM: Accounts, Contacts, Programs, Opportunities, Samples, Monograms
  // ---------------------------------------------------------------------

  const oxford = await prisma.product.upsert({
    where: { id: "product_oxford" },
    update: {},
    create: {
      id: "product_oxford",
      organizationId: org.id,
      name: "Oxford Shirt",
      brand: "School Uniform Co.",
      category: "Oxford Shirt",
      material: "Cotton Poplin",
      fabricWeight: "5.5 oz",
      availableColors: ["White", "Light Blue"],
      cost: 14.5,
    },
  });
  await prisma.embroideryLocation.upsert({
    where: { id: "loc_oxford_left_chest" },
    update: {},
    create: {
      id: "loc_oxford_left_chest",
      productId: oxford.id,
      name: "Left Chest",
      maxWidthInches: 3.5,
      maxHeightInches: 3.5,
      standardWidthMinInches: 3.0,
      standardWidthMaxInches: 3.25,
      recommendedHoop: "4\" x 4\"",
      recommendedStabilizer: "Lightweight tearaway",
      placementNotes: "Centered, 3.5\" below shoulder seam.",
    },
  });

  const hathaway = await prisma.client.upsert({
    where: { id: "client_hathaway" },
    update: {},
    create: {
      id: "client_hathaway",
      organizationId: org.id,
      name: "Hathaway Preparatory School",
      accountType: "SCHOOL_EDUCATION",
      email: "emily.richardson@hathawayprep.edu",
      contactName: "Emily Richardson",
      leadSource: "Referral",
      referralSource: "Westfield Academy",
      relationshipOwnerId: admin.id,
    },
  });

  await Promise.all([
    prisma.contact.upsert({
      where: { id: "contact_hathaway_emily" },
      update: {},
      create: {
        id: "contact_hathaway_emily",
        clientId: hathaway.id,
        name: "Emily Richardson",
        role: "PURCHASING",
        title: "Uniform Coordinator",
        email: "emily.richardson@hathawayprep.edu",
        phone: "(203) 555-0198",
        preferredContactMethod: "Email",
      },
    }),
    prisma.contact.upsert({
      where: { id: "contact_hathaway_head" },
      update: {},
      create: {
        id: "contact_hathaway_head",
        clientId: hathaway.id,
        name: "Dr. Marcus Hale",
        role: "EXECUTIVE_SPONSOR",
        title: "Head of School",
      },
    }),
    prisma.contact.upsert({
      where: { id: "contact_hathaway_ap" },
      update: {},
      create: {
        id: "contact_hathaway_ap",
        clientId: hathaway.id,
        name: "Diane Foster",
        role: "ACCOUNTS_PAYABLE",
        title: "Business Manager",
      },
    }),
  ]);

  const hathawayCrestDesign = await prisma.design.upsert({
    where: { id: "design_hathaway_crest" },
    update: {},
    create: {
      id: "design_hathaway_crest",
      organizationId: org.id,
      clientId: hathaway.id,
      collection: "Approved Standards",
      name: "Hathaway Preparatory Crest",
    },
  });
  await prisma.designVersion.upsert({
    where: { designId_versionNumber: { designId: hathawayCrestDesign.id, versionNumber: 1 } },
    update: {},
    create: {
      designId: hathawayCrestDesign.id,
      versionNumber: 1,
      status: "READY_FOR_INSTITCH",
      createdById: admin.id,
      widthInches: 3.25,
      heightInches: 3.25,
      detectedColorCount: 14,
      targetColorCount: 4,
      readinessScore: 91,
      readinessClassification: "Excellent for embroidery",
    },
  });

  const hathawayProgram = await prisma.program.upsert({
    where: { id: "program_hathaway_uniforms" },
    update: {},
    create: {
      id: "program_hathaway_uniforms",
      clientId: hathaway.id,
      name: "Hathaway Preparatory — Student Uniform Program",
      description: "Approved crest, placements, and thread palette for all student and faculty apparel.",
      status: "ACTIVE",
    },
  });

  await Promise.all([
    prisma.programProduct.upsert({
      where: { id: "program_item_hathaway_polo" },
      update: {},
      create: {
        id: "program_item_hathaway_polo",
        programId: hathawayProgram.id,
        productId: polo.id,
        locationId: "loc_polo_left_chest",
        designId: hathawayCrestDesign.id,
        setupId: poloSetup.id,
      },
    }),
    prisma.programProduct.upsert({
      where: { id: "program_item_hathaway_oxford" },
      update: {},
      create: {
        id: "program_item_hathaway_oxford",
        programId: hathawayProgram.id,
        productId: oxford.id,
        locationId: "loc_oxford_left_chest",
        designId: hathawayCrestDesign.id,
      },
    }),
  ]);

  for (const name of ["Gold", "Navy", "Bright White"]) {
    const thread = threadByName.get(name)!;
    await prisma.programThreadColor.upsert({
      where: { programId_threadColorId: { programId: hathawayProgram.id, threadColorId: thread.id } },
      update: {},
      create: {
        programId: hathawayProgram.id,
        threadColorId: thread.id,
        roleLabel: name === "Gold" ? "Primary" : "Accent",
      },
    });
  }

  await prisma.opportunity.upsert({
    where: { id: "opportunity_hathaway_faculty" },
    update: {},
    create: {
      id: "opportunity_hathaway_faculty",
      organizationId: org.id,
      clientId: hathaway.id,
      programId: hathawayProgram.id,
      name: "Hathaway Preparatory — Faculty Apparel Program",
      potentialValue: 12500,
      stage: "SAMPLING",
      nextAction: "Review cardigan embroidery sample",
      nextActionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.sample.upsert({
    where: { id: "sample_hathaway_cardigan" },
    update: {},
    create: {
      id: "sample_hathaway_cardigan",
      clientId: hathaway.id,
      programId: hathawayProgram.id,
      name: "Hathaway Cardigan Crest Sample",
      status: "APPROVED",
      notes: "Client prefers Antique Gold over Bright Gold.",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  const wardHousehold = await prisma.client.upsert({
    where: { id: "client_ward_household" },
    update: {},
    create: {
      id: "client_ward_household",
      organizationId: org.id,
      name: "Ward Household",
      accountType: "FAMILY_HOUSEHOLD",
      contactName: "James Ward",
      leadSource: "Referral",
    },
  });

  const goldThread = threadByName.get("Gold")!;
  await prisma.monogramProfile.upsert({
    where: { id: "monogram_james_ward" },
    update: {},
    create: {
      id: "monogram_james_ward",
      clientId: wardHousehold.id,
      personName: "James H. Ward III",
      monogramText: "JHW",
      style: "Classic Serif",
      arrangement: "Traditional Center Initial",
      threadColorId: goldThread.id,
      preferredSizeInches: 1.25,
      savedApplications: ["Dress Shirt Cuff", "Dress Shirt Chest", "Bath Towel", "Linen Napkin", "Garment Bag"],
    },
  });

  console.log("Seed complete:", {
    org: org.name,
    users: 7,
    threadColors: PALETTE_ORDER.length,
    machine: machine.name,
    products: 6,
    designs: 6,
    job: job.jobNumber,
    accounts: 2,
    program: hathawayProgram.name,
  });
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
