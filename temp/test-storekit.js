// Test StoreKit Configuration
// Add this to your RevenueCat service temporarily to debug

const testStoreKit = async () => {
  try {
    console.log('🧪 Testing StoreKit Configuration...');

    // Check if products are available
    const offerings = await Purchases.getOfferings();
    console.log('📦 Offerings:', offerings);

    if (offerings.current) {
      console.log('✅ Current offering found:', offerings.current.identifier);
      console.log('📱 Available packages:', offerings.current.availablePackages.length);

      offerings.current.availablePackages.forEach((pkg, index) => {
        console.log(`   ${index + 1}. ${pkg.identifier} - ${pkg.product.price}`);
      });
    } else {
      console.log('❌ No current offering found');
      console.log('🔍 All offerings:', Object.keys(offerings.all));
    }

  } catch (error) {
    console.error('❌ StoreKit test failed:', error);
    console.error('Error details:', error.message);
  }
};

export default testStoreKit;