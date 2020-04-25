import React, { useState, useEffect } from 'react';
import firebase, { functions, auth } from './../Firebase';

// @ts-ignore
import FB from 'fb';


// firebase init
let db = firebase.firestore();
const { facebookProvider } = auth;

function Login() {
  const [ currentUser, setCurrentUser ] = useState<firebase.User | null>();
  const [ fbPages, setFbPages ] = useState<Array<any>>();

  useEffect(() => {
    // get the currently logged in user
    firebase.auth().onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
  })

  const signOut = () => {
    firebase.auth().signOut().then((res) => {
      setCurrentUser(null)
    })
  }

  const facebookSignUp = () => {
    // sign up (saved to firebase.auth) and call function to get long-lived token
    firebase.auth().signInWithPopup(facebookProvider).then(async (result: any) => {
      var fbSignUp = functions.httpsCallable('fbSignUp');
      const tempAccessToken: string = result.credential!.accessToken;
      return fbSignUp({ tempAccessToken }).catch(console.error);
    }).catch(console.error);
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