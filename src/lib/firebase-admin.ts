
import * as admin from 'firebase-admin';

// This function centralizes the initialization of the Firebase Admin SDK.
// It ensures that the app is only initialized once.
export function initializeFirebaseAdmin() {
  // Check if the app is already initialized to prevent errors.
  if (admin.apps.length === 0) {
    // When running in a Google Cloud environment (like App Hosting),
    // the Admin SDK can automatically detect the service account credentials.
    // Therefore, we don't need to pass any arguments to initializeApp().
    admin.initializeApp();
  }
}
