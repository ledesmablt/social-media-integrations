import React, { useState, useEffect } from 'react';
import firebase from './../Firebase';

// @ts-ignore
import FB from 'fb';

// firebase init
let db = firebase.firestore();
var provider = new firebase.auth.FacebookAuthProvider();
provider.addScope('email');
provider.addScope('manage_pages');


function PageData() {
  const [ currentUser, setCurrentUser ] = useState<firebase.User | null>();
  const [ fbPages, setFbPages ] = useState<Array<any>>();

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      // get the currently logged in user
      setCurrentUser(user);
    });
  });

  const getFacebookPages = async () => {
    console.log('getting page data from firebase');
    var userPages = db.collection('pages').where('uid', '==', currentUser!.uid);
    const fbPagesFirebase = await userPages.get();
    setFbPages(fbPagesFirebase.docs.map((doc: any) => doc.data()));
  }

  const syncPageData = async () => {
    // get user's fb pages
    const uid = currentUser!.uid;
    var userDoc = db.collection('users').doc(uid);
    const fbPages = await userDoc.collection('pages').get();
    console.log('getting data from facebook');
    const pagePromises = fbPages.docs.map((pageDoc: any) => {
      const { access_token, id, name, category } = pageDoc.data();
      const requestFields = {
        fields: 'about,bio,location,website'
      };

      FB.setAccessToken(access_token);
      return FB.api(id, requestFields).then((result: any) => {
        // add fb page details to pages doc
        const { pageId, ...pageResults } = result;
        const pageData = { uid, name, category, ...pageResults };
        var pageDoc = db.collection('pages').doc(result.id);
        return pageDoc.get().then((snap) => {
          const addPagePromise = (snap.exists)
            ? pageDoc.update(pageData)
            : pageDoc.set(pageData);
          return addPagePromise.then(() => {
            return {...pageData}
          });
          }
        );
      }).catch((err: Error) => {
        console.error(err);
      })
    });
    Promise.all(pagePromises).then((fbPagesRes: any) => {
      setFbPages(fbPagesRes);
    })
  }

  useEffect(() => {
    if (currentUser && typeof fbPages === 'undefined') {
      getFacebookPages();
    }
  });

  const facebookPages = fbPages?.map((pageData: any) => {
    let { about, category, name, website } = pageData;
    return (
      <div key={name} className="FbPageData">
        <h3>{ name }</h3>
        <b>{ category }</b>
        <p>{ about }</p>
        { (!website) ? null : <p>{ website }</p> }
      </div>
    )
  })



  return (
    <div className="AuthContainer">
      <h1>Page Data</h1>
      <button onClick={syncPageData}>Sync Page Data</button>
      <div className="FbPageDetails">
        { facebookPages }
      </div>
    </div>
  )
}

export default PageData;