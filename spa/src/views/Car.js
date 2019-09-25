import React, { useState, useEffect } from "react";
import { Container } from "reactstrap";

import Loading from "../components/Loading";
import { useAuth0 } from "../react-auth0-spa";

const Car = ({location}) => {
  const { loading, user } = useAuth0();
  const [car, setCar] = useState({stats: {}});
  const { getTokenSilently } = useAuth0();

  useEffect(()=>{
    getCar();
  }, [])

  const getCar = async () => {
    try {
      const token = await getTokenSilently();
      console.log(token);

      const response = await fetch("http://localhost:3000/api/cars/" + location.pathname.substring(5,6), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const responseData = await response.json();
      setCar(responseData);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !user) {
    return <Loading />;
  }
  
  return (
    <Container className="mb-5">
      <div className="row">
          <div className="col-lg-8 offset-lg-2 my-5">
              <h4>{car.brand}</h4>
              <h1>{car.model}</h1>
              <img className="img-fluid my-3" alt="car" src={"/img/" + car.img} />
              <h1 className="text-success text-center">{car.price}</h1>
            
            <div className="row my-5">
                <div className="col-lg-4">
                    <h3 className="text-center text-muted">Range</h3>
                    <h3 className="text-center">{car.stats.range} miles</h3>
                </div>
                <div className="col-lg-4">
                <h3 className="text-center text-muted">0-60 mph</h3>
                    <h3 className="text-center">{car.stats.ramp} seconds</h3>
                </div>
                <div className="col-lg-4">
                <h3 className="text-center text-muted">Top Speed</h3>
                    <h3 className="text-center">{car.stats.speed} mph</h3>
                </div>
            </div>

            {car.inventory && <div className="row my-5 p-5 bg-light">
                <div className="col-lg-6">
                    <h3 className="text-center">Stock</h3>
                    <h2 className="text-center">{car.inventory}</h2>
                </div>
                <div className="col-lg-6">
                    <h3 className="text-center">Best Price</h3>
                    <h2 className="text-center text-danger">{car.dealerPrice}</h2>
                </div>
            </div>}

            <a href={"/car/" + location.pathname.substring(5,6)} className="btn btn-block btn-success">Buy Now</a>
                         
          </div>
      </div>

    </Container>
  );
};

export default Car;
