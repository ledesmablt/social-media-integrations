import React, { useState, useEffect } from 'react';
import firebase from './../Firebase';

// @ts-ignore
import FB from 'fb';

import './EventData.css';

// firebase init
let db = firebase.firestore();


function EventData() {
  const [ currentUser, setCurrentUser ] = useState<firebase.User | null>();
  const [ fbEvents, setFbEvents ] = useState<Array<any>>();

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      // get the currently logged in user
      setCurrentUser(user);
    });
  });

  const getPagesEvents = async () => {
    // get user's fb access token
    const uid = currentUser!.uid;
    var userData = await db.collection('users').doc(uid).get();
    const { accessToken } = userData.data()!.auth.facebook;
    
    // get events under user accounts
    const fields = 'events.limit(10){name,owner,is_page_owned,start_time,end_time,updated_time,place,cover,description}';
    FB.setAccessToken(accessToken);
    FB.api('me/accounts', { fields }).then((fbResult: any) => {
      // add fb page details to pages doc
      const fbResultEvents = fbResult.data.map((pageEvents: any) => pageEvents.events.data).flat();
      for(let fbEvent of fbResultEvents) {
        console.log(fbEvent)
        const { id, ...eventData } = fbEvent;
        const eventDoc = db.collection('events').doc(id);
        eventDoc.set(eventData);
      }
      setFbEvents(fbResultEvents);

    }).catch((err: Error) => {
      console.error(err);
    })
  }

  const facebookEvents = fbEvents?.map((eventData: any) => {
    console.log(eventData)
    let { id, name, owner, start_time, end_time, place, cover, description } = eventData;
    const formatTime = (timeStr: string) => {
      return (!timeStr) ? null : (new Date(timeStr)).toLocaleTimeString();
    }
    return (
      <div key={id} className="FbEventData">
        <h3>{ name }</h3>
        { (owner) ? <h4>by { owner.name }</h4> : null }
        { (cover) ? <img src={cover.source} alt={name}></img> : null }
        <br />
        <b>{ place.name }</b>
        <b>{ formatTime(start_time) } to { formatTime(end_time) }</b>
        <p>{ description }</p>
      </div>
    )
  })



  return (
    <div className="AuthContainer">
      <h1>Event Data</h1>
      <button onClick={getPagesEvents}>Get Events from my Pages</button>
      <div className="FbPageDetails">
        { facebookEvents }
      </div>
    </div>
  )
}

export default EventData;