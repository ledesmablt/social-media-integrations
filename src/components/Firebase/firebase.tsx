import * as firebase from 'firebase/app';

import 'firebase/auth';
import 'firebase/firestore';

// firebase init
const appCredentials = require('./../../credentials.json');
firebase.initializeApp(appCredentials.firebase);

export default firebase;