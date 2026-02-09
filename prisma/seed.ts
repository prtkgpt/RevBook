import { PrismaClient } from "@prisma/client";
import { addDays, addHours, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.messageLog.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.discountRule.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  // Create business
  const business = await prisma.business.create({
    data: {
      name: "Demo Salon",
      timezone: "America/New_York",
      bookingBaseUrl: "https://example.com/book",
    },
  });
  console.log("Created business:", business.name);

  // Create owner user
  const user = await prisma.user.create({
    data: {
      email: "owner@demo.com",
      name: "Demo Owner",
      role: "OWNER",
      businessId: business.id,
      emailVerified: new Date(),
    },
  });
  console.log("Created user:", user.email);

  // Create slots for next 7 days
  const serviceTypes = ["Haircut", "Massage", "Facial", "Manicure"];
  const now = new Date();
  const slots = [];

  for (let day = 0; day < 7; day++) {
    const date = addDays(now, day);
    for (const serviceType of serviceTypes) {
      const startHour = 9 + Math.floor(Math.random() * 8); // 9am-4pm
      const start = setMinutes(setHours(date, startHour), 0);
      const end = addHours(start, 1);

      const capacity = serviceType === "Massage" ? 1 : Math.floor(Math.random() * 4) + 1;
      const bookedCount = Math.floor(Math.random() * (capacity + 1));
      const basePriceCents = [3000, 8000, 6000, 2500][serviceTypes.indexOf(serviceType)];

      slots.push({
        businessId: business.id,
        serviceType,
        startTime: start,
        endTime: end,
        capacity,
        bookedCount,
        basePriceCents,
        status: bookedCount >= capacity ? "FULL" as const : "OPEN" as const,
      });
    }
  }

  await prisma.slot.createMany({ data: slots });
  console.log(`Created ${slots.length} slots`);

  // Create discount rules
  const rules = [
    {
      businessId: business.id,
      name: "Last-minute deal",
      enabled: true,
      priority: 10,
      hoursBeforeSlot: 24,
      maxBookedPercent: 50,
      discountPercent: 25,
    },
    {
      businessId: business.id,
      name: "Weekday afternoon special",
      enabled: true,
      priority: 5,
      daysOfWeek: "1,2,3,4,5",
      afterTimeOfDay: "14:00",
      maxBookedPercent: 75,
      discountPercent: 15,
    },
    {
      businessId: business.id,
      name: "Empty slot rescue",
      enabled: true,
      priority: 20,
      hoursBeforeSlot: 6,
      maxBookedPercent: 25,
      discountPercent: 40,
    },
  ];

  await prisma.discountRule.createMany({ data: rules });
  console.log(`Created ${rules.length} discount rules`);

  // Create customers
  const customers = [
    { businessId: business.id, name: "Alice Johnson", email: "alice@example.com", phone: "+15551234001", tags: "Haircut,Facial" },
    { businessId: business.id, name: "Bob Smith", email: "bob@example.com", phone: "+15551234002", tags: "Massage" },
    { businessId: business.id, name: "Carol Davis", email: "carol@example.com", phone: "+15551234003", tags: "Manicure,Facial" },
    { businessId: business.id, name: "David Wilson", email: "david@example.com", tags: "Haircut,Massage" },
    { businessId: business.id, name: "Eve Brown", email: "eve@example.com", phone: "+15551234005", tags: "Haircut,Massage,Facial,Manicure" },
  ];

  await prisma.customer.createMany({ data: customers });
  console.log(`Created ${customers.length} customers`);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
