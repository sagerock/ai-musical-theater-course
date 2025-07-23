/**
 * Debug script to test reflection data retrieval
 * Run this in browser console to test the actual API response
 */

// Test the exact API calls used by instructor dashboard
const { chatApi } = require('./src/services/supabaseApi');

async function testReflectionRetrieval() {
  console.log('🔍 Testing reflection data retrieval...');
  
  try {
    // Test 1: Get specific chat with reflection
    console.log('\n📋 Test 1: Get specific chat with reflection');
    const chatId = '00ddf304-7844-4389-9810-fce241275fe4'; // Chat with known reflection
    const specificChat = await chatApi.getChatById(chatId);
    console.log('Specific chat result:', JSON.stringify(specificChat, null, 2));
    console.log('Reflections array:', specificChat.reflections);
    console.log('Has reflections?', specificChat.reflections && specificChat.reflections.length > 0);

    // Test 2: Get chats with filters (instructor dashboard method)
    console.log('\n📊 Test 2: Get chats with filters (instructor dashboard method)');
    const courseId = '0063da9d-0890-41f9-b63a-f72e7ffdc8a9';
    const filteredChats = await chatApi.getChatsWithFilters({ courseId: courseId, limit: 10 });
    console.log('Filtered chats count:', filteredChats.length);
    
    // Check each chat for reflections
    filteredChats.forEach((chat, index) => {
      console.log(`Chat ${index + 1} (${chat.id}):`, {
        prompt: chat.prompt?.substring(0, 50) + '...',
        hasReflections: chat.reflections && chat.reflections.length > 0,
        reflectionsCount: chat.reflections?.length || 0,
        reflections: chat.reflections
      });
    });

    // Test 3: Check specific chats that should have reflections
    console.log('\n🎯 Test 3: Check specific chats that should have reflections');
    const chatIdsWithReflections = [
      '00ddf304-7844-4389-9810-fce241275fe4',
      '9d46b549-c75e-49c1-a1d8-b71e92a752ad'
    ];

    for (const chatId of chatIdsWithReflections) {
      const chat = filteredChats.find(c => c.id === chatId);
      if (chat) {
        console.log(`Chat ${chatId}:`, {
          found: true,
          reflections: chat.reflections,
          reflectionsType: typeof chat.reflections,
          isArray: Array.isArray(chat.reflections)
        });
      } else {
        console.log(`Chat ${chatId}: NOT FOUND in filtered results`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment - can be run in console
  window.testReflectionRetrieval = testReflectionRetrieval;
  console.log('💡 Run window.testReflectionRetrieval() in browser console to test');
} else {
  // Node environment - run immediately
  testReflectionRetrieval();
}