import React, { useState, useEffect } from 'react';
import axios from 'axios';
import firebase from './../Firebase';

// @ts-ignore
import FB from 'fb';

// need to move this to a cloud function
// require('dotenv').config();
const facebookCredentials = {
  clientId: process.env.REACT_APP_FB_CLIENT,
  clientSecret: process.env.REACT_APP_FB_SECRET
};

// firebase init
let db = firebase.firestore();
var functions: firebase.functions.Functions;
if (process.env.NODE_ENV === "development") {
  functions = firebase.functions();
  functions.useFunctionsEmulator("http://localhost:5001");
}
else {
  functions = firebase.app().functions("asia-east2");
}
var provider = new firebase.auth.FacebookAuthProvider();
provider.addScope('email');
provider.addScope('manage_pages');

const fbGraph = "https://graph.facebook.com/v6.0/";


function Login() {
  const [ currentUser, setCurrentUser ] = useState<firebase.User | null>();
  const [ fbPages, setFbPages ] = useState<Array<any>>();

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      // get the currently logged in user
      setCurrentUser(user);
    });
  })

  const signOut = () => {
    firebase.auth().signOut().then((res) => {
      setCurrentUser(null)
    })
  }


  const facebookSignUp = (): void => {
    firebase.auth().signInWithPopup(provider).then(async (result: any) => {
      var fbSignUp = functions.httpsCallable('fbSignUp');
      // user gets saved to firebase auth already (result.user)
      const uid: string = result.user.uid;
      const tempAccessToken: string = result.credential!.accessToken;
      fbSignUp({ uid, tempAccessToken }).catch((err) => {
        console.error(err)
      });
      return
      
      // get long-lived user access token
      console.log('getting FB long-lived access token')
      const fbGraphRes: any = await axios.get(
        fbGraph + decodeURI(`
          oauth/access_token
            ?grant_type=fb_exchange_token&
            client_id=${facebookCredentials.clientId}&
            client_secret=${facebookCredentials.clientSecret}&
            fb_exchange_token=${tempAccessToken}
          `).replace(/ /g, "")
      );
      const accessToken = fbGraphRes.data.access_token;
          
      // get facebook userid using old access token
      FB.setAccessToken(tempAccessToken);
      console.log('getting FB userid')
      const fbUserRes: any = await FB.api('me');
      const userId: string = fbUserRes.id;
            
      // save firestore creds based on facebook login
      console.log('saving to Firestore');
      let ref = db.collection('users').doc(uid);
      await ref.set({
        auth: {
          facebook: { userId, accessToken }
        }
      });
    }).catch((error: any) => {
      console.error(error);
    });
  }

  const listFacebookPages = async () => {
    var userDoc = db.collection('users').doc(currentUser!.uid);
    const doc = await userDoc.get();
    if (!doc.exists) {
      console.log('user not logged in!');
      return
    }
      
    let userPagesRef = userDoc.collection('pages');
    const pageDocs = await userPagesRef.get();
    if (pageDocs.docs.length > 0) {
      console.log('getting data from firestore')
      const firestorePages: Array<any> = pageDocs.docs.map((doc) => doc.data());
      setFbPages(firestorePages);
      return
    }

    // user long-lived access token to get allowed pages (from signup)
    FB.setAccessToken(doc!.data()!.auth.facebook.accessToken);
    console.log('getting data from Facebook');
    const result: any = await FB.api('me/accounts');
    const fbPages: Array<any> = result.data;
    setFbPages(fbPages);
    for(let page of fbPages) {
      userDoc.collection('pages')
        .doc(page.id).set(page)
        .catch(err => {
          console.error(err)
        })
    }
  }

  useEffect(() => {
    if (currentUser && typeof fbPages === 'undefined') {
      listFacebookPages();
    }
  });

  const pageElements = fbPages?.map((pageData: any) => (
    <li key={pageData.id}>{ pageData.name }</li>
  ))

  return (
    <div className="AuthContainer">
      <h1>Login</h1>
      <button onClick={facebookSignUp}>Sign Up with Facebook</button>
      <button onClick={listFacebookPages}>List my Pages</button>
      <button onClick={signOut}>Sign Out</button>
      <h2>My Facebook Pages</h2>
      <div className="ManagedFbPages">
        { pageElements }
      </div>
    </div>
  )
}

export default Login;