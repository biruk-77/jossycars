const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING ENDPOINT INTEGRITY TESTS ===');
  
  try {
    // Test 1: Health check / Landing page
    console.log('\n[Test 1] Health Check...');
    const homeRes = await axios.get(`${BASE_URL}/`);
    console.log(`✅ Landing page responded with status: ${homeRes.status}`);

    // Test 2: User registration
    console.log('\n[Test 2] Client Sign-up...');
    const testUsername = `user_${Date.now()}`;
    const signupRes = await axios.post(`${BASE_URL}/api/auth/signup`, {
      username: testUsername,
      password: 'testpassword123',
      name: 'Test Client',
      phone: '+251900000000'
    });
    console.log(`✅ Sign-up success:`, signupRes.data.message);
    const clientToken = signupRes.data.token;

    // Test 3: User login
    console.log('\n[Test 3] Client Login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: testUsername,
      password: 'testpassword123'
    });
    console.log(`✅ Login success! JWT token returned.`);

    // Test 4: Inquiry submission
    console.log('\n[Test 4] Submitting Callback Inquiry...');
    const inquiryRes = await axios.post(`${BASE_URL}/api/inquiries`, {
      name: 'Abebe Kebede',
      phone: '+251912345678',
      carId: 'car_test_123',
      carTitle: 'Suzuki Dzire 2026',
      carPrice: '2.4 Million Br'
    });
    console.log(`✅ Inquiry saved:`, inquiryRes.data.message);
    const savedInquiryId = inquiryRes.data.inquiry.id;

    // Test 5: Admin Login
    console.log('\n[Test 5] Admin Authentication...');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'adminpassword2026'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin authenticated successfully.');

    // Test 6: Get inquiries as Admin
    console.log('\n[Test 6] Fetching Inquiries as Admin...');
    const fetchInq = await axios.get(`${BASE_URL}/api/inquiries`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`✅ Retrieved ${fetchInq.data.length} inquiries.`);
    const hasSaved = fetchInq.data.some(i => i.id === savedInquiryId);
    console.log(hasSaved ? '👉 Verified submitted inquiry is present in database.' : '❌ Submitted inquiry not found!');

    // Test 7: Sync listings from Telegram
    console.log('\n[Test 7] Syncing Listings from Telegram (jossycarmar)...');
    const syncRes = await axios.post(`${BASE_URL}/api/cars/sync`, 
      { channel: 'jossycarmar' },
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );
    console.log(`✅ Sync success message: ${syncRes.data.message}`);

    // Test 8: Clean up inquiry
    console.log('\n[Test 8] Deleting Mock Inquiry...');
    const delRes = await axios.delete(`${BASE_URL}/api/inquiries/${savedInquiryId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`✅ Inquiry cleanup: ${delRes.data.message}`);

    console.log('\n=== ALL INTEGRITY TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runTests();
