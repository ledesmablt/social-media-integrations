import * as functions from 'firebase-functions';
// @ts-ignore
import * as admin from 'firebase-admin';

// @ts-ignore
import FB from 'fb';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();
const fbGraph = "https://graph.facebook.com/v6.0/";
const credentials = functions.config().credentials;

const fbSignUp = functions.region("asia-east2").https.onCall(async (data, context) => {
  // user gets saved to firebase auth already (result.user)
  const { uid } = context.auth!;
  const { tempAccessToken } = data;
  
  // get long-lived user access token
  console.log('getting FB long-lived access token');
  const fbTokenUrl = fbGraph + decodeURI(`
    oauth/access_token
    ?grant_type=fb_exchange_token&
    client_id=${credentials.facebook.clientId}&
    client_secret=${credentials.facebook.clientSecret}&
    fb_exchange_token=${tempAccessToken}
  `).replace(/( |\n)/g, "");
  const fbGraphRes: any = await axios.get(fbTokenUrl);
  const accessToken = fbGraphRes.data.access_token;
      
  // get facebook userid using old access token
  FB.setAccessToken(tempAccessToken);
  console.log('getting FB userid')
  const fbUserRes: any = await FB.api('me');
  const userId: string = fbUserRes.id;
      
  // save firestore creds based on facebook login
  console.log('saving to Firestore');
  const ref = db.collection('users').doc(uid);
  return await ref.set({
    auth: {
        facebook: { userId, accessToken }
    }
  });
})

export {
  fbSignUp
}