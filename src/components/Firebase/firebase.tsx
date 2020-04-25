import * as firebase from 'firebase/app';

import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';

// firebase init
const firebaseCredentials = {
  "apiKey": "AIzaSyAYPjVpvtV2Crb6TZbHsfYxMICn9TROcAY",
  "authDomain": "socmed-81943653.firebaseapp.com",
  "databaseURL": "https://socmed-81943653.firebaseio.com",
  "projectId": "socmed-81943653",
  "storageBucket": "socmed-81943653.appspot.com",
  "messagingSenderId": "439160212397",
  "appId": "1:439160212397:web:d087bbc975e005b49d6f24"
};
firebase.initializeApp(firebaseCredentials);

export default firebase;