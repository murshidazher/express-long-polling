import React, { useEffect, useState } from "react";
import logo from './logo.svg';
import './App.css';

function App() {

  const [values, setValues] = useState([]);

  const getFibonacci = async (num) => {
    const response = await fetch(`http://localhost:8080/fib/${num}`);
    const {fib, processId} = await response.json();
    console.log("fib - processId", fib, processId);
    setValues([...values, {value: fib, time: new Date().valueOf()}])
  }

  useEffect(() => { }, []);

  return (
    <div className="App">
      <button type="button" onClick={() => getFibonacci(43)}>43</button>
      <button type="button" onClick={() => getFibonacci(42)}>42</button>
      <button type="button" onClick={() => getFibonacci(1)}>1</button>
      <ul>
        {values.map(({value, time}) => <li key={time}>{`value: ${value} time: ${time}`}</li> )}
      </ul>
    </div>
  );
}

export default App;
