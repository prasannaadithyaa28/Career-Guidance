const admin = require('firebase-admin');

// IMPORTANT: Add your Firebase Admin SDK serviceAccountKey.json file in the backend folder
// and reference it here, or set environment variables.
// For this scaffolding, we initialize a placeholder/mock behavior if credentials are missing
// or we can initialize without credentials (useful if running in Firebase Cloud Functions, 
// or require the developer to provide their own for local usage).

try {
  // const serviceAccount = require('./serviceAccountKey.json');
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount)
  // });
  
  // Since we don't have the user's config, we expose the mock/stub for now or assume they'll fill it.
  console.log("Firebase Admin initialized (placeholder). Please add serviceAccountKey.json to fully connect to Firestore.");
} catch (error) {
  console.error("Firebase admin init error:", error);
}

// In a real app, db would be admin.firestore()
// We'll export a mock db that mimics firestore methods for demonstration if admin isn't fully set up,
// or just export the actual admin.firestore if it is.

// Simplified mock functions to prevent crash before user provides credentials:
const createMockDb = () => {
    const memoryStore = {};
    return {
        collection: (colName) => ({
            doc: (docId) => ({
                set: async (data) => {
                    if(!memoryStore[colName]) memoryStore[colName] = {};
                    memoryStore[colName][docId] = data;
                    return data;
                },
                get: async () => {
                    const data = memoryStore[colName]?.[docId];
                    return {
                        exists: !!data,
                        data: () => data
                    };
                },
                update: async (data) => {
                    if(memoryStore[colName] && memoryStore[colName][docId]) {
                        memoryStore[colName][docId] = { ...memoryStore[colName][docId], ...data };
                    }
                    return;
                }
            })
        })
    };
};

// Use actual admin.firestore() if initialized properly, otherwise use mock DB.
let db;
try {
  db = admin.firestore();
} catch (e) {
  db = createMockDb();
}

module.exports = { admin, db };
