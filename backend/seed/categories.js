const Category = require('../models/Category');
const categoryJson = require('../category.json');

// const categories = categoryJson
//   .filter(cat => cat.categoryName && cat.image)
//   .map(cat => ({
//     name: cat.categoryName,
//     icon: cat.image,
//     description: cat.categoryName
//   }));

const seedCategories = async () => {
  try {
    const indexes = await Category.collection.indexes();
    const nameIndex = indexes.find(index => index.name === 'name_1');
    if (nameIndex) {
      await Category.collection.dropIndex('name_1');
      console.log('🧹 Dropped old name_1 index');
    }

    await Category.collection.updateMany(
      { name: { $exists: false }, categoryName: { $exists: true } },
      [
        { $set: { name: '$categoryName', icon: '$image', description: '$categoryName' } },
        { $unset: ['categoryName', 'image'] }
      ]
    );

    const count = await Category.countDocuments();
    console.log(`Current category count: ${count}`);
    if (count === 0) {
      await Category.insertMany(categoryJson);
      console.log('✅ Categories seeded');
    } else {
      console.log('ℹ️ Categories collection already contains data, skipping seed.');
    }
  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
  }
};

if (require.main === module) {
  seedCategories().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedCategories;