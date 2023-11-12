import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

const numberOfElements = 10;

function RandomNumber() {
    let [vec, setVec] = useState([0]);

    useEffect(() => {
        let unsubscribe = listen<number>("random-integer", (event) => {

            let newVec = vec.slice(0, numberOfElements - 1);
            newVec.unshift(event.payload)

            setVec(newVec);
        });
        // the lambda returned will be executed on cleanup of the effect.
        return () => {
            unsubscribe.then(f => f());
        };
    });

    return <ul>
        {vec.map((number) => <li> {number}</li>)}
     </ul>
}

export default RandomNumber;
