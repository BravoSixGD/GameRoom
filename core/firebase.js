import { firebaseConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getDatabase(app);
export async function login(){if(!auth.currentUser) await signInAnonymously(auth);return auth.currentUser}
export {db,ref,get,set,update,onValue,onDisconnect,auth};
