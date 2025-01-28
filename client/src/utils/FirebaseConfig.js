import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDnKsrF37GbvSyUGM2YjRljeRgz-5PF3B4",
    authDomain: "pingbond-3dbf1.firebaseapp.com",
    projectId: "pingbond-3dbf1",
    storageBucket: "pingbond-3dbf1.appspot.com",
    messagingSenderId: "368956106948",
    appId: "1:368956106948:web:b87b377e46cc2369db4191",
    measurementId: "G-6B3LR7YC8J"
  };


  const app = initializeApp(firebaseConfig);
  export const firebaseAuth=getAuth(app);