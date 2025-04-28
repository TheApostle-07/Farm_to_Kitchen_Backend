import admin from 'firebase-admin'
import serviceAccount from '../../src/config/firebase-service-account.json'

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
})

export const firebaseAdmin = admin