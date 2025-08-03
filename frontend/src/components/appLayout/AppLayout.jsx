import React from 'react';
import Login from '../login/Login';
import {BrowserRouter as Router , Routes , Route , Navigate} from 'react-router-dom';
import Navlink from '../navbar/Navlink';
import Events from '../../pages/student/events/Events';
import EventSummary from '../../pages/student/eventSummary/EventSummary';
import Approvals from '../../pages/admin/approvals/Approvals';
import EventHistory from '../../pages/admin/eventHistory/EventHistory';
import SummaryApprovals from '../../pages/admin/summaryApprovals/summaryApprovals';
import EventAnalyzer from '../../pages/admin/eventanalyzer/EventAnalyzer';
import RegistrationProgress from '../../pages/student/registration progress/RegistrationProgress';
import RegistrationApprovals from '../../pages/admin/registrationApprovals/RegistrationApprovals';

const AppLayout = () => {
  const role =localStorage.getItem("role");
  return (
    <Router>
      {role && <Navlink/>}
      <Routes>
        {!role ?
        (<>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </>):
        (<>
          {role==="admin" && (
            <>
              <Route path="/Approvals" element={<Approvals/>}/>
              <Route path="/SummaryApprovals" element={<SummaryApprovals/>}/>
              <Route path="/EventHistory" element={<EventHistory/>}/>
              <Route path="/RegistrationApprovals" element={<RegistrationApprovals/>}/>
            </>
          )}


          {role==="student" && (
            <>
              <Route path="/RegistrationProgress" element={<RegistrationProgress/>}/>
              <Route path="/Events" element={<Events/>}/>
              <Route path="/EventSummary" element={<EventSummary/>}/>
            </>
          )}
        </>)}
      </Routes>
    </Router>
  )
}


export default AppLayout