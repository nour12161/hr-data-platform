import { useEffect, useState } from 'react';
import { Dropdown, Nav } from 'react-bootstrap';
import axios from '../axiosConfig';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    axios.get('/notifications/sessions-du-jour')
      .then(res => setNotifications(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <Dropdown as={Nav.Item} className="me-3" show={show} onToggle={setShow}>
      <Dropdown.Toggle as={Nav.Link} className="position-relative">
        <i className="bi bi-bell-fill"></i>
        {notifications.length > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {notifications.length}
          </span>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu align="end">
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <Dropdown.Item key={index}>
              📅 {notif.intitule}
              <br />
              <small className="text-muted">Aujourd’hui</small>
            </Dropdown.Item>
          ))
        ) : (
          <Dropdown.Item disabled>Aucune session aujourd’hui</Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default NotificationBell;
