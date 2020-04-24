import React from 'react';
import './App.css';

import Login from './components/Login';
import PageData from './components/PageData';
import EventData from './components/EventData';

function App() {
  return (
    <div className="App">
      <Login />
      <PageData />
      <EventData />
    </div>
  );
}

export default App;
