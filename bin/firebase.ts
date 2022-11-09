import {initializeApp} from 'firebase/app'
import {getFirestore, doc, collection, getDoc} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyC0gL88RJhVdcQ8gufZ-rm1PO113FDDtnQ",
  authDomain: "gupta-url-shortener.firebaseapp.com",
  projectId: "gupta-url-shortener",
  storageBucket: "gupta-url-shortener.appspot.com",
  messagingSenderId: "742413995019",
  appId: "1:742413995019:web:572d5ff168edf9b8a74b0e",
  measurementId: "G-X9G5QMNMT7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const firestore = getFirestore(app);

export default firestore;