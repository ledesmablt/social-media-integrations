import React, { useState, useEffect } from 'react';
import axios from 'axios';
import firebase from './../Firebase';

// @ts-ignore
import FB from 'fb';

const appCredentials = require('./../../credentials.json');
const facebookCredentials = appCredentials.facebook;

// firebase init
let db = firebase.firestore();
var provider = new firebase.auth.FacebookAuthProvider();
provider.addScope('email');
provider.addScope('manage_pages');

const fbGraph = "https://graph.facebook.com/v6.0/";


function PageData() {
  const [ currentUser, setCurrentUser ] = useState<string>();
  const [ fbPages, setFbPages ] = useState([{}]);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user: any) => {
      // get the currently logged in user
      setCurrentUser(user.uid);
    });
  });

  const getPageData = (): void => {
    return
  }



  return (
    <div className="AuthContainer">
      <h1>Page Data</h1>
      <button onClick={getPageData}>Get Page Data</button>
      <div className="FbPageDetails">
      </div>
    </div>
  )
}

export default PageData;