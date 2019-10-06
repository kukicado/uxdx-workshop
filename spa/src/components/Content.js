import React, {useEffect, useState } from "react";

import { Row, Col } from "reactstrap";
import { useAuth0 } from "../react-auth0-spa";

const Content = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [cars, setCars] = useState([]);

  console.log(isAuthenticated);

  useEffect(()=>{
    getCars();
  }, [])

  const getCars = async () => {
    try {

      const response = await fetch("http://localhost:3000/api/cars/", {
      });

      const responseData = await response.json();
      setCars(responseData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Row className="d-flex justify-content-between">
    {cars.map(hit =>
        <Col className="col-lg-4 my-5" md={4} key={hit.id}>
          <h4>{hit.brand}</h4>
          <h1>{hit.model}</h1>
          <img className="img-fluid my-3" alt="car" src={"/img/" + hit.img} />
          {isAuthenticated && <div>
            <h3 className="text-success">{hit.price}</h3>
            <a className="btn btn-success" href={"/car/" + hit.id}>Lear More</a>
          </div>}
          {!isAuthenticated && <button className="btn btn-info" onClick={() => loginWithRedirect({})}>Log In to View Price</button>}
        </Col>
    )}
  </Row>
  )
}

/*
class Content extends Component {
  constructor(props){
    super(props)
    this.state = {
      cars: []
    }
    this.callAPI();

  }
  callAPI = () => {
    fetch('http://localhost:3000/api/cars', {})
      .then(response => response.json())
      .then(data => this.setState({cars: data}))
    
  }

  render() {
    const {cars} = this.state;

    return (
      <Row className="d-flex justify-content-between">
        {cars.map(hit =>
            <Col className="col-lg-4 my-5" md={4} key={hit.id}>
              <h4>{hit.brand}</h4>
              <h1>{hit.model}</h1>
              <img className="img-fluid my-3" alt="car" src={"/img/" + hit.img} />
              <h3 className="text-success">{hit.price}</h3>
              <a className="btn btn-success" href={"/car/" + hit.id}>Lear More</a>
              <a className="btn btn-info" href="/login">Log In to View Price</a>
            </Col>
        )}
      </Row>
    );
  }
}
*/

export default Content;
