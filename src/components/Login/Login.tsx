import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as firebase from 'firebase/app';

// @ts-ignore
import FB from 'fb';

import 'firebase/auth';
import 'firebase/firestore';

const appCredentials = require('./../../credentials.json');
const firebaseCredentials = appCredentials.firebase;
const facebookCredentials = appCredentials.facebook;

// firebase init
firebase.initializeApp(firebaseCredentials);
let db = firebase.firestore();
var provider = new firebase.auth.FacebookAuthProvider();
provider.addScope('email');
provider.addScope('manage_pages');

const fbGraph = "https://graph.facebook.com/v6.0/";



function Login() {
  const [ currentUser, setCurrentUser ] = useState<string>();
  const [ fbPages, setFbPages ] = useState([{}]);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user: any) => {
      // get the currently logged in user
      setCurrentUser(user.uid);
    });
  })


  const facebookSignUp = (): void => {
    firebase.auth().signInWithPopup(provider).then((result: any) => {
      // user gets saved to firebase auth already (result.user)
      const uid: string = result.user.uid;
      const tempAccessToken: string = result.credential!.accessToken;
      
      // get long-lived user access token
      console.log('getting FB long-lived access token')
      axios.get(fbGraph + decodeURI(`
        oauth/access_token
          ?grant_type=fb_exchange_token&
          client_id=${facebookCredentials.clientId}&
          client_secret=${facebookCredentials.clientSecret}&
          fb_exchange_token=${tempAccessToken}
        `).replace(/ /g, "")
        ).then((res: any) => {
          const accessToken = res.data.access_token;
          
          // get facebook userid using old access token
          FB.setAccessToken(tempAccessToken);
          console.log('getting FB userid')
          FB.api('me', (res: any) => {
            const userId: string = res.id;
            
            // save firestore creds based on facebook login
            console.log('saving to Firestore');
            let ref = db.collection('users').doc(uid);
            let setAuth = ref.update({
              auth: {
                facebook: { userId, accessToken }
              }
            });
            setAuth.catch((err) => {
              console.error(err);
            });
          });
        })
    }).catch(function(error) {
      console.error(error);
    });
  }

  const listFacebookPages = (): void => {
    var userDoc = db.collection('users').doc(currentUser);
    userDoc.get().then((doc: any) => {
      if (!doc.exists) {
        console.log('user not authenticated for Facebook!');
        return
      }
      
      let firestorePages = doc.data().pages;
      if (firestorePages) {
        console.log('getting data from Firestore');
        setFbPages(firestorePages);
        return
      }

      // user long-lived access token to get allowed pages (from signup)
      FB.setAccessToken(doc.data().facebook.accessToken);
      console.log('getting data from Facebook');
      FB.api('me/accounts').then((result: any) => {
        const pages: Array<Object> = result.data;
        userDoc.update({ pages })
          .catch(err => {
            console.error(err);
          });
        setFbPages(pages);
      })
    })
  }

  useEffect(() => {
    if (currentUser && Object.keys(fbPages[0]).length === 0) {
      listFacebookPages();
    }
  });

  const pageElements = fbPages.map((pageData: any) => (
    (pageData.name) ? <li key={pageData.id}>{ pageData.name }</li> : null
  ))

  return (
    <div className="AuthContainer">
      <h1>Login</h1>
      <button onClick={facebookSignUp}>Sign Up with Facebook</button>
      <button onClick={listFacebookPages}>List my Pages</button>
      <h2>My Facebook Pages</h2>
      <div className="ManagedFbPages">
        { pageElements }
      </div>
    </div>
  )
}

export default Login;