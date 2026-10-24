async function seed() {
  console.log('Seeding database...');

  console.log('Seed completed!');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
