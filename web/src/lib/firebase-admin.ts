import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT
    ) as ServiceAccount;
    return initializeApp({ credential: cert(serviceAccount) });
  }

  // Fallback: projectId 기반 (공개키로 토큰 검증)
  return initializeApp({ projectId: "ibkbaas-franchise-dashboard" });
}

const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
